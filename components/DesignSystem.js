import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ===== DESIGN SYSTEM CONSTANTS =====

// Colors
export const COLORS = {
  // Primary Colors
  primary: '#DC3545',           // Red - main brand color
  primaryLight: '#FF6B7A',      // Lighter red for hover states
  primaryDark: '#B02A37',       // Darker red for pressed states
  
  // Secondary Colors
  secondary: '#2196F3',         // Blue - for active states
  secondaryLight: '#E3F2FD',    // Light blue background
  secondaryDark: '#1976D2',     // Dark blue text
  
  // Neutral Colors
  white: '#FFFFFF',
  background: '#F8F9FA',        // Light gray background
  surface: '#FFFFFF',           // Card backgrounds
  
  // Text Colors
  textPrimary: '#212529',       // Main text
  textSecondary: '#6C757D',     // Secondary text
  textMuted: '#495057',         // Muted text
  
  // Border Colors
  border: '#E9ECEF',            // Light borders
  borderLight: '#F1F3F4',       // Very light borders
  
  // Status Colors
  success: '#28A745',           // Green
  warning: '#FFC107',           // Yellow
  error: '#DC3545',             // Red
  info: '#17A2B8',              // Blue
  
  // Overlay Colors
  overlay: 'rgba(0,0,0,0.7)',   // Dark overlay
  successOverlay: 'rgba(40, 167, 69, 0.9)',  // Green overlay
  warningOverlay: 'rgba(255, 193, 7, 0.9)',  // Yellow overlay
};

// Typography
export const TYPOGRAPHY = {
  // Headers
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  
  // Body Text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bodyXSmall: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  
  // Button Text
  buttonLarge: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  buttonMedium: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 25,
  round: 50,
};

// Shadows
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ===== SHARED COMPONENTS =====

// Header Component
export const Header = ({ title, subtitle, rightAction }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
    {rightAction && (
      <View style={styles.headerAction}>
        {rightAction}
      </View>
    )}
  </View>
);

// Search Bar Component
export const SearchBar = ({ 
  placeholder, 
  value, 
  onChangeText, 
  onClear, 
  style 
}) => (
  <View style={[styles.searchContainer, style]}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color={COLORS.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={COLORS.textSecondary}
      />
      {value && value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.searchClearButton}>
          <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Filter Button Component
export const FilterButton = ({ 
  label, 
  isActive, 
  onPress, 
  style 
}) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      isActive && styles.filterButtonActive,
      style
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.filterButtonText,
      isActive && styles.filterButtonTextActive
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Filter Row Component
export const FilterRow = ({ children, style }) => (
  <View style={[styles.filterRow, style]}>
    {children}
  </View>
);

// Card Component
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Button Component
export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  icon,
  style 
}) => {
  const buttonStyles = [
    styles.button,
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.buttonDisabled,
    style
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`buttonText${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.buttonTextDisabled
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Ionicons name={icon} size={16} color={COLORS.white} style={styles.buttonIcon} />}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

// Badge Component
export const Badge = ({ 
  label, 
  variant = 'default', 
  size = 'medium',
  style 
}) => (
  <View style={[
    styles.badge,
    styles[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`badge${size.charAt(0).toUpperCase() + size.slice(1)}`],
    style
  ]}>
    <Text style={[
      styles.badgeText,
      styles[`badgeText${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      styles[`badgeText${size.charAt(0).toUpperCase() + size.slice(1)}`]
    ]}>
      {label}
    </Text>
  </View>
);

// Loading State Component
export const LoadingState = ({ 
  message = 'Loading...', 
  submessage,
  style 
}) => (
  <View style={[styles.loadingContainer, style]}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
    {submessage && <Text style={styles.loadingSubtext}>{submessage}</Text>}
  </View>
);

// Empty State Component
export const EmptyState = ({ 
  icon, 
  title, 
  message, 
  action,
  style 
}) => (
  <View style={[styles.emptyState, style]}>
    <Ionicons name={icon} size={80} color={COLORS.textSecondary} />
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateText}>{message}</Text>
    {action && (
      <View style={styles.emptyStateAction}>
        {action}
      </View>
    )}
  </View>
);

// Meta Item Component (for recipe cards)
export const MetaItem = ({ icon, value, style }) => (
  <View style={[styles.metaItem, style]}>
    <Ionicons name={icon} size={14} color={COLORS.textSecondary} />
    <Text style={styles.metaText}>{value}</Text>
  </View>
);

// ===== STYLES =====

const styles = StyleSheet.create({
  // Header Styles
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodyLarge,
  },
  headerAction: {
    marginLeft: SPACING.lg,
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.md,
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textPrimary,
  },
  searchClearButton: {
    padding: SPACING.xs,
  },

  // Filter Styles
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterButton: {
    width: 80,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },

  // Card Styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },

  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.xxl,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonMedium: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  buttonSmall: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  buttonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  buttonTextPrimary: {
    color: COLORS.white,
  },
  buttonTextSecondary: {
    color: COLORS.white,
  },
  buttonTextOutline: {
    color: COLORS.primary,
  },
  buttonTextMedium: {
    ...TYPOGRAPHY.buttonMedium,
  },
  buttonTextSmall: {
    ...TYPOGRAPHY.buttonSmall,
  },
  buttonTextDisabled: {
    color: COLORS.white,
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },

  // Badge Styles
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDefault: {
    backgroundColor: COLORS.overlay,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successOverlay,
  },
  badgeWarning: {
    backgroundColor: COLORS.warningOverlay,
  },
  badgeMedium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  badgeSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  badgeTextDefault: {
    color: COLORS.white,
  },
  badgeTextSuccess: {
    color: COLORS.white,
  },
  badgeTextWarning: {
    color: COLORS.white,
  },
  badgeTextMedium: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    ...TYPOGRAPHY.h3,
    color: COLORS.textMuted,
  },
  loadingSubtext: {
    marginTop: SPACING.sm,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyStateTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    ...TYPOGRAPHY.h2,
    color: COLORS.textMuted,
  },
  emptyStateText: {
    ...TYPOGRAPHY.bodyLarge,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  emptyStateAction: {
    marginTop: SPACING.lg,
  },

  // Meta Item Styles
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  metaText: {
    marginLeft: SPACING.xs,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  Header,
  SearchBar,
  FilterButton,
  FilterRow,
  Card,
  Button,
  Badge,
  LoadingState,
  EmptyState,
  MetaItem,
}; 