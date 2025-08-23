import "@walletconnect/react-native-compat";
import {
  AppKit,
  createAppKit,
  defaultWagmiConfig
} from "@reown/appkit-wagmi-react-native";
import { authConnector } from "@reown/appkit-auth-wagmi-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, monadTestnet } from "@wagmi/core/chains";
import { WagmiProvider, useAccount } from "wagmi";

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { View } from "react-native";
import LoginScreen from '@/components/LoginScreen';

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId at https://dashboard.reown.com
const projectId = ""; // This project ID will only work for Expo Go. Use your own project ID for production.

// 2. Create config
const metadata = {
  name: "Te Prestamos",
  description: "Decentralized Lending Platform on Monad",
  url: "https://monad.xyz",
  icons: ["https://files.svgcdn.io/token-branded/monad.png"],
  redirect: {
    native: "appkitexpowagmi://",
    universal: "https://teprestamos.app",
  },
};

const chains = [mainnet, monadTestnet] as const;
const auth = authConnector({ projectId, metadata });

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata, extraConnectors: [auth] });

// 3. Create modal
createAppKit({
  projectId,
  metadata,
  chainImages: {
    10143: "https://files.svgcdn.io/token-branded/monad.png", // Monad Testnet
  },
  wagmiConfig,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

function AppContent() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return <LoginScreen />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
          {/* This is a workaround for the Android modal issue. https://github.com/expo/expo/issues/32991#issuecomment-2489620459 */}
          <View style={{ position: "absolute", height: "100%", width: "100%" }}>
            <AppKit />
          </View>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
