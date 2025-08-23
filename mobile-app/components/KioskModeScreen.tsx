import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useKioskContext } from '@/contexts/KioskContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RequestModal } from './loan/RequestModal';
import { loanContractABI, LOAN_CONTRACT_ADDRESS } from '@/utils/loanContractABI';

interface KioskModeScreenProps {
  loanAmount: string;
  onPaymentRequired: () => void;
}


export default function KioskModeScreen({ loanAmount, onPaymentRequired }: KioskModeScreenProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isKioskEnabled, enableKioskMode, disableKioskMode, isLoading: kioskLoading } = useKioskMode();
  const { defaultedLoan, checkLoanStatus } = useKioskContext();
  
  // Determine loan status for messaging
  const isDefaulted = defaultedLoan?.status === 3;
  const isOverdue = defaultedLoan?.status === 1;
  
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState(false);

  useEffect(() => {
    // Automatically enable kiosk mode when this screen mounts
    if (Platform.OS === 'android' && !isKioskEnabled) {
      enableKioskMode();
    }
  }, [enableKioskMode, isKioskEnabled]);

  const payBackLoan = async () => {
    if (!walletClient || !defaultedLoan || !address) {
      return;
    }

    setData(undefined);
    setError(false);
    setIsLoading(true);
    setRequestModalVisible(true);

    try {
      const ethersProvider = new BrowserProvider(walletClient);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(
        LOAN_CONTRACT_ADDRESS,
        loanContractABI,
        signer,
      );

      let paymentSuccessful = false;
      
      // First attempt: Try direct payment (in case contract allows it)
      try {
        setData(isOverdue 
          ? 'Processing overdue loan payment...' 
          : 'Attempting direct loan payment...'
        );
        const payTx = await contract.payBackLoan({
          value: defaultedLoan.amount,
        });
        
        setData(
          `✅ Loan payment successful!\n\nTransaction Hash: ${payTx.hash}\nAmount Paid: ${ethers.formatEther(
            defaultedLoan.amount,
          )} MON\n\n🔓 Device unlocking...`,
        );
        paymentSuccessful = true;
        
      } catch (directPayError: any) {
        console.log('Direct payment failed, trying status update approach:', directPayError.message);
        
        // Second attempt: Update status first, then pay
        try {
          setData('Step 1/2: Updating loan status to allow payment...');
          
          const updateTx = await contract.updateLoanStatus(address, 1); // Set to overdue
          await updateTx.wait();
          
          setData('Step 2/2: Processing loan payment...');
          
          const payTx = await contract.payBackLoan({
            value: defaultedLoan.amount,
          });
          
          setData(
            `✅ Loan payment successful!\n\nTransaction Hash: ${payTx.hash}\nAmount Paid: ${ethers.formatEther(
              defaultedLoan.amount,
            )} MON\n\n🔓 Device unlocking...`,
          );
          paymentSuccessful = true;
          
        } catch (statusUpdateError: any) {
          console.log('Status update approach also failed:', statusUpdateError.message);
          throw directPayError; // Throw the original error
        }
      }
      
      if (paymentSuccessful) {
        // Immediately start checking loan status and disable kiosk mode
        let checkCount = 0;
        const maxChecks = 15;
        
        const checkInterval = setInterval(async () => {
          checkCount++;
          console.log(`Post-payment check ${checkCount}/${maxChecks}`);
          
          await checkLoanStatus();
          
          // Force disable kiosk mode after a few checks
          if (checkCount >= 3) {
            console.log('Payment successful - forcibly disabling kiosk mode');
            await disableKioskMode();
          }
          
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
          }
        }, 1000); // Check every second
      }
      
    } catch (e: any) {
      console.error('Payment error:', e);
      setError(true);
      
      let errorMessage = '❌ Payment failed: ';
      if (e.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds. You need the full loan amount plus gas fees to complete the payment.';
      } else if (e.message.includes('missing revert data') || e.message.includes('CALL_EXCEPTION')) {
        errorMessage += `The smart contract is rejecting payment for defaulted loans. 

📞 Please contact loan administrator to:
1. Reset loan status to Active/Overdue
2. Then retry payment to unlock device

⚠️ This device will remain locked until payment is processed.`;
      } else if (e.message.includes('access denied') || e.message.includes('unauthorized')) {
        errorMessage += 'Unauthorized to update loan status. Contact loan administrator for assistance.';
      } else {
        errorMessage += (e.message || 'Unknown error occurred.') + '\n\nContact support if this issue persists.';
      }
      
      setData(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact',
      'If this is a medical emergency, please call local emergency services immediately. For device issues, contact system administrator.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Emergency Call', onPress: () => {
          // In a real implementation, you might want to allow emergency calls
          Alert.alert('Emergency', 'Emergency services would be contacted here.');
        }}
      ]
    );
  };

  return (
    <ThemedView style={[
      styles.container, 
      isDefaulted ? styles.defaultedContainer : isOverdue ? styles.overdueContainer : {}
    ]}>
      <View style={styles.lockContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <ThemedText type="title" style={styles.title}>Device Locked</ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          {isDefaulted ? 'Loan Default Mode' : isOverdue ? 'Loan Overdue Mode' : 'Loan Payment Required'}
        </ThemedText>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>
            {isDefaulted ? '🚫' : isOverdue ? '⏰' : '⚠️'}
          </Text>
          <ThemedText style={styles.warningTitle}>
            {isDefaulted ? 'Loan Defaulted' : isOverdue ? 'Loan Overdue' : 'Loan Payment Required'}
          </ThemedText>
          <ThemedText style={styles.warningText}>
            {isDefaulted 
              ? 'This device has been locked due to a defaulted loan that requires immediate payment.'
              : isOverdue 
              ? 'This device has been locked because your loan payment is overdue.'
              : 'This device has been locked due to an unpaid loan.'
            }
          </ThemedText>
        </View>

        <View style={styles.loanDetailsContainer}>
          <ThemedText style={styles.detailLabel}>Outstanding Amount:</ThemedText>
          <ThemedText style={styles.loanAmount}>{loanAmount} MON</ThemedText>
          
          <ThemedText style={styles.detailLabel}>Wallet Address:</ThemedText>
          <ThemedText style={styles.walletAddress}>
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </ThemedText>
        </View>

        <View style={styles.instructionsContainer}>
          <ThemedText style={styles.instructionsTitle}>To Unlock This Device:</ThemedText>
          <ThemedText style={styles.instructionsText}>
            1. Pay back the outstanding loan amount
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            2. The device will automatically unlock once payment is confirmed
          </ThemedText>
          <ThemedText style={styles.instructionsText}>
            3. Contact support if you need assistance
          </ThemedText>
        </View>

        <TouchableOpacity 
          style={styles.paymentButton} 
          onPress={payBackLoan}
          disabled={isLoading || kioskLoading}
        >
          <ThemedText style={styles.paymentButtonText}>
            {isLoading 
              ? 'Processing Payment...' 
              : isDefaulted 
              ? 'Pay Defaulted Loan & Unlock'
              : isOverdue
              ? 'Pay Overdue Loan & Unlock'
              : 'Pay Back Loan & Unlock'
            }
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.emergencyButton} 
          onPress={handleEmergencyContact}
        >
          <ThemedText style={styles.emergencyButtonText}>Emergency Contact</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <ThemedText style={styles.statusText}>
          Status: {isKioskEnabled ? 'LOCKED' : 'UNLOCKED'}
        </ThemedText>
        <ThemedText style={styles.platformText}>
          {Platform.OS === 'android' 
            ? 'Kiosk mode active - all device functions restricted' 
            : 'Kiosk mode only available on Android'}
        </ThemedText>
      </View>

      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data}
        rpcError={error ? 'Error processing payment from kiosk mode' : undefined}
        onClose={() => setRequestModalVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f44336', // Default red for general lock
    padding: 20,
  },
  overdueContainer: {
    backgroundColor: '#ff9800', // Orange for overdue
  },
  defaultedContainer: {
    backgroundColor: '#d32f2f', // Dark red for defaulted
  },
  lockContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  lockIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 10,
  },
  warningContainer: {
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f57c00',
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#bf360c',
    textAlign: 'center',
    lineHeight: 22,
  },
  loanDetailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 15,
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 25,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 18,
  },
  paymentButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  platformText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    opacity: 0.8,
  },
});