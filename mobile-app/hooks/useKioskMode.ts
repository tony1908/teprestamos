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
      
      // Check if ExpoKioskControl functions are available
      if (typeof ExpoKioskControl.startKioskMode === 'function') {
        try {
          await ExpoKioskControl.startKioskMode();
        } catch (startError) {
          console.warn('startKioskMode failed:', (startError as Error).message);
          // Continue anyway - some functions might work even if others fail
        }
      } else {
        console.warn('ExpoKioskControl.startKioskMode is not available');
      }
      
      if (typeof ExpoKioskControl.disableExitByUnpinning === 'function') {
        try {
          await ExpoKioskControl.disableExitByUnpinning();
        } catch (unpinError) {
          console.warn('disableExitByUnpinning failed:', (unpinError as Error).message);
          // Continue anyway
        }
      } else {
        console.warn('ExpoKioskControl.disableExitByUnpinning is not available');
      }
      
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
      setIsKioskEnabled(false);
      return true;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to disable kiosk mode...');
      
      // First, update our internal state immediately
      setIsKioskEnabled(false);
      
      // Try multiple approaches to exit kiosk mode
      const exitAttempts = [];
      
      // Attempt 1: Standard exit
      if (typeof ExpoKioskControl.exitKioskMode === 'function') {
        try {
          const exitPromise = ExpoKioskControl.exitKioskMode();
          if (exitPromise && typeof exitPromise.then === 'function') {
            exitAttempts.push(
              exitPromise.catch((err: any) => {
                console.warn('Standard exitKioskMode failed:', err.message);
                return Promise.reject(err);
              })
            );
          } else {
            console.warn('exitKioskMode did not return a promise');
          }
        } catch (error) {
          console.warn('Error calling exitKioskMode:', (error as Error).message);
        }
      }
      
      // Attempt 2: Enable exit by unpinning first, then exit
      if (typeof ExpoKioskControl.enableExitByUnpinning === 'function') {
        try {
          const unpinPromise = ExpoKioskControl.enableExitByUnpinning();
          if (unpinPromise && typeof unpinPromise.then === 'function') {
            exitAttempts.push(
              unpinPromise
                .then(() => {
                  console.log('Exit by unpinning enabled');
                  if (typeof ExpoKioskControl.exitKioskMode === 'function') {
                    try {
                      const exitPromise = ExpoKioskControl.exitKioskMode();
                      if (exitPromise && typeof exitPromise.then === 'function') {
                        return exitPromise;
                      } else {
                        console.warn('exitKioskMode after unpinning did not return a promise');
                        return Promise.resolve();
                      }
                    } catch (error) {
                      console.warn('Error calling exitKioskMode after unpinning:', (error as Error).message);
                      return Promise.resolve();
                    }
                  }
                  return Promise.resolve();
                })
                .catch((err: any) => {
                  console.warn('Enable unpinning approach failed:', err.message);
                  return Promise.reject(err);
                })
            );
          } else {
            console.warn('enableExitByUnpinning did not return a promise');
          }
        } catch (error) {
          console.warn('Error calling enableExitByUnpinning:', (error as Error).message);
        }
      }
      
      // Try approaches one by one
      if (exitAttempts.length > 0) {
        let success = false;
        for (const attempt of exitAttempts) {
          try {
            await attempt;
            console.log('Successfully disabled kiosk mode');
            success = true;
            break;
          } catch (error) {
            console.warn('Kiosk mode exit attempt failed:', (error as Error).message);
          }
        }
        
        if (!success) {
          console.warn('All kiosk mode exit attempts failed, but continuing with state update');
        }
      } else {
        console.warn('No kiosk control functions available');
      }
      
      return true;
    } catch (error) {
      console.error('Error disabling kiosk mode:', error);
      // Keep state as disabled to prevent permanent lock
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
                  try {
                    if (typeof ExpoKioskControl.startKioskMode === 'function') {
                      ExpoKioskControl.startKioskMode();
                    }
                    if (typeof ExpoKioskControl.disableExitByUnpinning === 'function') {
                      ExpoKioskControl.disableExitByUnpinning();
                    }
                  } catch (error) {
                    console.warn('Re-enable kiosk mode failed:', (error as Error).message);
                  }
                }, 100);
              }
            } catch {
              // If check fails, assume we need to re-enable
              if (isKioskEnabled) {
                setTimeout(() => {
                  try {
                    if (typeof ExpoKioskControl.startKioskMode === 'function') {
                      ExpoKioskControl.startKioskMode();
                    }
                    if (typeof ExpoKioskControl.disableExitByUnpinning === 'function') {
                      ExpoKioskControl.disableExitByUnpinning();
                    }
                  } catch (error) {
                    console.warn('Re-enable kiosk mode (fallback) failed:', (error as Error).message);
                  }
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
      try {
        if (typeof ExpoKioskControl.startKioskMode === 'function') {
          try {
            ExpoKioskControl.startKioskMode();
          } catch (startError) {
            console.warn('useEffect: startKioskMode failed:', (startError as Error).message);
          }
        }
        if (typeof ExpoKioskControl.disableExitByUnpinning === 'function') {
          try {
            ExpoKioskControl.disableExitByUnpinning();
          } catch (unpinError) {
            console.warn('useEffect: disableExitByUnpinning failed:', (unpinError as Error).message);
          }
        }
      } catch (error) {
        console.error('Error starting kiosk mode:', error);
      }
    } else {
      try {
        console.log('useEffect: Attempting to exit kiosk mode due to state change');
        
        // Try enable unpinning first
        if (typeof ExpoKioskControl.enableExitByUnpinning === 'function') {
          const unpinPromise = ExpoKioskControl.enableExitByUnpinning();
          if (unpinPromise && typeof unpinPromise.catch === 'function') {
            unpinPromise.catch((err: any) => {
              console.warn('useEffect: enableExitByUnpinning failed:', err.message);
            });
          }
        }
        
        // Then try to exit - but don't await to avoid blocking
        if (typeof ExpoKioskControl.exitKioskMode === 'function') {
          const exitPromise = ExpoKioskControl.exitKioskMode();
          if (exitPromise && typeof exitPromise.catch === 'function') {
            exitPromise.catch((err: any) => {
              console.warn('useEffect: exitKioskMode failed:', err.message);
            });
          }
        }
        
        console.log('useEffect: Kiosk mode exit attempted');
      } catch (error) {
        console.error('Error exiting kiosk mode in useEffect:', error);
      }
    }
  }, [isKioskEnabled]);

  return {
    isKioskEnabled,
    isLoading,
    enableKioskMode,
    disableKioskMode,
  };
};