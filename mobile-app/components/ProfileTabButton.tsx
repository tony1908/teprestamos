import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function ProfileTabButton(props: BottomTabBarButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, props.style]}>
      <AppKitButton 
        connectStyle={[
          styles.appKitButton,
          {
            backgroundColor: 'transparent',
            borderColor: props.accessibilityState?.selected ? colors.tabIconSelected : colors.tabIconDefault,
            borderWidth: 1,
          }
        ]}
        size="sm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  appKitButton: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  iconContainer: {
    position: 'absolute',
    top: -6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});