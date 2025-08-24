/**
 * Professional fintech color palette optimized for lending platform
 */

const primaryBlue = '#2563EB';
const primaryBlueLight = '#3B82F6';
const primaryBlueDark = '#1D4ED8';
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
    tint: primaryBlue,
    primary: primaryBlue,
    primaryLight: primaryBlueLight,
    primaryDark: primaryBlueDark,
    success: successGreen,
    warning: warningOrange,
    error: errorRed,
    border: '#E5E7EB',
    icon: neutralGray,
    tabIconDefault: neutralGray,
    tabIconSelected: primaryBlue,
    card: '#FFFFFF',
    shadow: '#00000010',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#111827',
    backgroundSecondary: '#1F2937',
    tint: primaryBlueLight,
    primary: primaryBlueLight,
    primaryLight: '#60A5FA',
    primaryDark: primaryBlue,
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#374151',
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryBlueLight,
    card: '#1F2937',
    shadow: '#00000040',
  },
};
