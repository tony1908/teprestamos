import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, Alert, BackHandler } from 'react-native';
import * as ExpoKioskControl from 'expo-kiosk-control';

export const useKioskMode = () => {
  const [isKioskEnabled, setIsKioskEnabled] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isLoading, setIsLoading] = useState(false);

  const enableKioskMode = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Platform Not Supported', 'Kiosk mode is only supported on Android devices');
      return false;
    }

    try {
      setIsLoading(true);
      await ExpoKioskControl.startKioskMode();
      await ExpoKioskControl.disableExitByUnpinning();
      setIsKioskEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling kiosk mode:', error);
      Alert.alert('Kiosk Mode Error', 'Failed to enable kiosk mode. Please ensure required permissions are granted.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableKioskMode = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      setIsLoading(true);
      await ExpoKioskControl.exitKioskMode();
      await ExpoKioskControl.enableExitByUnpinning();
      setIsKioskEnabled(false);
      return true;
    } catch (error) {
      console.error('Error disabling kiosk mode:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle app state changes and automatically re-enable kiosk mode if unpinned
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handleAppStateChange = (nextAppState: any) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (isKioskEnabled) {
          ExpoKioskControl.onRecentButtonPressed();
          // Check if we're still in kiosk mode, if not, re-enable it
          const checkKioskStatus = async () => {
            try {
              const kioskActive = await (ExpoKioskControl as any).checkIfKioskEnabled?.();
              if (!kioskActive && isKioskEnabled) {
                // App was unpinned but our state says it should be locked - re-enable
                setTimeout(() => {
                  ExpoKioskControl.startKioskMode();
                  ExpoKioskControl.disableExitByUnpinning();
                }, 100);
              }
            } catch {
              // If check fails, assume we need to re-enable
              if (isKioskEnabled) {
                setTimeout(() => {
                  ExpoKioskControl.startKioskMode();
                  ExpoKioskControl.disableExitByUnpinning();
                }, 100);
              }
            }
          };
          checkKioskStatus();
        }
      }
      setAppState(nextAppState);
    };

    const handleBackPress = () => {
      if (isKioskEnabled) {
        return true; // Block back button
      }
      return false;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      subscription?.remove();
      backHandler?.remove();
    };
  }, [appState, isKioskEnabled]);

  // Apply kiosk mode when state changes
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    if (isKioskEnabled) {
      ExpoKioskControl.startKioskMode();
      ExpoKioskControl.disableExitByUnpinning();
    } else {
      ExpoKioskControl.exitKioskMode();
      ExpoKioskControl.enableExitByUnpinning();
    }
  }, [isKioskEnabled]);

  return {
    isKioskEnabled,
    isLoading,
    enableKioskMode,
    disableKioskMode,
  };
};