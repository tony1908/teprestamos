/**
 * Professional fintech color palette optimized for lending platform
 */

const primaryPurple = '#9859c5';
const primaryPurpleLight = '#b377d6';
const primaryPurpleDark = '#7e3da8';
const neutralGray = '#6B7280';
const successGreen = '#10B981';
const warningOrange = '#F59E0B';
const errorRed = '#EF4444';
const backgroundGray = '#F9FAFB';

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: backgroundGray,
    tint: primaryPurple,
    primary: primaryPurple,
    primaryLight: primaryPurpleLight,
    primaryDark: primaryPurpleDark,
    success: successGreen,
    warning: warningOrange,
    error: errorRed,
    border: '#E5E7EB',
    icon: neutralGray,
    tabIconDefault: neutralGray,
    tabIconSelected: primaryPurple,
    card: '#FFFFFF',
    shadow: '#00000010',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#111827',
    backgroundSecondary: '#1F2937',
    tint: primaryPurpleLight,
    primary: primaryPurpleLight,
    primaryLight: primaryPurpleLight,
    primaryDark: primaryPurple,
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#374151',
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryPurpleLight,
    card: '#1F2937',
    shadow: '#00000040',
  },
};
