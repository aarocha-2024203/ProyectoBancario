// src/features/auth/screens/RegisterScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuth from '../hooks/useAuth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthInput from '../components/AuthInput.jsx';
import AuthButton from '../components/AuthButton.jsx';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../../shared/constants/theme.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }) {
  const { handleRegister, loading, error, clearError } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [successEmail, setSuccessEmail] = useState(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name:'', surname:'', username:'', email:'', password:'', confirmPassword:'', phone:'' },
  });

  useEffect(() => () => clearError(), []);

  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled && result.assets?.[0]) {
    setProfileImage(result.assets[0]);
  }
};

  const onSubmit = async (data) => {
    clearError();
    let profilePicture = null;
    if (profileImage) {
      const uri = profileImage.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      profilePicture = { uri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' };
    }
    const result = await handleRegister({ ...data, profilePicture });
    if (result.success) setSuccessEmail(data.email);
  };

  if (successEmail) {
    return (
      <AuthLayout showLogo={false}>
        <View style={s.successScreen}>
          <View style={s.successIcon}>
            <MaterialIcons name="mark-email-unread" size={56} color={COLORS.accent} />
          </View>
          <Text style={s.successTitle}>¡Revisa tu correo!</Text>
          <Text style={s.successBody}>Enviamos un código de verificación a:</Text>
          <Text style={s.successEmail}>{successEmail}</Text>
          <Text style={s.successHint}>Copia el token del correo y pégalo en la siguiente pantalla.</Text>
          <AuthButton title="Ingresar token de verificación"
            onPress={() => navigation.navigate('VerifyEmail', { email: successEmail })}
            style={{ marginTop: SPACING.xl }} />
          <AuthButton title="Ya verifiqué, ir al login" variant="ghost"
            onPress={() => navigation.navigate('Login')} style={{ marginTop: SPACING.sm }} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Únete a Banco Kinal">
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

      {/* Avatar */}
      <TouchableOpacity style={s.avatarPicker} onPress={pickImage} activeOpacity={0.8}>
        {profileImage
          ? <Image source={{ uri: profileImage.uri }} style={s.avatarImg} />
          : <View style={s.avatarPlaceholder}>
              <MaterialIcons name="add-a-photo" size={28} color={COLORS.textOnDarkMuted} />
              <Text style={s.avatarText}>Foto de perfil</Text>
            </View>
        }
        {profileImage && (
          <View style={s.avatarBadge}>
            <MaterialIcons name="edit" size={12} color={COLORS.primaryDark} />
          </View>
        )}
      </TouchableOpacity>

      {/* Nombre + Apellido */}
      <View style={s.row}>
        <View style={s.half}>
          <Controller control={control} name="name"
            rules={{ required: 'Requerido', minLength: { value: 2, message: 'Mín. 2' } }}
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput label="Nombre" placeholder="Ana" value={value}
                onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} autoCapitalize="words" required />
            )} />
        </View>
        <View style={s.half}>
          <Controller control={control} name="surname"
            rules={{ required: 'Requerido', minLength: { value: 2, message: 'Mín. 2' } }}
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput label="Apellido" placeholder="García" value={value}
                onChangeText={onChange} onBlur={onBlur} error={errors.surname?.message} autoCapitalize="words" required />
            )} />
        </View>
      </View>

      <Controller control={control} name="username"
        rules={{ required: 'Requerido', minLength: { value: 3, message: 'Mínimo 3' },
          pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Solo letras, números y _' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Usuario" placeholder="ana_garcia" value={value}
            onChangeText={onChange} onBlur={onBlur} error={errors.username?.message} required
            leftIcon={<MaterialIcons name="alternate-email" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <Controller control={control} name="email"
        rules={{ required: 'Requerido', pattern: { value: EMAIL_REGEX, message: 'Correo inválido' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Correo electrónico" placeholder="ana@correo.com" value={value}
            onChangeText={onChange} onBlur={onBlur} error={errors.email?.message}
            keyboardType="email-address" required
            leftIcon={<MaterialIcons name="mail-outline" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <Controller control={control} name="password"
        rules={{ required: 'Requerido', minLength: { value: 8, message: 'Mínimo 8 caracteres' },
          pattern: { value: /^(?=.*[A-Z])(?=.*\d)/, message: 'Mayúscula y número requeridos' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Contraseña" placeholder="••••••••" value={value}
            onChangeText={onChange} onBlur={onBlur} error={errors.password?.message}
            secureTextEntry required
            leftIcon={<MaterialIcons name="lock-outline" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <Controller control={control} name="confirmPassword"
        rules={{ required: 'Confirma tu contraseña',
          validate: (val) => val === watch('password') || 'Las contraseñas no coinciden' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Confirmar contraseña" placeholder="••••••••" value={value}
            onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message}
            secureTextEntry required
            leftIcon={<MaterialIcons name="lock-outline" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <Controller control={control} name="phone"
        rules={{ required: 'Requerido', minLength: { value: 7, message: 'Mínimo 7 dígitos' },
          pattern: { value: /^[0-9+\-\s]+$/, message: 'Solo números' } }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput label="Teléfono" placeholder="55123456" value={value}
            onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message}
            keyboardType="phone-pad" required
            leftIcon={<MaterialIcons name="phone" size={20} color={COLORS.textOnDarkMuted} />} />
        )} />

      <AuthButton title="Crear cuenta" onPress={handleSubmit(onSubmit)} loading={loading} style={s.btn} />

      <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Login')}>
        <Text style={s.loginText}>¿Ya tienes cuenta? <Text style={s.loginAccent}>Inicia sesión</Text></Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkLight },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.md },
  errorText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.errorOnDark },
  avatarPicker: { alignSelf: 'center', marginBottom: SPACING.lg, position: 'relative' },
  avatarImg: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: COLORS.accent },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, borderWidth: 2,
    borderColor: COLORS.borderOnDark, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceAlpha },
  avatarText: { fontSize: 10, color: COLORS.textOnDarkMuted, marginTop: 4 },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
    borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: SPACING.md },
  half: { flex: 1 },
  btn: { marginTop: SPACING.lg },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.lg },
  loginText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted },
  loginAccent: { color: COLORS.accent, fontWeight: FONT_WEIGHT.semibold },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.surfaceAlpha,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  successTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textOnDark, textAlign: 'center' },
  successBody: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted, textAlign: 'center', marginTop: SPACING.md },
  successEmail: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.accent, marginTop: SPACING.xs, textAlign: 'center' },
  successHint: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted, textAlign: 'center', lineHeight: 20, marginTop: SPACING.md, marginBottom: SPACING.lg },
});
