import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { useAccount } from 'wagmi';
import { useOnboarding } from '@/contexts/OnboardingContext';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  const { address } = useAccount();
  const { resetOnboarding } = useOnboarding();

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding flow. You will need to complete wallet connection and Palenca setup again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert('Success', 'Onboarding has been reset. Please restart the app.');
          }
        }
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#202020', dark: '#202020' }}
      headerImage={<View style={{ height: 178, backgroundColor: '#202020' }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Te Prestamos</ThemedText>
        <ThemedText type="subtitle">Decentralized Lending Platform</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.welcomeContainer}>
        <ThemedText style={styles.welcomeText}>
          Welcome back! 🎉
        </ThemedText>
        <ThemedText style={styles.addressText}>
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.descriptionContainer}>
        <ThemedText style={styles.descriptionText}>
          Your profile and account information
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <ThemedText style={styles.featureIcon}>💰</ThemedText>
          <ThemedText style={styles.featureTitle}>Request Loans</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Get instant MON token loans with flexible repayment terms
          </ThemedText>
        </View>
        
        <View style={styles.featureCard}>
          <ThemedText style={styles.featureIcon}>⏰</ThemedText>
          <ThemedText style={styles.featureTitle}>Instant Funding</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Loans are automatically approved and funded immediately
          </ThemedText>
        </View>
        
        <View style={styles.featureCard}>
          <ThemedText style={styles.featureIcon}>🔒</ThemedText>
          <ThemedText style={styles.featureTitle}>Secure & Trustless</ThemedText>
          <ThemedText style={styles.featureDescription}>
            Smart contract-based lending with transparent terms
          </ThemedText>
        </View>
      </ThemedView>

      <View style={styles.walletContainer}>
        <ThemedText style={styles.walletTitle}>Wallet Management</ThemedText>
        <AppKitButton connectStyle={styles.appKitButton} />
      </View>

      <View style={styles.developmentContainer}>
        <ThemedText style={styles.developmentTitle}>Development Options</ThemedText>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetOnboarding}>
          <ThemedText style={styles.resetButtonText}>Reset Onboarding</ThemedText>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    margin: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  descriptionContainer: {
    padding: 20,
  },
  descriptionText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  featuresContainer: {
    padding: 16,
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  walletContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  appKitButton: {
    marginTop: 8,
  },
  developmentContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  developmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});