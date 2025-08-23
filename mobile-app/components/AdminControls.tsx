import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RequestModal } from './loan/RequestModal';
import { loanContractABI, LOAN_CONTRACT_ADDRESS } from '@/utils/loanContractABI';
import { useKioskContext } from '@/contexts/KioskContext';

export function AdminControls() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { checkLoanStatus } = useKioskContext();
  
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState(false);

  const updateLoanStatus = async (status: number, statusName: string) => {
    if (!walletClient || !address) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    const confirmAction = await new Promise((resolve) => {
      Alert.alert(
        'Confirm Action',
        `Are you sure you want to set loan status to ${statusName}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirm', style: 'destructive', onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmAction) return;

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

      const tx = await contract.updateLoanStatus(address, status);
      
      setData(
        `✅ Loan status updated to ${statusName}!\n\nTransaction Hash: ${tx.hash}\n\nRefreshing loan data...`,
      );
      
      // Refresh loan status
      setTimeout(() => {
        checkLoanStatus();
      }, 2000);
      
    } catch (e: any) {
      console.error('Admin update error:', e);
      setError(true);
      
      let errorMessage = `Failed to update loan status: `;
      if (e.message.includes('access denied') || e.message.includes('unauthorized') || e.message.includes('Ownable')) {
        errorMessage += 'Unauthorized. Only the contract owner can update loan status.';
      } else {
        errorMessage += e.message || 'Unknown error occurred.';
      }
      
      setData(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🔧 Admin Controls</ThemedText>
      <ThemedText style={styles.subtitle}>Loan Status Management</ThemedText>
      
      <ThemedText style={styles.warning}>
        ⚠️ These are administrative functions for testing loan default scenarios.
      </ThemedText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.adminButton, styles.activeButton]}
          onPress={() => updateLoanStatus(0, 'Active')}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Set Active (0)</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.adminButton, styles.overdueButton]}
          onPress={() => updateLoanStatus(1, 'Overdue')}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Set Overdue (1)</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.adminButton, styles.paidButton]}
          onPress={() => updateLoanStatus(2, 'Paid')}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Set Paid (2)</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.adminButton, styles.defaultedButton]}
          onPress={() => updateLoanStatus(3, 'Defaulted')}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Set Defaulted (3)</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.instructions}>
        🔒 "Set Overdue" or "Set Defaulted" will activate kiosk mode.{'\n'}
        💰 "Set Active" to reset and disable kiosk mode.{'\n'}
        ✅ "Set Paid" to mark loan as completed.
      </ThemedText>

      <RequestModal
        isVisible={requestModalVisible}
        isLoading={isLoading}
        rpcResponse={data}
        rpcError={error ? 'Admin operation failed' : undefined}
        onClose={() => setRequestModalVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#e65100',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    color: '#666',
  },
  warning: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    color: '#f57c00',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  adminButton: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  overdueButton: {
    backgroundColor: '#f44336',
  },
  paidButton: {
    backgroundColor: '#2196F3',
  },
  defaultedButton: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 16,
  },
});