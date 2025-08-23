import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={require('@/assets/images/reown-header.png')}
          style={styles.reownLogo}
        />
      </View>
      
      <ThemedView style={styles.contentContainer}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome to Monad Todo</ThemedText>
          <HelloWave />
        </ThemedView>
        
        <ThemedView style={styles.descriptionContainer}>
          <ThemedText style={styles.descriptionText}>
            Create todos and stake MON tokens to commit to completing them. Complete your todos to get your stake back!
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>🎯</ThemedText>
            <ThemedText style={styles.featureText}>Stake MON tokens on your commitments</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>✅</ThemedText>
            <ThemedText style={styles.featureText}>Complete todos to retrieve your stake</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <ThemedText style={styles.featureIcon}>🚀</ThemedText>
            <ThemedText style={styles.featureText}>Stay motivated and accountable</ThemedText>
          </View>
        </ThemedView>
        
        <View style={styles.connectContainer}>
          <ThemedText style={styles.connectTitle}>Connect your wallet to get started</ThemedText>
          <AppKitButton 
            connectStyle={styles.appKitButton} 
            label='Connect Wallet'
          />
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    height: 200,
    backgroundColor: '#202020',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  reownLogo: {
    height: 150,
    width: 240,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
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
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  connectContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  connectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  appKitButton: {
    marginTop: 10,
    minWidth: 200,
  },
});