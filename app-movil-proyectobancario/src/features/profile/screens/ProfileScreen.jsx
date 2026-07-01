// src/features/profile/screens/ProfileScreen.jsx
// Pantalla de perfil compartida: funciona para CLIENT y ADMIN
// Recibe: onLogout (fn), addNotif (fn opcional)
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useProfile from '../hooks/useProfile.js';
import {
  COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS,
} from '../../../shared/constants/theme.js';

// ─── Paleta clara (igual que ClientDashboard) ─────────────────────────────────
const C = {
  bg:         '#F2F4F7',
  surface:    '#FFFFFF',
  primary:    '#08316D',
  primaryMid: '#0A4A9E',
  accent:     '#00BCD4',
  text:       '#0F172A',
  textSub:    '#64748B',
  textMuted:  '#94A3B8',
  border:     '#E2E8F0',
  success:    '#10B981',
  error:      '#EF4444',
  warning:    '#F59E0B',
};

// ─── Componentes internos ─────────────────────────────────────────────────────

const Banner = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const isE = type === 'error';
  return (
    <View style={[bn.w, {
      borderLeftColor: isE ? C.error : C.success,
      backgroundColor: isE ? '#FEF2F2' : '#F0FDF4',
    }]}>
      <MaterialIcons name={isE ? 'error-outline' : 'check-circle'} size={15}
        color={isE ? C.error : C.success} />
      <Text style={[bn.t, { color: isE ? C.error : C.success }]}>{msg}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
        <MaterialIcons name="close" size={15} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  );
};
const bn = StyleSheet.create({
  w: { flexDirection:'row', alignItems:'center', gap:8, borderLeftWidth:3,
    borderRadius:8, padding:12, marginBottom:12 },
  t: { flex:1, fontSize:FONT_SIZE.sm, lineHeight:18 },
});

// Input con borde (fondo blanco)
const LInput = ({ label, value, onChangeText, placeholder, secure, required }) => {
  const [focused, setFocused] = useState(false);
  const [hidden,  setHidden]  = useState(!!secure);
  const WEB = Platform.OS === 'web'
    ? { outline:'none', border:'none', backgroundColor:'transparent' }
    : { backgroundColor:'transparent' };
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label && (
        <Text style={li.lbl}>
          {label}{required && <Text style={{ color:C.accent }}> *</Text>}
        </Text>
      )}
      <View style={[li.row, focused && { borderColor: C.primaryMid }]}>
        <Text style={li.inp}
          // Using TextInput below
        />
      </View>
    </View>
  );
};

