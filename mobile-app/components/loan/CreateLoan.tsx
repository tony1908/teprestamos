import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {BrowserProvider, Contract, ethers} from 'ethers';
import {useAccount, useWalletClient} from 'wagmi';
import {RequestModal} from './RequestModal';
import {
  loanContractABI,
  LOAN_CONTRACT_ADDRESS,
} from '../../utils/loanContractABI';

interface Props {
  onLoanCreated: () => void;
}

export function CreateLoan({onLoanCreated}: Props) {
  const [amount, setAmount] = useState('0.1');
  const [days, setDays] = useState('7');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState(false);
  const {address, isConnected} = useAccount();
  const {data: walletClient} = useWalletClient();

  const requestLoan = async () => {
    if (!walletClient || !amount.trim() || !days.trim() || !address) {
      return;
    }

    setData(undefined);
    setError(false);
    setIsLoading(true);
    setRequestModalVisible(true);

    try {
      console.log('CreateLoan: Starting transaction process...');
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
      
      console.log('CreateLoan: Sending transaction with amount:', amount, 'MON, days:', days);
      
      const tx = await contract.requestLoan(amountWei, maxPaymentDate);
      
      console.log('CreateLoan: Transaction sent:', tx.hash);
      setData(
        `Loan approved and funded! Transaction hash: ${tx.hash}\nAmount: ${amount} MON received\nDue in: ${days} days`,
      );
      setAmount('0.1');
      setDays('7');
      onLoanCreated();
    } catch (e: any) {
      console.error('CreateLoan: Transaction error:', e);
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

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.connectMessage}>
          Connect your wallet to get an instant loan
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Instant Loan</Text>
      
      <Text style={styles.label}>
        Amount (MON) - Max: 10 MON
      </Text>
      <TextInput
        style={[styles.input, !isValidAmount() && styles.invalidInput]}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.1"
        keyboardType="decimal-pad"
      />
      
      <Text style={styles.label}>
        Loan Duration (Days) - Max: 30 days
      </Text>
      <TextInput
        style={[styles.input, !isValidDays() && styles.invalidInput]}
        value={days}
        onChangeText={setDays}
        placeholder="7"
        keyboardType="number-pad"
      />
      
      <TouchableOpacity
        style={[
          styles.button,
          (!isValidAmount() || !isValidDays() || isLoading) &&
            styles.disabledButton,
        ]}
        onPress={requestLoan}
        disabled={!isValidAmount() || !isValidDays() || isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Get Loan Now'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Important:</Text>
        <Text style={styles.infoText}>
          • Loans are instantly approved and funded
        </Text>
        <Text style={styles.infoText}>
          • You can only have one active loan at a time
        </Text>
        <Text style={styles.infoText}>
          • Pay back before the due date to avoid penalties
        </Text>
      </View>

      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data}
        rpcError={error ? 'Error processing loan' : undefined}
        onClose={() => setRequestModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  invalidInput: {
    borderColor: '#ff6b6b',
    backgroundColor: '#ffebeb',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  infoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});