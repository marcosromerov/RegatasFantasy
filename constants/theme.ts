/**
 * Modern color palette for Rugby Fantasy App
 * Includes gradients and vibrant colors for contemporary design
 */

import { Platform } from 'react-native';

// Modern color palette
const primaryGradient = ['#6366F1', '#8B5CF6']; // Indigo to Purple
const accentGradient = ['#EC4899', '#F43F5E']; // Pink to Rose
const successColor = '#10B981'; // Emerald
const warningColor = '#F59E0B'; // Amber
const errorColor = '#EF4444'; // Red

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    backgroundCard: '#FFFFFF',
    tint: '#6366F1', // Primary
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#6366F1',
    borderColor: '#E2E8F0',
    
    // Gradients (as arrays for use in components)
    primaryGradient,
    accentGradient,
    
    // Status colors
    success: successColor,
    warning: warningColor,
    error: errorColor,
    
    // Semantic colors
    selected: '#6366F1',
    unselected: '#CBD5E1',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    background: '#0F172A',
    backgroundCard: '#1E293B',
    tint: '#818CF8', // Light Indigo
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#818CF8',
    borderColor: '#334155',
    
    // Gradients
    primaryGradient,
    accentGradient,
    
    // Status colors
    success: successColor,
    warning: warningColor,
    error: errorColor,
    
    // Semantic colors
    selected: '#818CF8',
    unselected: '#475569',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
