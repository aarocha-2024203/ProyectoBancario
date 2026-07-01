// src/features/auth/components/AuthLayout.jsx
// Layout oscuro compartido por todas las pantallas de autenticación
import React from 'react';
import {
  View, Image, Text, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../../shared/constants/theme.js';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AuthLayout({
  children,
  title,
  subtitle,
  showLogo = true,
  scrollable = true,
}) {
  const content = (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showLogo && (
              <View style={s.logoArea}>
                <Image
                  source={require('../../../../assets/LogoBancokinal.png')}
                  style={s.logo}
                  resizeMode="contain"
                />
              </View>
            )}
            {(title || subtitle) && (
              <View style={s.headerText}>
                {title && <Text style={s.title}>{title}</Text>}
                {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
              </View>
            )}
            {children}
          </ScrollView>
        ) : (
          <View style={s.scroll}>
            {showLogo && (
              <View style={s.logoArea}>
                <Image
                  source={require('../../../../assets/LogoBancokinal.png')}
                  style={s.logo}
                  resizeMode="contain"
                />
              </View>
            )}
            {(title || subtitle) && (
              <View style={s.headerText}>
                {title && <Text style={s.title}>{title}</Text>}
                {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
              </View>
            )}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return <View style={s.root}>{content}</View>;
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  logo: {
    width: 200,
    height: 100,
  },
  headerText: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnDarkMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
});
