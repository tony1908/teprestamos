import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BrowserProvider, Contract, ethers} from 'ethers';
import {useAccount, useWalletClient} from 'wagmi';
import {RequestModal} from './RequestModal';
import {
  loanContractABI,
  LOAN_CONTRACT_ADDRESS,
} from '../../utils/loanContractABI';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLoanCreated: () => void;
}

export function LoanRequestScreen({visible, onClose, onLoanCreated}: Props) {
  const [amount, setAmount] = useState('0.1');
  const [days, setDays] = useState('7');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState(false);
  const {address, isConnected} = useAccount();
  const {data: walletClient} = useWalletClient();

  // Debug logging for modal visibility
  React.useEffect(() => {
    console.log('LoanRequestScreen visibility changed:', visible);
  }, [visible]);

  const requestLoan = async () => {
    if (!walletClient || !amount.trim() || !days.trim() || !address) {
      return;
    }

    setData(undefined);
    setError(false);
    setIsLoading(true);
    setRequestModalVisible(true);

    try {
      console.log('LoanRequestScreen: Starting transaction process...');
      const ethersProvider = new BrowserProvider(walletClient!);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(
        LOAN_CONTRACT_ADDRESS,
        loanContractABI,
        signer,
      );

      const amountWei = ethers.parseEther(amount);
      const daysInSeconds = parseInt(days) * 24 * 60 * 60;
      const maxPaymentDate = Math.floor(Date.now() / 1000) + daysInSeconds;
      
      console.log('LoanRequestScreen: Sending transaction with amount:', amount, 'MON, days:', days);
      
      const tx = await contract.requestLoan(amountWei, maxPaymentDate);
      
      console.log('LoanRequestScreen: Transaction sent:', tx.hash);
      setData(
        `Loan approved and funded! Transaction hash: ${tx.hash}\nAmount: ${amount} MON received\nDue in: ${days} days`,
      );
      setAmount('0.1');
      setDays('7');
      onLoanCreated();
      
      // Close the modal after successful transaction
      setTimeout(() => {
        setRequestModalVisible(false);
        onClose();
      }, 3000);
      
    } catch (e: any) {
      console.error('LoanRequestScreen: Transaction error:', e);
      setError(true);
      
      if (e.message.includes('insufficient funds')) {
        setData('Insufficient funds. Please make sure you have enough MON tokens for gas fees.');
      } else if (e.message.includes('user rejected')) {
        setData('Transaction was rejected by user.');
      } else if (e.message.includes('already has an active loan')) {
        setData('You already have an active loan. Please pay it back before requesting a new one.');
      } else {
        setData(`Transaction failed: ${e.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValidAmount = () => {
    try {
      const amountNum = parseFloat(amount);
      return amountNum > 0 && amountNum <= 10; // Max 10 MON loan
    } catch {
      return false;
    }
  };

  const isValidDays = () => {
    try {
      const daysNum = parseInt(days);
      return daysNum >= 1 && daysNum <= 30; // 1-30 days
    } catch {
      return false;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.bottomSheet}>
            <SafeAreaView style={styles.safeArea}>
            {/* Handle bar */}
            <View style={styles.handleBar} />
            
            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header with title */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Request Your Loan</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
              <Text style={styles.subtitle}>Get instant crypto loans with flexible terms</Text>
              
              {/* Amount Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Loan Amount</Text>
                <Text style={styles.helperText}>Maximum: 10 MON</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, !isValidAmount() && styles.invalidInput]}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.1"
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.currency}>MON</Text>
                </View>
              </View>
              
              {/* Duration Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Loan Duration</Text>
                <Text style={styles.helperText}>Maximum: 30 days</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, !isValidDays() && styles.invalidInput]}
                    value={days}
                    onChangeText={setDays}
                    placeholder="7"
                    keyboardType="number-pad"
                  />
                  <Text style={styles.currency}>Days</Text>
                </View>
              </View>

              {/* Info Cards */}
              <View style={styles.infoCards}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Instant Approval</Text>
                  <Text style={styles.infoCardText}>Your loan is approved and funded immediately</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>No Credit Check</Text>
                  <Text style={styles.infoCardText}>Blockchain-based lending without traditional requirements</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Flexible Terms</Text>
                  <Text style={styles.infoCardText}>Choose your amount and duration to fit your needs</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!isValidAmount() || !isValidDays() || isLoading || !isConnected) &&
                      styles.disabledButton,
                  ]}
                  onPress={requestLoan}
                  disabled={!isValidAmount() || !isValidDays() || isLoading || !isConnected}>
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Processing...' : !isConnected ? 'Connect Wallet' : 'Get Loan Now'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsTitle}>Important Terms:</Text>
                <Text style={styles.termsText}>• One active loan per user</Text>
                <Text style={styles.termsText}>• Pay back before due date to avoid penalties</Text>
                <Text style={styles.termsText}>• Funds are transferred immediately upon approval</Text>
                <Text style={styles.termsText}>• All transactions are secured on the blockchain</Text>
              </View>
              </View>
            </ScrollView>
            </SafeAreaView>
          </View>
        </View>

      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data}
        rpcError={error ? 'Error processing loan' : undefined}
        onClose={() => setRequestModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 80,
    zIndex: 1000,
  },
  overlayTouchable: {
    height: 80,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
    marginTop: 80,
  },
  safeArea: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  currency: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  invalidInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  infoCards: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#9859c5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#9859c5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  termsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
});