// src/features/auth/screens/LoginScreen.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Linking,
  Switch,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { MaterialIcons } from "@expo/vector-icons";
import useAuth from "../hooks/useAuth.js";
import AuthInput from "../components/AuthInput.jsx";
import AuthButton from "../components/AuthButton.jsx";
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
} from "../../../shared/constants/theme.js";

const CONTACT_OPTIONS = [
  {
    icon: "chat",
    label: "WhatsApp",
    sub: "+502 0000-0000",
    url: "https://wa.me/50200000000",
    color: "#25D366",
  },
  {
    icon: "language",
    label: "Sitio web",
    sub: "www.bancokinal.edu.gt",
    url: "https://bancokinal.edu.gt",
    color: COLORS.accent,
  },
  {
    icon: "thumb-up",
    label: "Facebook",
    sub: "@BancoKinal",
    url: "https://facebook.com/bancokinal",
    color: "#1877F2",
  },
  {
    icon: "photo-camera",
    label: "Instagram",
    sub: "@bancokinal",
    url: "https://instagram.com/bancokinal",
    color: "#E1306C",
  },
];

export default function LoginScreen({ navigation, route }) {
  const { handleLogin, loading, error, clearError } = useAuth();
  const successMessage = route?.params?.message ?? null;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { emailOrUsername: "", password: "" },
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Animación: solo los 2 campos se ocultan/muestran
  const formAnim = useRef(new Animated.Value(0)).current;
  // Animación drawer contacto
  const drawerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => () => clearError(), []);

  const toggleForm = () => {
    const next = !formOpen;
    Animated.timing(formAnim, {
      toValue: next ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setFormOpen(next);
  };

  // maxHeight animado — se expande hasta 400px max, el contenido real define cuánto ocupa
  const fieldsMaxHeight = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const fieldsOpacity = formAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const arrowRotate = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const openContact = () => {
    setContactOpen(true);
    Animated.spring(drawerAnim, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const closeContact = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setContactOpen(false));
  };

  const drawerTranslate = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  const onSubmit = async (data) => {
    clearError();
    await handleLogin(data);
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ──────────────────────────────────────────────────── */}
          <View style={s.logoArea}>
            <Image
              source={require("../../../../assets/LogoBancokinal.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          {/* ── Banners ───────────────────────────────────────────────── */}
          {successMessage && (
            <View style={s.successBanner}>
              <MaterialIcons
                name="check-circle"
                size={16}
                color={COLORS.accent}
              />
              <Text style={s.successText}>{successMessage}</Text>
            </View>
          )}
          {error && (
            <View style={s.errorBanner}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={COLORS.errorOnDark}
              />
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={clearError}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name="close"
                  size={16}
                  color={COLORS.errorOnDark}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Acordeón — solo oculta/muestra los 2 campos ──────────── */}
          <TouchableOpacity
            style={s.accordion}
            onPress={toggleForm}
            activeOpacity={0.8}
          >
            <View style={s.accordionLeft}>
              <MaterialIcons
                name="keyboard"
                size={20}
                color={COLORS.textOnDarkMuted}
              />
              <Text style={s.accordionText}>Ingresar con datos</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
              <MaterialIcons
                name="expand-more"
                size={26}
                color={COLORS.accent}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Solo correo y contraseña se animan */}
          <Animated.View
            style={[
              s.fieldsPanel,
              { maxHeight: fieldsMaxHeight, opacity: fieldsOpacity },
            ]}
          >
            <View style={s.fieldsInner}>
              <Controller
                control={control}
                name="emailOrUsername"
                rules={{
                  required: "Ingresa tu correo o usuario",
                  minLength: { value: 3, message: "Mínimo 3" },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Correo o usuario"
                    placeholder="correo@ejemplo.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.emailOrUsername?.message}
                    keyboardType="email-address"
                    leftIcon={
                      <MaterialIcons
                        name="person-outline"
                        size={20}
                        color={COLORS.textOnDarkMuted}
                      />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Ingresa tu contraseña",
                  minLength: { value: 4, message: "Mínimo 4" },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Contraseña"
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry
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
            </View>
          </Animated.View>

          {/* ── Siempre visibles ──────────────────────────────────────── */}

          {/* Recordarme */}
          <View style={s.rememberRow}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: COLORS.borderOnDark, true: COLORS.accent }}
              thumbColor={COLORS.surface}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
            <Text style={s.rememberText}>Recordarme</Text>
          </View>

          {/* Biométricos */}
          <View style={s.bioRow}>
            <TouchableOpacity style={s.bioBtn} activeOpacity={0.7}>
              <MaterialIcons
                name="face"
                size={22}
                color={COLORS.textOnDarkMuted}
              />
              <Text style={s.bioText}>Face ID</Text>
            </TouchableOpacity>
            <View style={s.bioDivider} />
            <TouchableOpacity style={s.bioBtn} activeOpacity={0.7}>
              <MaterialIcons
                name="face-retouching-natural"
                size={22}
                color={COLORS.textOnDarkMuted}
              />
              <Text style={s.bioText}>Rec. Facial BK</Text>
            </TouchableOpacity>
          </View>

          {/* Botón Ingresar */}
          <AuthButton
            title="Ingresar"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={s.btn}
          />

          {/* Links */}
          <TouchableOpacity
            style={s.link}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={s.linkText}>Olvidé mi contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.link}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={s.linkText}>Consulta / Crea tu Usuario</Text>
          </TouchableOpacity>

          {/* ── Botón Contáctanos (cyan original) ────────────────────── */}
          <TouchableOpacity
            style={s.contactBtn}
            onPress={openContact}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="support-agent"
              size={20}
              color={COLORS.primaryDark}
            />
            <Text style={s.contactBtnText}>Contáctanos</Text>
            <MaterialIcons
              name="keyboard-arrow-up"
              size={20}
              color={COLORS.primaryDark}
            />
          </TouchableOpacity>

          <Text style={s.version}>Versión: 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* ── Drawer contacto ───────────────────────────────────────────── */}
      {contactOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              s.backdrop,
              { opacity: backdropOpacity },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeContact}
            />
          </Animated.View>

          <Animated.View
            style={[s.drawer, { transform: [{ translateY: drawerTranslate }] }]}
          >
            <View style={s.drawerHandle} />
            <View style={s.drawerHeader}>
              <Text style={s.drawerTitle}>Contáctanos</Text>
              <TouchableOpacity
                onPress={closeContact}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={s.drawerSub}>
              Estamos para ayudarte. Elige cómo prefieres contactarnos.
            </Text>

            {CONTACT_OPTIONS.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  s.contactItem,
                  i === CONTACT_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  Linking.openURL(item.url).catch(() => {});
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.contactIcon,
                    { backgroundColor: `${item.color}22` },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={item.color}
                  />
                </View>
                <View style={s.contactInfo}>
                  <Text style={s.contactLabel}>{item.label}</Text>
                  <Text style={s.contactSub}>{item.sub}</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primaryDark },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  logoArea: {
    alignItems: "center",
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  logo: { width: 210, height: 105 },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(0,188,212,0.15)",
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  successText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.accent },
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

  // Acordeón
  accordion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderOnDark,
    paddingVertical: SPACING.md,
  },
  accordionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  accordionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Solo los 2 campos se animan
  fieldsPanel: { overflow: "hidden" },
  fieldsInner: { paddingTop: SPACING.md },

  // Siempre visibles
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rememberText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkLight },

  bioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  bioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  bioText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkMuted },
  bioDivider: { width: 1, height: 20, backgroundColor: COLORS.borderOnDark },

  btn: { marginBottom: SPACING.xs },

  link: { alignItems: "center", paddingVertical: SPACING.sm + 2 },
  linkText: { fontSize: FONT_SIZE.sm, color: COLORS.textOnDarkLight },

  // Botón Contáctanos — cyan original
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  contactBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },

  version: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textOnDarkMuted,
    textAlign: "center",
    marginTop: SPACING.sm,
  },

  backdrop: { backgroundColor: "#000" },

  // Drawer — panel blanco hueso
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F5F0E8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4CEBC",
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  drawerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  drawerSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },

  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E3D5",
    gap: SPACING.md,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  contactSub: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
});
