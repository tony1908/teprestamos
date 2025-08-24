import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAccount } from 'wagmi';
import PalencaConnect from './PalencaConnect';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>1</Text>
        <Text style={styles.stepTitle}>Connect Your Wallet</Text>
      </View>
      <Text style={styles.stepDescription}>
        Connect your crypto wallet to access Te Prestamos lending platform
      </Text>
      <Text style={styles.waitingText}>
        {isConnected ? '✓ Wallet Connected!' : 'Please connect your wallet using the button above...'}
      </Text>
    </View>
  );

  const renderPalencaConnection = () => (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>2</Text>
        <Text style={styles.stepTitle}>Link Your Bank Account</Text>
      </View>
      <PalencaConnect
        onSuccess={handlePalencaSuccess}
        onError={handlePalencaError}
        widgetId=""
      />
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.completeContainer}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>Setup Complete!</Text>
        <Text style={styles.completeDescription}>
          Your wallet and bank account are now connected. You can start using Te Prestamos!
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {currentStep === OnboardingStep.WALLET_CONNECTION && renderWalletConnection()}
      {currentStep === OnboardingStep.PALENCA_CONNECTION && renderPalencaConnection()}
      {currentStep === OnboardingStep.COMPLETE && renderComplete()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ea4c89',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
    marginRight: 15,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  waitingText: {
    fontSize: 16,
    color: '#28a745',
    textAlign: 'center',
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  completeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OnboardingFlow;