// src/features/profile/hooks/useProfile.js
import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../../../shared/store/authStore.js';
import authClient from '../../../shared/api/authClient.js';
import { ENDPOINTS } from '../../../shared/constants/endpoints.js';

export default function useProfile() {
  const user       = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(null);

  const clearMsg = () => { setError(null); setSuccess(null); };

  // ── GET /auth/profile ─────────────────────────────────────────────────────────
  // Refresca los datos del store con lo que devuelve el servidor
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authClient.get(ENDPOINTS.AUTH.PROFILE);
      const profile = res.data?.userDetails ?? res.data?.user ?? res.data?.data ?? res.data;
      if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
        updateUser(profile);
      }
    } catch {
      // Silencioso — el store ya tiene los datos del login
    } finally { setLoading(false); }
  }, [updateUser]);

  // ── Cambio de contraseña ──────────────────────────────────────────────────────
  // El backend NO tiene este endpoint — lo indicamos al usuario
  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      // Intenta el endpoint estándar
      await authClient.put(`${ENDPOINTS.AUTH.BASE}/change-password`, {
        currentPassword, newPassword,
      });
      setSuccess('Contraseña actualizada correctamente.');
      setSubmitting(false);
      return { success: true };
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 405) {
        // El endpoint no existe en este backend
        setError('Tu servidor no soporta cambio de contraseña desde la app. Usa "Olvidé mi contraseña" en el login.');
      } else {
        setError(e?.response?.data?.message ?? 'Contraseña actual incorrecta.');
      }
      setSubmitting(false);
      return { success: false };
    }
  }, []);

  // ── Cambio de foto ────────────────────────────────────────────────────────────
  // Guarda como base64 para que persista en AsyncStorage/localStorage en web
  const changePhoto = useCallback(async (imageAsset) => {
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      let photoToSave = imageAsset.uri;

      // En web, las URIs blob:// no persisten entre recargas
      // Convertir a base64 para que AsyncStorage (localStorage) lo guarde
      if (Platform.OS === 'web' && imageAsset.uri.startsWith('blob:')) {
        try {
          const resp = await fetch(imageAsset.uri);
          const blob = await resp.blob();
          photoToSave = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result); // data:image/...;base64,...
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          // Si falla la conversión, usar la URI original (funcionará solo en esta sesión)
          photoToSave = imageAsset.uri;
        }
      }

      // Guardar en el store → Zustand lo persiste en AsyncStorage automáticamente
      updateUser({ profilePicture: photoToSave });
      setSuccess('Foto de perfil actualizada.');
      return { success: true };
    } catch {
      setError('No se pudo guardar la foto.');
      return { success: false };
    } finally { setSubmitting(false); }
  }, [updateUser]);

  return {
    user, loading, submitting, error, success,
    clearMsg, fetchProfile, changePassword, changePhoto,
  };
}