// Usamos TextInput directamente para evitar el bug del render vacío
import { TextInput } from 'react-native';
const Field = ({ label, value, onChangeText, secure, required }) => {
  const [focused, setFocused] = useState(false);
  const [hidden,  setHidden]  = useState(!!secure);
  const WEB = Platform.OS === 'web'
    ? { outline:'none', border:'none', backgroundColor:'transparent' }
    : { backgroundColor:'transparent' };
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={li.lbl}>
        {label}{required && <Text style={{ color:C.accent }}> *</Text>}
      </Text>
      <View style={[li.row, focused && { borderColor: C.primaryMid }]}>
        <TextInput
          style={[li.input, WEB]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={C.textMuted}
          placeholder={label}
        />
        {secure && (
          <TouchableOpacity onPress={() => setHidden(h => !h)}
            hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <MaterialIcons name={hidden ? 'visibility-off' : 'visibility'} size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
const li = StyleSheet.create({
  lbl:   { fontSize:FONT_SIZE.xs, color:C.textSub, fontWeight:FONT_WEIGHT.semibold,
    marginBottom:6, textTransform:'uppercase', letterSpacing:0.4 },
  row:   { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:C.border,
    borderRadius:BORDER_RADIUS.md, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm+2,
    backgroundColor:C.surface, gap:8 },
  input: { flex:1, fontSize:FONT_SIZE.md, color:C.text },
  inp:   {},
});

const PBtn = ({ title, onPress, loading, style, ghost, icon }) => (
  <TouchableOpacity
    style={[pb.btn, ghost && pb.ghost, style]}
    onPress={onPress} disabled={loading} activeOpacity={0.85}>
    {loading
      ? <ActivityIndicator color={ghost ? C.primary : '#fff'} size="small" />
      : <>
          {icon && <MaterialIcons name={icon} size={18} color={ghost ? C.primary : '#fff'} />}
          <Text style={[pb.lbl, ghost && pb.lblG]}>{title}</Text>
        </>
    }
  </TouchableOpacity>
);
const pb = StyleSheet.create({
  btn:  { height:50, borderRadius:BORDER_RADIUS.full, backgroundColor:C.primary,
    justifyContent:'center', alignItems:'center', flexDirection:'row', gap:8, ...SHADOWS.sm },
  ghost:{ backgroundColor:'transparent', elevation:0,
    borderWidth:1.5, borderColor:C.primary },
  lbl:  { fontSize:FONT_SIZE.md, fontWeight:FONT_WEIGHT.bold, color:'#fff' },
  lblG: { color:C.primary },
});

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function ProfileScreen({ onLogout, addNotif }) {
  const { user, loading, submitting, error, success,
    clearMsg, fetchProfile, changePassword, changePhoto } = useProfile();

  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' });
  const [pwErr,  setPwErr]  = useState(null);
  const [pwOk,   setPwOk]   = useState(null);

  // Intenta refrescar perfil del servidor, pero no bloquea el render
  // porque el store ya tiene los datos del login
  useEffect(() => {
    fetchProfile().catch(() => {}); // silencioso si falla
  }, []);

  // Nunca bloqueamos — el store siempre tiene datos del login

  const initials = user?.name
    ? `${user.name[0]}${user.surname?.[0] ?? ''}`.toUpperCase()
    : (user?.username?.[0] ?? 'U').toUpperCase();

  const displayName = user?.name
    ? `${user.name}${user.surname ? ' ' + user.surname : ''}`.trim()
    : user?.username ?? 'Usuario';

  // ── Cambiar foto ────────────────────────────────────────────────────────────
  const [imgError, setImgError] = useState(false);

  // La foto es válida si existe, es una URI local (file:// o data:) o una URL real no-default
  const photoUri = user?.profilePicture ?? null;
  const isValidPhoto = photoUri
    && !imgError
    && !photoUri.includes('default-avatar')
    && (
      photoUri.startsWith('file://')   ||  // móvil
      photoUri.startsWith('data:')     ||  // base64 (web persistido)
      photoUri.startsWith('blob:')     ||  // blob temporal web
      (photoUri.startsWith('http') && !photoUri.includes('default-avatar'))
    );

  const handlePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        // MediaType reemplaza MediaTypeOptions en v16
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setImgError(false); // nueva foto local nunca falla
      const r = await changePhoto(asset);
      if (r.success && addNotif) {
        addNotif({ icon:'person', color:'#7C3AED', bg:'#F5F3FF',
          title:'Foto de perfil actualizada', sub:'Tu foto se actualizó correctamente' });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  // ── Cambiar contraseña ──────────────────────────────────────────────────────
  const handlePassword = async () => {
    setPwErr(null); setPwOk(null);
    const { current, newPw, confirm } = pwForm;
    if (!current || !newPw || !confirm) { setPwErr('Todos los campos son obligatorios.'); return; }
    if (newPw !== confirm)             { setPwErr('Las contraseñas nuevas no coinciden.'); return; }
    if (newPw.length < 8)             { setPwErr('Mínimo 8 caracteres para la nueva contraseña.'); return; }
    const r = await changePassword({ currentPassword: current, newPassword: newPw });
    if (r.success) {
      setPwOk('Contraseña actualizada correctamente.');
      setPwForm({ current:'', newPw:'', confirm:'' });
      if (addNotif) addNotif({ icon:'lock', color:C.success, bg:'#F0FDF4',
        title:'Contraseña actualizada', sub:'Tu contraseña se cambió exitosamente' });
    } else {
      setPwErr(r.error ?? 'Error al cambiar la contraseña.');
    }
  };

  // No bloqueamos el render — mostramos datos del store inmediatamente

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── AVATAR ─────────────────────────────────────────────────────── */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={handlePhoto} activeOpacity={0.85} style={s.avatarWrap}>
            {isValidPhoto
              ? <Image
                  source={{ uri: photoUri }}
                  style={s.avatarImg}
                  onError={() => setImgError(true)}
                />
              : <View style={s.avatarFallback}>
                  <Text style={s.avatarInitials}>{initials}</Text>
                </View>
            }
            {/* Overlay de cámara */}
            <View style={s.cameraOverlay}>
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="photo-camera" size={16} color="#fff" />
              }
            </View>
          </TouchableOpacity>
          <Text style={s.name}>{displayName}</Text>
          <View style={s.rolePill}>
            <Text style={s.roleText}>
              {user?.role === 'ADMIN_ROLE' ? 'ADMINISTRADOR' : 'CLIENTE'}
            </Text>
          </View>
          {/* Mensaje de error/éxito de foto */}
          {(error || success) && (
            <Banner msg={error ?? success} type={error ? 'error' : 'success'}
              onClose={clearMsg} />
          )}
        </View>

        {/* ── DATOS PERSONALES ───────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Información personal</Text>
          {[
            { icon:'person',           label:'Nombre',   value: user?.name ? `${user.name} ${user.surname ?? ''}`.trim() : null },
            { icon:'alternate-email',  label:'Usuario',  value: user?.username ? `@${user.username}` : null },
            { icon:'email',            label:'Correo',   value: user?.email ?? null },
            { icon:'phone',            label:'Teléfono', value: user?.phone ?? null },
            { icon:'badge',            label:'Rol',      value: user?.role ?? null },
          ].map(item => (
            <View key={item.label} style={s.infoRow}>
              <View style={s.infoLeft}>
                <View style={s.infoIcon}>
                  <MaterialIcons name={item.icon} size={17} color={C.primaryMid} />
                </View>
                <Text style={s.infoLabel}>{item.label}</Text>
              </View>
              <Text style={s.infoValue} numberOfLines={1}>
                {item.value ?? '—'}
              </Text>
            </View>
          ))}
          <Text style={s.infoNote}>
            Para cambiar nombre, correo o usuario contacta al administrador.
          </Text>
        </View>

        {/* ── CAMBIAR CONTRASEÑA ──────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Cambiar contraseña</Text>
          <Banner msg={pwErr} type="error"   onClose={() => setPwErr(null)} />
          <Banner msg={pwOk}  type="success" onClose={() => setPwOk(null)} />
          <Field label="Contraseña actual" value={pwForm.current}
            onChangeText={v => setPwForm(p => ({...p, current:v}))} secure required />
          <Field label="Nueva contraseña" value={pwForm.newPw}
            onChangeText={v => setPwForm(p => ({...p, newPw:v}))} secure required />
          <Field label="Confirmar nueva contraseña" value={pwForm.confirm}
            onChangeText={v => setPwForm(p => ({...p, confirm:v}))} secure required />
          <View style={{ height: SPACING.sm }} />
          <PBtn title="Actualizar contraseña" icon="lock"
            onPress={handlePassword} loading={submitting} />
        </View>

        {/* ── CERRAR SESIÓN ───────────────────────────────────────────────── */}
        <TouchableOpacity style={s.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color={C.error} />
          <Text style={s.logoutTxt}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor:C.bg },
  center:  { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:C.bg },
  content: { padding:SPACING.lg },

  // Avatar
  avatarSection:   { alignItems:'center', marginBottom:SPACING.lg },
  avatarWrap:      { width:100, height:100, borderRadius:50, marginBottom:SPACING.md,
    ...SHADOWS.lg, position:'relative' },
  avatarImg:       { width:100, height:100, borderRadius:50 },
  avatarFallback:  { width:100, height:100, borderRadius:50, backgroundColor:C.primary,
    justifyContent:'center', alignItems:'center' },
  avatarInitials:  { fontSize:FONT_SIZE.xxxl, fontWeight:FONT_WEIGHT.bold, color:'#fff' },
  cameraOverlay:   { position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:15,
    backgroundColor:C.primaryMid, justifyContent:'center', alignItems:'center',
    borderWidth:2.5, borderColor:C.bg },
  name:    { fontSize:FONT_SIZE.xl, fontWeight:FONT_WEIGHT.bold, color:C.text, marginBottom:6 },
  rolePill:{ backgroundColor:'#EFF6FF', paddingHorizontal:SPACING.md, paddingVertical:4,
    borderRadius:BORDER_RADIUS.full, marginBottom:SPACING.md },
  roleText:{ fontSize:FONT_SIZE.xs, color:C.primaryMid, fontWeight:FONT_WEIGHT.bold, letterSpacing:1 },

  // Card
  card:      { backgroundColor:C.surface, borderRadius:BORDER_RADIUS.xl, padding:SPACING.lg,
    marginBottom:SPACING.md, ...SHADOWS.sm },
  cardTitle: { fontSize:FONT_SIZE.sm, fontWeight:FONT_WEIGHT.bold, color:C.primary,
    textTransform:'uppercase', letterSpacing:0.5, marginBottom:SPACING.md },

  // Info rows
  infoRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingVertical:SPACING.sm+2, borderBottomWidth:1, borderBottomColor:C.border },
  infoLeft:  { flexDirection:'row', alignItems:'center', gap:SPACING.sm },
  infoIcon:  { width:32, height:32, borderRadius:16, backgroundColor:'#EFF6FF',
    justifyContent:'center', alignItems:'center' },
  infoLabel: { fontSize:FONT_SIZE.sm, color:C.textSub },
  infoValue: { fontSize:FONT_SIZE.sm, color:C.text, fontWeight:FONT_WEIGHT.medium,
    maxWidth:'55%', textAlign:'right' },
  infoNote:  { fontSize:FONT_SIZE.xs, color:C.textMuted, marginTop:SPACING.md,
    lineHeight:16, textAlign:'center' },

  // Logout
  logoutBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:SPACING.sm,
    borderWidth:1.5, borderColor:C.error, borderRadius:BORDER_RADIUS.full, height:52,
    backgroundColor:C.surface, marginTop:SPACING.sm, ...SHADOWS.sm },
  logoutTxt: { fontSize:FONT_SIZE.md, fontWeight:FONT_WEIGHT.semibold, color:C.error },
});