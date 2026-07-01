// src/features/auth/components/AuthButton.jsx
// Botón cyan prominente estilo bancario
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../../shared/constants/theme.js';

export default function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'ghost'
  style,
}) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        s.btn,
        variant === 'ghost' && s.ghost,
        isDisabled && s.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={variant === 'ghost' ? COLORS.accent : COLORS.primaryDark} size="small" />
        : <Text style={[s.label, variant === 'ghost' && s.labelGhost]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  labelGhost: {
    color: COLORS.textOnDarkLight,
    fontWeight: FONT_WEIGHT.medium,
  },
});
