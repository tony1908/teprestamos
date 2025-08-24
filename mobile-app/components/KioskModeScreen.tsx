import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useKioskContext } from '@/contexts/KioskContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RequestModal } from './loan/RequestModal';
import { loanContractABI, LOAN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from '@/utils/loanContractABI';
import { erc20ABI } from '@/utils/erc20ABI';
import { Colors } from '@/constants/Colors';
import { loginImage } from '@/constants/Images';
import { useColorScheme } from '@/hooks/useColorScheme';

interface KioskModeScreenProps {
  loanAmount: string;
  onPaymentRequired?: () => void;
}


export default function KioskModeScreen({ loanAmount, onPaymentRequired }: KioskModeScreenProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isKioskEnabled, enableKioskMode, disableKioskMode, isLoading: kioskLoading } = useKioskMode();
  const { defaultedLoan, checkLoanStatus } = useKioskContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Safety check for required props
  if (!loanAmount) {
    console.error('KioskModeScreen: loanAmount is required but was not provided');
    return (
      <SafeAreaView style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[{ fontSize: 18, color: colors.error }]}>Error: Loan amount not available</Text>
      </SafeAreaView>
    );
  }

  // Dynamic font size based on amount length
  const getAmountFontSize = (amount: string) => {
    const cleanAmount = amount.replace(/[^\d.]/g, ''); // Remove non-numeric characters
    const length = cleanAmount.length;
    
    if (length <= 4) return 48; // Small numbers: 1.23, 12.5
    if (length <= 6) return 40; // Medium numbers: 123.45
    if (length <= 8) return 32; // Large numbers: 12345.67
    return 24; // Very large numbers: 123456.789
  };
  
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

      // Create token contract instance
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        erc20ABI,
        signer,
      );
      
      const loanAmount = BigInt(defaultedLoan.amount);
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(address, LOAN_CONTRACT_ADDRESS);
      
      // If allowance is insufficient, approve first
      if (currentAllowance < loanAmount) {
        setData('Step 1/3: Approving token transfer...');
        const approveTx = await tokenContract.approve(LOAN_CONTRACT_ADDRESS, loanAmount);
        await approveTx.wait();
      }

      let paymentSuccessful = false;
      
      // First attempt: Try direct payment (in case contract allows it)
      try {
        setData(isOverdue 
          ? 'Processing overdue loan payment...' 
          : 'Attempting direct loan payment...'
        );
        const payTx = await contract.payBackLoan(loanAmount);
        await payTx.wait();
        
        setData(
          `✅ Loan payment successful!\n\nTransaction Hash: ${payTx.hash}\nAmount Paid: ${ethers.formatEther(
            defaultedLoan.amount,
          )} tokens\n\n🔓 Device unlocking...`,
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
          
          const payTx = await contract.payBackLoan(loanAmount);
          await payTx.wait();
          
          setData(
            `✅ Loan payment successful!\n\nTransaction Hash: ${payTx.hash}\nAmount Paid: ${ethers.formatEther(
              defaultedLoan.amount,
            )} tokens\n\n🔓 Device unlocking...`,
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
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: `data:image/png;base64,${loginImage}` }}
          style={styles.kioskImage}
          resizeMode="cover"
        />
      </View>
      
      <SafeAreaView style={styles.contentSection}>
        <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          
          <Text style={[styles.title, { color: colors.text }]}>Device Locked</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isDefaulted ? 'Loan defaulted' : isOverdue ? 'Payment overdue' : 'Payment required'}
          </Text>
        </View>

        {/* Amount Card */}
        <View style={[styles.amountCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount to Repay</Text>
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amountValue, 
              { 
                color: colors.text,
                fontSize: getAmountFontSize(loanAmount),
                lineHeight: getAmountFontSize(loanAmount) * 1.1
              }
            ]}>{loanAmount}</Text>
            <Text style={[
              styles.currencyLabel, 
              { 
                color: colors.textSecondary,
                fontSize: Math.max(getAmountFontSize(loanAmount) * 0.375, 14) // Scale currency with amount but min 14px
              }
            ]}>Tokens</Text>
          </View>
          <View style={[styles.walletContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>Wallet</Text>
            <Text style={[styles.walletAddress, { color: colors.text }]}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[
            styles.payButton, 
            { backgroundColor: isLoading ? colors.border : colors.primary },
            isLoading && { opacity: 0.7 }
          ]} 
          onPress={payBackLoan}
          disabled={isLoading || kioskLoading}
        >
          <Text style={styles.payButtonText}>
            {isLoading ? 'Processing...' : 'Pay & Unlock Device'}
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to unlock</Text>
          <Text style={[styles.instructionItem, { color: colors.textSecondary }]}>
            • Complete the loan payment above
          </Text>
          <Text style={[styles.instructionItem, { color: colors.textSecondary }]}>
            • Device unlocks automatically
          </Text>
          <Text style={[styles.instructionItem, { color: colors.textSecondary }]}>
            • Contact support if needed
          </Text>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity 
          style={[styles.emergencyButton, { borderColor: colors.border }]} 
          onPress={handleEmergencyContact}
        >
          <Text style={[styles.emergencyButtonText, { color: colors.textSecondary }]}>Emergency Contact</Text>
        </TouchableOpacity>

        {/* Status Footer */}
        <View style={styles.footer}>
          <View style={[styles.statusDot, { backgroundColor: isKioskEnabled ? colors.error : colors.success }]} />
          <Text style={[styles.statusFooterText, { color: colors.textSecondary }]}>
            {isKioskEnabled ? 'Device locked' : 'Device unlocked'} • 
            {Platform.OS === 'android' ? 'Kiosk mode active' : 'iOS compatibility mode'}
          </Text>
        </View>
        </View>
      </SafeAreaView>
      
      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data}
        rpcError={error ? 'Error processing payment from kiosk mode' : undefined}
        onClose={() => setRequestModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: '30%',
  },
  kioskImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: -30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  amountCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  amountValue: {
    fontWeight: '700',
  },
  currencyLabel: {
    fontWeight: '600',
    marginLeft: 8,
    marginBottom: 4,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  payButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  emergencyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusFooterText: {
    fontSize: 12,
    fontWeight: '500',
  },
});