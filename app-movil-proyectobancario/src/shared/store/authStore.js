// src/shared/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REFRESH_KEY = 'pb_refresh_token';

let _SecureStore = null;
const getSecureStore = async () => {
  if (Platform.OS === 'web') return null;
  if (!_SecureStore) _SecureStore = await import('expo-secure-store');
  return _SecureStore;
};

export const saveRefreshToken = async (token) => {
  try {
    const SS = await getSecureStore();
    if (SS) await SS.setItemAsync(REFRESH_KEY, token);
    else await AsyncStorage.setItem(REFRESH_KEY, token);
  } catch (_) {}
};

export const getRefreshToken = async () => {
  try {
    const SS = await getSecureStore();
    if (SS) return SS.getItemAsync(REFRESH_KEY);
    return AsyncStorage.getItem(REFRESH_KEY);
  } catch (_) { return null; }
};

export const deleteRefreshToken = async () => {
  try {
    const SS = await getSecureStore();
    if (SS) await SS.deleteItemAsync(REFRESH_KEY);
    else await AsyncStorage.removeItem(REFRESH_KEY);
  } catch (_) {}
};

export const getRoleFromToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.role ?? decoded.roles?.[0] ?? decoded.roleName ?? null;
  } catch (_) { return null; }
};

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      _hasHydrated: false,

      login: async (accessToken, userData, refreshToken) => {
        if (refreshToken) await saveRefreshToken(refreshToken);
        const roleFromToken = getRoleFromToken(accessToken);
        const roleFromUser  = userData?.role ?? userData?.roleName ?? userData?.roles?.[0] ?? null;
        const role = roleFromToken ?? roleFromUser ?? null;
        set({ token: accessToken, user: userData, role, isAuthenticated: true });
      },

      logout: async () => {
        await deleteRefreshToken();
        set({ token: null, user: null, role: null, isAuthenticated: false });
      },

      setAccessToken: (accessToken) => {
        const role = getRoleFromToken(accessToken);
        set((s) => ({ token: accessToken, isAuthenticated: !!accessToken, role: role ?? s.role }));
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : partial,
        }));
      },

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'pb_auth_store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);

// Exportación named + default para compatibilidad CJS/ESM en Metro web
export { useAuthStore };
export default useAuthStore;