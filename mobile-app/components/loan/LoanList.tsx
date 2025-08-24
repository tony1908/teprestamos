import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { loansImage } from '@/constants/Images';
import { useColorScheme } from '@/hooks/useColorScheme';
import {BrowserProvider, Contract, ethers} from 'ethers';
import {useAccount, useWalletClient, useBalance} from 'wagmi';
import {LoanItem, LoanItemData} from './LoanItem';
import {CreateLoan} from './CreateLoan';
import {LoanRequestScreen} from './LoanRequestScreen';
import {
  loanContractABI,
  LOAN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
} from '../../utils/loanContractABI';
import { erc20ABI } from '../../utils/erc20ABI';

export function LoanList() {
  const [loan, setLoan] = useState<LoanItemData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLoanRequestScreen, setShowLoanRequestScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractStats, setContractStats] = useState({
    contractBalance: '0',
  });
  const {address, isConnected} = useAccount();
  const {data: walletClient} = useWalletClient();
  const {data: tokenBalance, refetch: refetchBalance} = useBalance({
    address,
    token: '0xf9E1CcC93c1b353888deF17506F95B5D5363D902',
  });
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      
      // Only consider it an active loan if amount > 0 AND status is Active (0) or Overdue (1)
      if (userLoan.amount > 0 && (Number(userLoan.status) === 0 || Number(userLoan.status) === 1)) {
        const formattedLoan: LoanItemData = {
          amount: userLoan.amount.toString(),
          maxPaymentDate: Number(userLoan.maxPaymentDate),
          status: Number(userLoan.status),
          createdAt: Number(userLoan.createdAt),
          isOverdue: userLoan.isOverdue,
        };

        console.log('Formatted active loan:', formattedLoan);
        setLoan(formattedLoan);
      } else {
        console.log('No active loan - amount:', userLoan.amount.toString(), 'status:', Number(userLoan.status));
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

  useEffect(() => {
    console.log('showLoanRequestScreen state changed:', showLoanRequestScreen);
  }, [showLoanRequestScreen]);

  const handleLoanCreated = () => {
    loadLoan();
    loadContractStats();
    setShowCreateForm(false);
    setShowLoanRequestScreen(false);
  };

  const handleLoanUpdated = () => {
    loadLoan();
    loadContractStats();
    refetchBalance?.();
  };

  const handleRefresh = () => {
    loadLoan();
    loadContractStats();
    refetchBalance?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: `data:image/png;base64,${loansImage}` }}
          style={styles.loanImage}
          resizeMode="cover"
        />
      </View>
      
      <SafeAreaView style={styles.contentSection}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Te prestamos</Text>
          <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.balanceHeader}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>💰 Your Balance</Text>
            </View>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>
              {tokenBalance ? `${parseFloat(tokenBalance.value.toString()) / 1e18} MXN` : '0.0000 MXN'}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Instant crypto lending</Text>
        </View>
      
      {!loan && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              console.log('Get Loan button pressed - setting showLoanRequestScreen to true');
              console.log('Current showLoanRequestScreen state:', showLoanRequestScreen);
              setShowLoanRequestScreen(true);
            }}>
            <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>
              + Get Loan
            </Text>
          </TouchableOpacity>
          
        </View>
      )}



      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.error }]} onPress={loadLoan}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCreateForm && !loan && (
        <CreateLoan onLoanCreated={handleLoanCreated} />
      )}

      {loading && !showCreateForm && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading loan...</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }>
        
        {loan && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}>
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
            <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.emptyIconText, { color: colors.textSecondary }]}>💰</Text>
            </View>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active loans</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Get started with your first loan
            </Text>
          </View>
        )}
      </ScrollView>

      </SafeAreaView>
      
      <LoanRequestScreen
        visible={showLoanRequestScreen}
        onClose={() => {
          console.log('Closing LoanRequestScreen');
          setShowLoanRequestScreen(false);
        }}
        onLoanCreated={handleLoanCreated}
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
  loanImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  balanceCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginVertical: 12,
    marginHorizontal: 24,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  createButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});