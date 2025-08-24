import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount } from 'wagmi';
import PalencaConnect from './PalencaConnect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface OnboardingFlowProps {
  onComplete: () => void;
}

enum OnboardingStep {
  WALLET_CONNECTION = 'wallet',
  PALENCA_CONNECTION = 'palenca',
  COMPLETE = 'complete'
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WALLET_CONNECTION);
  const { isConnected } = useAccount();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  React.useEffect(() => {
    if (isConnected && currentStep === OnboardingStep.WALLET_CONNECTION) {
      setCurrentStep(OnboardingStep.PALENCA_CONNECTION);
    }
  }, [isConnected, currentStep]);

  const handlePalencaSuccess = async () => {
    try {
      await AsyncStorage.setItem('palenca_connected', 'true');
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setCurrentStep(OnboardingStep.COMPLETE);
      setTimeout(onComplete, 2000);
    } catch (error) {
      console.error('Error saving Palenca connection status:', error);
      onComplete();
    }
  };

  const handlePalencaError = (error: string) => {
    Alert.alert(
      'Connection Error',
      `Failed to connect with Palenca: ${error}`,
      [
        { text: 'Retry', onPress: () => setCurrentStep(OnboardingStep.PALENCA_CONNECTION) },
        { text: 'Skip', onPress: onComplete }
      ]
    );
  };

  const renderWalletConnection = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '50%' }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 1 of 2</Text>
        </View>
        
        <View style={styles.stepContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.iconText}>1</Text>
          </View>
          
          <Text style={[styles.stepTitle, { color: colors.text }]}>Connect Your Wallet</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Connect your crypto wallet to access secure lending on Monad
          </Text>
          
          <View style={[styles.statusContainer, { 
            backgroundColor: isConnected ? colors.success + '15' : colors.backgroundSecondary 
          }]}>
            <Text style={[styles.statusText, { 
              color: isConnected ? colors.success : colors.textSecondary 
            }]}>
              {isConnected ? '✓ Wallet Connected!' : 'Waiting for wallet connection...'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderPalencaConnection = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 2 of 2</Text>
        </View>
        
        <View style={styles.stepHeaderCompact}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.iconText}>2</Text>
          </View>
          
          <Text style={[styles.stepTitle, { color: colors.text }]}>Link Gig Account</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Securely connect your gig account for loan verification
          </Text>
        </View>
        
        <View style={styles.palencaContainer}>
          <PalencaConnect
            onSuccess={handlePalencaSuccess}
            onError={handlePalencaError}
            widgetId="x"
          />
        </View>
      </View>
    </SafeAreaView>
  );

  const renderComplete = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.completeContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          
          <Text style={[styles.completeTitle, { color: colors.text }]}>Setup Complete!</Text>
          <Text style={[styles.completeDescription, { color: colors.textSecondary }]}>
            Your wallet and gig account are connected. Ready to start lending!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <>
      {currentStep === OnboardingStep.WALLET_CONNECTION && renderWalletConnection()}
      {currentStep === OnboardingStep.PALENCA_CONNECTION && renderPalencaConnection()}
      {currentStep === OnboardingStep.COMPLETE && renderComplete()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: -10,
  },
  progressContainer: {
    marginBottom: 48,
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  stepHeaderCompact: {
    alignItems: 'center',
    marginBottom: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  statusContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  palencaContainer: {
    flex: 1,
    marginTop: 0,
    maxHeight: 500,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successIconText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  completeDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OnboardingFlow;