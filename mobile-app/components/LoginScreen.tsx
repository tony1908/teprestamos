import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { loginImage } from '@/constants/Images';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: `data:image/png;base64,${loginImage}` }}
          style={styles.loginImage}
          resizeMode="cover"
        />
      </View>
      
      <SafeAreaView style={styles.contentSection}>
        <View style={styles.mainContent}>
          <View style={styles.titleContainer}>
            <ThemedText style={[styles.titleText, { color: colors.text }]}>Te Prestamos</ThemedText>
            <ThemedText style={[styles.sloganText, { color: colors.textSecondary }]}>
              Your crypto. Your terms. Instantly.
            </ThemedText>
          </View>
          
          <View style={styles.buttonContainer}>
            <AppKitButton 
              connectStyle={[styles.connectButton, { backgroundColor: colors.primary }]}
              label='Connect Wallet'
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: '65%',
  },
  loginImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 40,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sloganText: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleText: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
    includeFontPadding: false,
  },
  connectButton: {
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
});