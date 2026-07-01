// src/shared/components/common/Button.jsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../constants/theme.js';

/**
 * Button – variantes: "primary" (fondo azul) | "secondary" (borde azul, fondo blanco)
 * | "ghost" (sin borde ni fondo) | "danger" (fondo rojo)
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = true,
}) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === 'primary' && styles.labelPrimary,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'ghost' && styles.labelGhost,
    variant === 'danger' && styles.labelDanger,
    isDisabled && styles.labelDisabled,
    textStyle,
  ];

  const spinnerColor =
    variant === 'primary' || variant === 'danger'
      ? COLORS.surface
      : COLORS.primary;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={labelStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconWrapper: {
    marginRight: SPACING.xs,
  },

  // ── Variantes ──────────────────────────────────────────────────────────────
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.sm,
  },
  disabled: {
    backgroundColor: COLORS.disabled,
    borderColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Textos ─────────────────────────────────────────────────────────────────
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  labelPrimary: {
    color: COLORS.surface,
  },
  labelSecondary: {
    color: COLORS.primary,
  },
  labelGhost: {
    color: COLORS.primary,
  },
  labelDanger: {
    color: COLORS.surface,
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
});
