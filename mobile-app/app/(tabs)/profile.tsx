import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import React from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccount } from 'wagmi';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const { address } = useAccount();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.logoText}>TP</ThemedText>
          </View>
          <ThemedText style={[styles.titleText, { color: colors.text }]}>Te Prestamos</ThemedText>
          <ThemedText style={[styles.subtitleText, { color: colors.textSecondary }]}>Decentralized Lending Platform</ThemedText>
        </View>
        
        <View style={[styles.welcomeCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
          <ThemedText style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back! 🚀
          </ThemedText>
          <ThemedText style={[styles.addressText, { color: colors.textSecondary }]}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </ThemedText>
        </View>
        
        <View style={styles.featuresSection}>
          <View style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <ThemedText style={[styles.featureIcon, { color: colors.primary }]}>💰</ThemedText>
            </View>
            <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Request Loans</ThemedText>
            <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Get instant MON token loans with flexible repayment terms
            </ThemedText>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.success + '15' }]}>
              <ThemedText style={[styles.featureIcon, { color: colors.success }]}>⚡</ThemedText>
            </View>
            <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Instant Funding</ThemedText>
            <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Loans are automatically approved and funded immediately
            </ThemedText>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <ThemedText style={[styles.featureIcon, { color: colors.warning }]}>🔒</ThemedText>
            </View>
            <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Secure & Trustless</ThemedText>
            <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Smart contract-based lending with transparent terms
            </ThemedText>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Wallet Management</ThemedText>
          <AppKitButton connectStyle={styles.appKitButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
  },
  welcomeCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  featuresSection: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  featureCard: {
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
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  appKitButton: {
    marginTop: 8,
  },
});