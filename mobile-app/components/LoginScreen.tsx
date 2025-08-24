import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.content}>
        <View style={styles.headerSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.logoText}>TP</ThemedText>
          </View>
          
          <ThemedText style={[styles.titleText, { color: colors.text }]}>Te Prestamos</ThemedText>
          <ThemedText style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Instant crypto loans on Monad
          </ThemedText>
        </View>
        
        <View style={styles.featuresSection}>
          <View style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
              <ThemedText style={[styles.featureIconText, { color: colors.primary }]}>⚡</ThemedText>
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Instant Approval</ThemedText>
              <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>Get funds in seconds</ThemedText>
            </View>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
              <ThemedText style={[styles.featureIconText, { color: colors.success }]}>💰</ThemedText>
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Flexible Terms</ThemedText>
              <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>1-30 day repayment</ThemedText>
            </View>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.warning + '15' }]}>
              <ThemedText style={[styles.featureIconText, { color: colors.warning }]}>🔒</ThemedText>
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>Secure</ThemedText>
              <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>Blockchain secured</ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.actionSection}>
          <ThemedText style={[styles.stepText, { color: colors.textSecondary }]}>
            Step 1 of 2: Connect Wallet
          </ThemedText>
          <AppKitButton 
            connectStyle={styles.connectButton}
            label='Connect Wallet'
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    flex: 1,
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionSection: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  stepText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  connectButton: {
    minWidth: 200,
    borderRadius: 12,
  },
});