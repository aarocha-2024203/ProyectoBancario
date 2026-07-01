// src/shared/components/common/Common.jsx
import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
} from '../../constants/theme.js';

// ─── LoadingSpinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({
  size = 'large',
  color = COLORS.primary,
  message,
  fullScreen = false,
  style,
}) {
  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.loadingMessage}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.spinnerContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.loadingMessage}>{message}</Text>}
    </View>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon = 'inbox',
  title = 'Sin resultados',
  description,
  actionLabel,
  onAction,
  style,
}) {
  return (
    <View style={[styles.emptyContainer, style]}>
      <View style={styles.emptyIconWrapper}>
        <MaterialIcons name={icon} size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && (
        <Text style={styles.emptyDescription}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  onPress,
  padding = SPACING.lg,
  shadow = 'sm',
}) {
  const cardStyle = [
    styles.card,
    SHADOWS[shadow],
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onDismiss, style }) {
  if (!message) return null;

  return (
    <View style={[styles.errorBanner, style]}>
      <MaterialIcons name="error-outline" size={18} color={COLORS.error} />
      <Text style={styles.errorBannerText} numberOfLines={3}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={18} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ label, style }) {
  if (label) {
    return (
      <View style={[styles.dividerRow, style]}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{label}</Text>
        <View style={styles.dividerLine} />
      </View>
    );
  }

  return <View style={[styles.dividerSimple, style]} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // LoadingSpinner
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingMessage: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },

  // EmptyState
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  emptyActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.surface,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
  },

  // ErrorBanner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    lineHeight: 18,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  dividerSimple: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
