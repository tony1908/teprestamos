import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAccount } from 'wagmi';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { address } = useAccount();

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#202020', dark: '#202020' }}
        headerImage={
          <Image
            source={require('@/assets/images/reown-header.png')}
            style={styles.reownLogo}
          />
        }>
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
            Need a quick loan? Head over to the Loans tab to request one!
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <ThemedText style={styles.featureIcon}>💰</ThemedText>
            <ThemedText style={styles.featureTitle}>Request Loans</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Request MON token loans with flexible repayment terms
            </ThemedText>
          </View>
          
          <View style={styles.featureCard}>
            <ThemedText style={styles.featureIcon}>⏰</ThemedText>
            <ThemedText style={styles.featureTitle}>Fast Approval</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Get your loan approved quickly by the platform
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
      </ParallaxScrollView>
    </>
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
  reownLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  appKitButton: {
    marginTop: 8,
  },
});
