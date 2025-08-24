import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
        return colors.success; // Green for active
      case 1:
        return colors.error; // Red for overdue
      case 2:
        return colors.primary; // Blue for paid
      case 3:
        return colors.textSecondary; // Gray for defaulted
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBgColor = (status: number) => {
    switch (status) {
      case 0:
        return colors.success + '15'; // Light green for active
      case 1:
        return colors.error + '15'; // Light red for overdue
      case 2:
        return colors.primary + '15'; // Light blue for paid
      case 3:
        return colors.textSecondary + '15'; // Light gray for defaulted
      default:
        return colors.backgroundSecondary;
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
      { 
        backgroundColor: colors.card, 
        shadowColor: colors.shadow,
        borderColor: loan.isOverdue ? colors.error : (loan.status === 2 ? colors.primary : 'transparent'),
        borderWidth: loan.isOverdue || loan.status === 2 ? 1 : 0
      }
    ]}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(loan.status) }]}>
          <Text style={[styles.status, {color: getStatusColor(loan.status)}]}>
            {getStatusText(loan.status)}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(loan.createdAt)}</Text>
      </View>
      
      <View style={[styles.amountContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Loan Amount</Text>
        <Text style={[styles.amount, { color: colors.primary }]}>
          {ethers.formatEther(loan.amount)} MON
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date</Text>
        <Text style={[
          styles.detailValue,
          { color: loan.isOverdue ? colors.error : colors.text },
          loan.isOverdue && { fontWeight: '600' }
        ]}>
          {formatDateTime(loan.maxPaymentDate)}
        </Text>
      </View>

      {(loan.status === 0 || loan.status === 1) && (
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time Remaining</Text>
          <Text style={[
            styles.detailValue,
            { color: loan.isOverdue ? colors.error : colors.text },
            loan.isOverdue && { fontWeight: '600' }
          ]}>
            {getDaysRemaining()}
          </Text>
        </View>
      )}

      {loan.isOverdue && (loan.status === 0 || loan.status === 1) && (
        <View style={[styles.warningContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Text style={[styles.warningText, { color: colors.error }]}>⚠️ Loan is overdue!</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        {loan.status === 0 || loan.status === 1 ? (
          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: isLoading ? colors.border : colors.primary },
              isLoading && { opacity: 0.7 }
            ]}
            onPress={payBackLoan}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Pay Back Loan'}
            </Text>
          </TouchableOpacity>
        ) : loan.status === 2 ? (
          <View style={[styles.button, { backgroundColor: colors.success }]}>
            <Text style={styles.buttonText}>✓ Paid</Text>
          </View>
        ) : (
          <View style={[styles.button, { backgroundColor: colors.textSecondary }]}>
            <Text style={styles.buttonText}>Device Locked</Text>
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
    padding: 20,
    marginHorizontal: 24,
    marginVertical: 8,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  warningContainer: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  warningText: {
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});