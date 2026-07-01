// src/features/auth/screens/ResetPasswordScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { MaterialIcons } from "@expo/vector-icons";
import useAuth from "../hooks/useAuth.js";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthInput from "../components/AuthInput.jsx";
import AuthButton from "../components/AuthButton.jsx";
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
} from "../../../shared/constants/theme.js";

export default function ResetPasswordScreen({ navigation, route }) {
  const { handleResetPassword, loading, error, clearError } = useAuth();
  const [phase, setPhase] = useState("form");
  const tokenFromLink = route?.params?.token ?? "";

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      token: tokenFromLink,
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromLink) setValue("token", tokenFromLink);
  }, [tokenFromLink]);

  useEffect(() => () => clearError(), []);

  const onSubmit = async ({ token, newPassword }) => {
    clearError();
    const result = await handleResetPassword({
      token: token.trim(),
      newPassword,
    });
    if (result.success) setPhase("success");
  };

  if (phase === "success")
    return (
      <AuthLayout showLogo={false}>
        <View style={s.center}>
          <View style={s.iconWrap}>
            <MaterialIcons
              name="check-circle"
              size={56}
              color={COLORS.accent}
            />
          </View>
          <Text style={s.bigTitle}>¡Contraseña restablecida!</Text>
          <Text style={s.bigSubtitle}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </Text>
          <AuthButton
            title="Iniciar sesión"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: SPACING.xl, width: "100%" }}
          />
        </View>
      </AuthLayout>
    );

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Copia el token de tu correo, pégalo e ingresa tu nueva contraseña"
    >
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={22} color={COLORS.textOnDark} />
        <Text style={s.backText}>Volver</Text>
      </TouchableOpacity>

      {error && (
        <View style={s.errorBanner}>
          <MaterialIcons
            name="error-outline"
            size={16}
            color={COLORS.errorOnDark}
          />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <MaterialIcons name="close" size={16} color={COLORS.errorOnDark} />
          </TouchableOpacity>
        </View>
      )}

      <Controller
        control={control}
        name="token"
        rules={{
          required: "Pega el token del correo",
          minLength: { value: 10, message: "Token inválido" },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            label="Token del correo"
            placeholder="Pega aquí el token recibido"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.token?.message}
            autoCapitalize="none"
            autoCorrect={false}
            required
            leftIcon={
              <MaterialIcons
                name="vpn-key"
                size={20}
                color={COLORS.textOnDarkMuted}
              />
            }
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        rules={{
          required: "Ingresa la nueva contraseña",
          minLength: { value: 8, message: "Mínimo 8 caracteres" },
          pattern: {
            value: /^(?=.*[A-Z])(?=.*\d)/,
            message: "Debe tener mayúscula y número",
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            label="Nueva contraseña"
            placeholder="••••••••"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.newPassword?.message}
            secureTextEntry
            required
            leftIcon={
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={COLORS.textOnDarkMuted}
              />
            }
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        rules={{
          required: "Confirma tu contraseña",
          validate: (val) =>
            val === watch("newPassword") || "Las contraseñas no coinciden",
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            secureTextEntry
            required
            leftIcon={
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={COLORS.textOnDarkMuted}
              />
            }
          />
        )}
      />

      <AuthButton
        title="Restablecer contraseña"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={s.btn}
      />
      <AuthButton
        title="Volver al login"
        variant="ghost"
        onPress={() => navigation.navigate("Login")}
        style={{ marginTop: SPACING.sm }}
      />
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkLight },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.errorOnDark },
  btn: { marginTop: SPACING.xl },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surfaceAlpha,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  bigTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnDark,
    textAlign: "center",
  },
  bigSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textOnDarkMuted,
    textAlign: "center",
    marginTop: SPACING.md,
  },
});
