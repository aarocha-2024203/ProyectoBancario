// src/features/auth/screens/VerifyEmailScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthInput from '../components/AuthInput.jsx';
import AuthButton from '../components/AuthButton.jsx';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../../shared/constants/theme.js';

export default function VerifyEmailScreen({ navigation, route }) {
  const { handleVerifyEmail, handleResendVerification, loading, error, clearError } = useAuth();
  const tokenFromLink  = route?.params?.token     ?? '';
  const emailFromRoute = route?.params?.email     ?? '';
  const autoVerify     = route?.params?.autoVerify ?? false;

  const [verified, setVerified]             = useState(false);
  const [autoLoading, setAutoLoading]       = useState(false);
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const didAutoVerify = useRef(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { token: tokenFromLink },
  });

  useEffect(() => {
    if (!autoVerify || !tokenFromLink || didAutoVerify.current) return;
    didAutoVerify.current = true;
    const run = async () => {
      setAutoLoading(true); clearError();
      const result = await handleVerifyEmail(tokenFromLink);
      setAutoLoading(false);
      if (result.success) setVerified(true);
    };
    run();
  }, []);

  useEffect(() => {
    if (tokenFromLink && !autoVerify) setValue('token', tokenFromLink);
  }, [tokenFromLink]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const onSubmit = async ({ token }) => {
    clearError();
    const result = await handleVerifyEmail(token.trim());
    if (result.success) setVerified(true);
  };

  const onResend = async () => {
    if (!emailFromRoute) return;
    setResendLoading(true);
    const result = await handleResendVerification(emailFromRoute);
    setResendLoading(false);
    if (result.success) setResendCooldown(60);
  };

  if (autoLoading) return (
    <AuthLayout showLogo={false}>
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={s.loadingText}>Verificando tu correo…</Text>
      </View>
    </AuthLayout>
  );

  if (verified) return (
    <AuthLayout showLogo={false}>
      <View style={s.center}>
        <View style={s.iconWrap}>
          <MaterialIcons name="verified" size={56} color={COLORS.accent} />
        </View>
        <Text style={s.bigTitle}>¡Correo verificado!</Text>
        <Text style={s.bigSubtitle}>Tu cuenta está activa. Ya puedes iniciar sesión.</Text>
        <AuthButton title="Iniciar sesión" onPress={() => navigation.navigate('Login')}
          style={{ marginTop: SPACING.xl, width: '100%' }} />
      </View>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Verifica tu correo" subtitle="Copia el token del correo y pégalo aquí">
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={22} color={COLORS.textOnDark} />
        <Text style={s.backText}>Volver</Text>
      </TouchableOpacity>

      {error && (
        <View style={s.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color={COLORS.errorOnDark} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <MaterialIcons name="close" size={16} color={COLORS.errorOnDark} />
          </TouchableOpacity>
        </View>
      )}

      <Controller control={control} name="token"
        rules={{ required: 'Pega el token de verificación', minLength: { value: 10, message: 'Token inválido' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Token de verificación" placeholder="Pega aquí el token del correo"
            value={value} onChangeText={onChange} onBlur={onBlur}
            error={errors.token?.message} autoCapitalize="none" autoCorrect={false} required
            leftIcon={<MaterialIcons name="vpn-key" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <AuthButton title="Verificar cuenta" onPress={handleSubmit(onSubmit)} loading={loading} style={s.btn} />

      {emailFromRoute ? (
        <View style={s.resendRow}>
          <Text style={s.resendText}>¿No recibiste el correo? </Text>
          {resendCooldown > 0
            ? <Text style={s.resendCooldown}>Reenviar en {resendCooldown}s</Text>
            : <TouchableOpacity onPress={onResend} disabled={resendLoading}>
                <Text style={s.resendLink}>{resendLoading ? 'Enviando…' : 'Reenviar'}</Text>
              </TouchableOpacity>
          }
        </View>
      ) : null}

      <AuthButton title="Volver al login" variant="ghost"
        onPress={() => navigation.navigate('Login')} style={{ marginTop: SPACING.sm }} />
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkLight },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.md },
  errorText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.errorOnDark },
  btn: { marginTop: SPACING.xl },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  resendText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted },
  resendLink: { fontSize: FONT_SIZE.sm, color: COLORS.accent, fontWeight: FONT_WEIGHT.semibold },
  resendCooldown: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  loadingText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.md, color: COLORS.textOnDarkMuted },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surfaceAlpha,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  bigTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textOnDark, textAlign: 'center' },
  bigSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted, textAlign: 'center', marginTop: SPACING.md },
});
