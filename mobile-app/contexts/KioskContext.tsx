import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { loanContractABI, LOAN_CONTRACT_ADDRESS } from '@/utils/loanContractABI';

interface LoanData {
  amount: string;
  maxPaymentDate: number;
  status: number;
  createdAt: number;
  isOverdue: boolean;
}

interface KioskContextType {
  isKioskModeActive: boolean;
  defaultedLoan: LoanData | null;
  checkLoanStatus: () => Promise<void>;
  handlePaymentAttempt: () => void;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const [isKioskModeActive, setIsKioskModeActive] = useState(false);
  const [defaultedLoan, setDefaultedLoan] = useState<LoanData | null>(null);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const checkLoanStatus = async () => {
    if (!walletClient || !address || !isConnected) {
      console.log('checkLoanStatus: Missing requirements');
      return;
    }

    try {
      console.log('Checking loan status for kiosk mode...');
      const ethersProvider = new BrowserProvider(walletClient);
      const signer = await ethersProvider.getSigner();
      
      const network = await ethersProvider.getNetwork();
      if (network.chainId !== 10143n) {
        console.log('Wrong network for loan status check');
        return;
      }
      
      const contract = new Contract(
        LOAN_CONTRACT_ADDRESS,
        loanContractABI,
        signer,
      );

      const userLoan = await contract.getActiveLoan(address);
      
      if (userLoan.amount > 0) {
        const loanData: LoanData = {
          amount: userLoan.amount.toString(),
          maxPaymentDate: Number(userLoan.maxPaymentDate),
          status: Number(userLoan.status),
          createdAt: Number(userLoan.createdAt),
          isOverdue: userLoan.isOverdue,
        };

        console.log('Loan data:', loanData);
        
        // Check if loan is overdue (status 1) or defaulted (status 3)
        if (loanData.status === 1) {
          console.log('🔒 LOAN OVERDUE - ACTIVATING KIOSK MODE');
          setDefaultedLoan(loanData);
          setIsKioskModeActive(true);
        } else if (loanData.status === 3) {
          console.log('🔒 LOAN DEFAULTED - ACTIVATING KIOSK MODE');
          setDefaultedLoan(loanData);
          setIsKioskModeActive(true);
        } else {
          // If loan exists but not overdue or defaulted, disable kiosk mode
          console.log(`Loan status is ${loanData.status} - disabling kiosk mode`);
          setIsKioskModeActive(false);
          setDefaultedLoan(null);
        }
      } else {
        // No active loan, disable kiosk mode
        setIsKioskModeActive(false);
        setDefaultedLoan(null);
      }
    } catch (error) {
      console.error('Error checking loan status:', error);
    }
  };

  const handlePaymentAttempt = () => {
    console.log('Payment attempt initiated from kiosk mode');
    // This will trigger a re-check of loan status with more frequent checks
    let checkCount = 0;
    const maxChecks = 10;
    
    const intervalId = setInterval(() => {
      checkCount++;
      console.log(`Payment check ${checkCount}/${maxChecks}`);
      checkLoanStatus();
      
      if (checkCount >= maxChecks || !isKioskModeActive) {
        clearInterval(intervalId);
      }
    }, 2000); // Check every 2 seconds for up to 20 seconds
  };

  // Check loan status periodically when connected
  useEffect(() => {
    if (isConnected && walletClient && address) {
      checkLoanStatus();
      
      // Check every 30 seconds for loan status changes
      const interval = setInterval(checkLoanStatus, 30000);
      return () => clearInterval(interval);
    } else {
      // Reset kiosk mode if disconnected
      setIsKioskModeActive(false);
      setDefaultedLoan(null);
    }
  }, [isConnected, walletClient, address]);

  return (
    <KioskContext.Provider 
      value={{ 
        isKioskModeActive, 
        defaultedLoan, 
        checkLoanStatus, 
        handlePaymentAttempt 
      }}
    >
      {children}
    </KioskContext.Provider>
  );
}

export function useKioskContext() {
  const context = useContext(KioskContext);
  if (context === undefined) {
    throw new Error('useKioskContext must be used within a KioskProvider');
  }
  return context;
}