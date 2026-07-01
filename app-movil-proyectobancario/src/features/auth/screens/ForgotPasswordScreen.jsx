// src/features/auth/screens/ForgotPasswordScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthInput from '../components/AuthInput.jsx';
import AuthButton from '../components/AuthButton.jsx';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../../shared/constants/theme.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation }) {
  const { handleForgotPassword, loading, error, clearError } = useAuth();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '' } });

  useEffect(() => () => clearError(), []);

  const onSubmit = async ({ email }) => {
    clearError();
    const result = await handleForgotPassword(email);
    if (result.success) { setSentEmail(email); setSent(true); }
  };

  if (sent) return (
    <AuthLayout showLogo={false}>
      <View style={s.center}>
        <View style={s.iconWrap}>
          <MaterialIcons name="mark-email-read" size={56} color={COLORS.accent} />
        </View>
        <Text style={s.title}>Correo enviado</Text>
        <Text style={s.subtitle}>
          Enviamos un token a{'\n'}
          <Text style={s.emailHL}>{sentEmail}</Text>
          {'\n'}Cópialo del correo y pégalo en la siguiente pantalla.
        </Text>
        <AuthButton
          title="Ingresar token y nueva contraseña"
          onPress={() => navigation.navigate('ResetPassword')}
          style={{ marginTop: SPACING.xl, width: '100%' }}
        />
        <AuthButton title="Volver al login" variant="ghost"
          onPress={() => navigation.navigate('Login')} style={{ marginTop: SPACING.sm }} />
      </View>
    </AuthLayout>
  );

  return (
    <AuthLayout title="¿Olvidaste tu contraseña?" subtitle="Ingresa tu correo y te enviamos instrucciones">
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={22} color={COLORS.textOnDark} />
        <Text style={s.backText}>Volver</Text>
      </TouchableOpacity>

      {error && (
        <View style={s.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color={COLORS.errorOnDark} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      <Controller control={control} name="email"
        rules={{ required: 'Ingresa tu correo', pattern: { value: EMAIL_REGEX, message: 'Correo inválido' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Correo electrónico" placeholder="tu@correo.com"
            value={value} onChangeText={onChange} onBlur={onBlur}
            error={errors.email?.message} keyboardType="email-address" required
            leftIcon={<MaterialIcons name="mail-outline" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <AuthButton title="Enviar instrucciones" onPress={handleSubmit(onSubmit)} loading={loading} style={s.btn} />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surfaceAlpha,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textOnDark, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted, textAlign: 'center', lineHeight: 22, marginTop: SPACING.md },
  emailHL: { fontWeight: FONT_WEIGHT.bold, color: COLORS.accent },
});
