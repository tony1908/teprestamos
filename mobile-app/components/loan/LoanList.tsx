import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {BrowserProvider, Contract, ethers} from 'ethers';
import {useAccount, useWalletClient} from 'wagmi';
import {LoanItem, LoanItemData} from './LoanItem';
import {CreateLoan} from './CreateLoan';
import {
  loanContractABI,
  LOAN_CONTRACT_ADDRESS,
} from '../../utils/loanContractABI';

export function LoanList() {
  const [loan, setLoan] = useState<LoanItemData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractStats, setContractStats] = useState({
    contractBalance: '0',
  });
  const {address, isConnected} = useAccount();
  const {data: walletClient} = useWalletClient();

  useEffect(() => {
    console.log('LoanList useEffect:', {isConnected, hasProvider: !!walletClient, address});
    setError(null);
    
    if (isConnected && walletClient && address) {
      loadLoan();
      loadContractStats();
    } else {
      setLoan(null);
      setContractStats({contractBalance: '0'});
      setLoading(false);
    }
  }, [isConnected, walletClient, address, loadLoan, loadContractStats]);

  const loadLoan = useCallback(async () => {
    if (!walletClient || !address) {
      console.log('loadLoan: Missing provider or address');
      return;
    }

    console.log('loadLoan: Starting to load loan for', address);
    setLoading(true);
    setError(null);
    
    const timeoutId = setTimeout(() => {
      console.log('loadLoan: Timeout reached, stopping loading');
      setLoading(false);
      setError('Request timed out. Please check your connection and try again.');
    }, 15000);
    
    try {
      console.log('Creating provider and contract...');
      const ethersProvider = new BrowserProvider(walletClient!);
      const signer = await ethersProvider.getSigner();
      
      const network = await ethersProvider.getNetwork();
      const networkName = network.name === 'unknown' ? 'Monad Testnet' : network.name;
      console.log('Current network:', network.chainId.toString(), networkName);
      
      if (network.chainId !== 10143n) {
        throw new Error(`Wrong network. Please switch to Monad Testnet (Chain ID: 10143). Currently on: ${network.chainId.toString()}`);
      }
      
      const contract = new Contract(
        LOAN_CONTRACT_ADDRESS,
        loanContractABI,
        signer,
      );

      const code = await ethersProvider.getCode(LOAN_CONTRACT_ADDRESS);
      if (code === '0x') {
        throw new Error(`Contract not found at address ${LOAN_CONTRACT_ADDRESS}. Please verify the contract address.`);
      }
      
      console.log('Contract verified, calling getActiveLoan...');
      
      const userLoan = await contract.getActiveLoan(address);
      
      clearTimeout(timeoutId);
      console.log('Got user loan:', userLoan);
      
      if (userLoan.amount > 0) {
        const formattedLoan: LoanItemData = {
          amount: userLoan.amount.toString(),
          maxPaymentDate: Number(userLoan.maxPaymentDate),
          status: Number(userLoan.status),
          createdAt: Number(userLoan.createdAt),
          isOverdue: userLoan.isOverdue,
        };

        console.log('Formatted loan:', formattedLoan);
        setLoan(formattedLoan);
      } else {
        setLoan(null);
      }
      setError(null);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error loading loan:', error);
      
      let errorMessage = 'Failed to load loan';
      if (error.message.includes('timeout') || error.message.includes('network')) {
        errorMessage = 'Network timeout. Please check your connection to Monad testnet and try again.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'You may need testnet MON tokens for gas fees. Please get some from the faucet.';
      } else if (error.message.includes('Wrong network')) {
        errorMessage = error.message;
      } else if (error.message.includes('Contract not found')) {
        errorMessage = error.message;
      } else if (error.message.includes('missing revert data') || error.message.includes('CALL_EXCEPTION')) {
        console.log('Contract call failed, showing empty state');
        setLoan(null);
        setError(null);
        setLoading(false);
        return;
      } else {
        errorMessage = `Failed to load loan: ${error.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      setLoan(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [walletClient, address]);

  const loadContractStats = useCallback(async () => {
    if (!walletClient || !address) {
      console.log('loadContractStats: Missing provider or address');
      return;
    }

    try {
      console.log('loadContractStats: Loading contract stats...');
      const ethersProvider = new BrowserProvider(walletClient!);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(
        LOAN_CONTRACT_ADDRESS,
        loanContractABI,
        signer,
      );

      const balance = await contract.getContractBalance();

      console.log('Contract stats:', {balance: ethers.formatEther(balance)});
      
      setContractStats({
        contractBalance: ethers.formatEther(balance),
      });
    } catch (error) {
      console.error('Error loading contract stats:', error);
      console.log('Using default stats due to error');
    }
  }, [walletClient, address]);

  const handleLoanCreated = () => {
    loadLoan();
    loadContractStats();
    setShowCreateForm(false);
  };

  const handleLoanUpdated = () => {
    loadLoan();
    loadContractStats();
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{loan ? '1' : '0'}</Text>
        <Text style={styles.statLabel}>Your Active Loans</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>
          {parseFloat(contractStats.contractBalance).toFixed(4)}
        </Text>
        <Text style={styles.statLabel}>Available Funds (MON)</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monad Loans</Text>
      
      {renderStats()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, loan && styles.disabledButton]}
          onPress={() => setShowCreateForm(!showCreateForm)}
          disabled={!!loan}>
          <Text style={styles.createButtonText}>
            {showCreateForm ? '✕ Cancel' : '+ Request Loan'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={loadLoan}>
          <Text style={styles.refreshButtonText}>⟳ Refresh</Text>
        </TouchableOpacity>
      </View>

      {loan && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            You can only have one active loan at a time. Pay back your current loan to request a new one.
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLoan}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCreateForm && !loan && (
        <CreateLoan onLoanCreated={handleLoanCreated} />
      )}

      {loading && !showCreateForm && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading loan...</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLoan} />
        }>
        
        {loan && (
          <>
            <Text style={styles.sectionTitle}>
              Your Active Loan
            </Text>
            <LoanItem
              loan={loan}
              onUpdate={handleLoanUpdated}
            />
          </>
        )}
        
        {!loan && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active loans!</Text>
            <Text style={styles.emptySubtext}>
              Request a loan to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#e8e8e8',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebeb',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});