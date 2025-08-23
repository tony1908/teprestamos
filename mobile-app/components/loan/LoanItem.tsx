import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {BrowserProvider, Contract, ethers} from 'ethers';
import {useAccount, useWalletClient} from 'wagmi';
import {RequestModal} from './RequestModal';
import {
  loanContractABI,
  LOAN_CONTRACT_ADDRESS,
} from '../../utils/loanContractABI';

export interface LoanItemData {
  amount: string;
  maxPaymentDate: number;
  status: number; // 0: Active, 1: Overdue, 2: Paid, 3: Defaulted
  createdAt: number;
  isOverdue: boolean;
}

interface Props {
  loan: LoanItemData;
  onUpdate: () => void;
}

export function LoanItem({loan, onUpdate}: Props) {
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState(false);
  const {address} = useAccount();
  const {data: walletClient} = useWalletClient();

  const payBackLoan = async () => {
    if (!walletClient || (loan.status !== 0 && loan.status !== 1) || !address) {
      return;
    }

    setData(undefined);
    setError(false);
    setIsLoading(true);
    setRequestModalVisible(true);

    try {
      const ethersProvider = new BrowserProvider(walletClient!);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(
        LOAN_CONTRACT_ADDRESS,
        loanContractABI,
        signer,
      );

      const tx = await contract.payBackLoan({
        value: loan.amount, // Pay back the exact amount
      });
      
      setData(
        `Loan paid back successfully! Transaction hash: ${tx.hash}\nAmount: ${ethers.formatEther(
          loan.amount,
        )} MON`,
      );
      onUpdate();
    } catch (e: any) {
      console.error(e);
      setError(true);
      if (e.message.includes('insufficient funds')) {
        setData('Insufficient funds. You need the full loan amount plus gas fees to pay back.');
      } else {
        setData(`Error: ${e.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return 'Active';
      case 1:
        return 'Overdue';
      case 2:
        return 'Paid';
      case 3:
        return 'Defaulted';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return '#4CAF50'; // Green for active
      case 1:
        return '#f44336'; // Red for overdue
      case 2:
        return '#2196F3'; // Blue for paid
      case 3:
        return '#9e9e9e'; // Gray for defaulted
      default:
        return '#999';
    }
  };

  const getDaysRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = loan.maxPaymentDate - now;
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) {
      return `${days} days ${hours}h remaining`;
    } else if (remaining > 0) {
      return `${hours} hours remaining`;
    } else {
      return 'Overdue';
    }
  };

  return (
    <View style={[
      styles.container, 
      loan.isOverdue && styles.overdueContainer,
      loan.status === 2 && styles.repaidContainer
    ]}>
      <View style={styles.header}>
        <Text style={[styles.status, {color: getStatusColor(loan.status)}]}>
          {getStatusText(loan.status)}
        </Text>
        <Text style={styles.date}>{formatDate(loan.createdAt)}</Text>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Loan Amount:</Text>
        <Text style={styles.amount}>
          {ethers.formatEther(loan.amount)} MON
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailLabel}>Due Date:</Text>
        <Text style={[
          styles.detailValue,
          loan.isOverdue && styles.overdueText
        ]}>
          {formatDateTime(loan.maxPaymentDate)}
        </Text>
      </View>

      {(loan.status === 0 || loan.status === 1) && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Time Remaining:</Text>
          <Text style={[
            styles.detailValue,
            loan.isOverdue && styles.overdueText
          ]}>
            {getDaysRemaining()}
          </Text>
        </View>
      )}

      {loan.isOverdue && (loan.status === 0 || loan.status === 1) && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ Loan is overdue!</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        {loan.status === 0 || loan.status === 1 ? (
          <TouchableOpacity
            style={[styles.button, styles.payButton]}
            onPress={payBackLoan}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Paying...' : 'Pay Back Loan'}
            </Text>
          </TouchableOpacity>
        ) : loan.status === 2 ? (
          <View style={[styles.button, styles.repaidButton]}>
            <Text style={styles.repaidButtonText}>✓ Paid</Text>
          </View>
        ) : (
          <View style={[styles.button, styles.defaultedButton]}>
            <Text style={styles.defaultedButtonText}>Defaulted</Text>
          </View>
        )}
      </View>

      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data}
        rpcError={error ? 'Error paying back loan' : undefined}
        onClose={() => setRequestModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
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
  overdueContainer: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  repaidContainer: {
    backgroundColor: '#f0f8ff',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  overdueText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  warningText: {
    color: '#f57c00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#4CAF50',
  },
  pendingButton: {
    backgroundColor: '#ff9800',
  },
  repaidButton: {
    backgroundColor: '#2196F3',
  },
  defaultedButton: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  repaidButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  defaultedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});