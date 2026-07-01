// src/features/auth/components/AuthInput.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../../shared/constants/theme.js';

// Estilos inline para web — eliminan el fondo blanco y el outline del browser
const WEB_INPUT_STYLE = Platform.OS === 'web' ? {
  backgroundColor: 'transparent',
  outline: 'none',
  outlineWidth: 0,
  border: 'none',
  borderWidth: 0,
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
} : { backgroundColor: 'transparent' };

export default function AuthInput({
  label, value, onChangeText, onBlur, placeholder, error,
  secureTextEntry = false, keyboardType = 'default',
  autoCapitalize = 'none', autoComplete, autoCorrect = false,
  leftIcon, required, style,
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={[s.wrapper, style]}>
      {label && (
        <Text style={s.label}>
          {label}{required && <Text style={s.req}> *</Text>}
        </Text>
      )}
      <View style={[s.row, focused && s.rowFocused, error && s.rowError]}>
        {leftIcon && <View style={s.icon}>{leftIcon}</View>}
        <TextInput
          style={[s.input, WEB_INPUT_STYLE]}
          value={value}
          onChangeText={onChangeText}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textOnDarkMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <MaterialIcons name={hidden ? 'visibility-off' : 'visibility'} size={20} color={COLORS.textOnDarkMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={s.errorRow}>
          <MaterialIcons name="error-outline" size={12} color={COLORS.errorOnDark} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  label: {
    fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textOnDarkLight, marginBottom: SPACING.xs,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  req: { color: COLORS.accent },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.borderOnDark,
    paddingVertical: SPACING.sm, gap: SPACING.sm,
    backgroundColor: 'transparent',
  },
  rowFocused: { borderBottomColor: COLORS.accent },
  rowError: { borderBottomColor: COLORS.errorOnDark },
  icon: { marginRight: 2 },
  input: {
    flex: 1, fontSize: FONT_SIZE.md,
    color: COLORS.textOnDark, paddingVertical: SPACING.xs,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  errorText: { fontSize: FONT_SIZE.xs, color: COLORS.errorOnDark },
});