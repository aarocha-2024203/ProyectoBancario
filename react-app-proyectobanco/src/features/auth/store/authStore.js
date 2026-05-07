import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getProfile,
} from '../../../shared/api/auth';
import { getErrorMessage } from '../../../shared/utils/toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── Estado ──────────────────────────────────────────────
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Login ────────────────────────────────────────────────
      login: async (emailOrUsername, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await loginUser({ emailOrUsername, password });

          // El backend devuelve: { success, token, userDetails, expiresAt }
          const token = data?.token;
          const userDetails = data?.userDetails;

          if (!token) throw new Error('No se recibió token del servidor');

          set({
            token,
            user: userDetails,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true, user: userDetails };
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      // ── Register ─────────────────────────────────────────────
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await registerUser(userData);
          set({ isLoading: false });
          return { success: true, data };
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      // ── Verify Email ─────────────────────────────────────────
      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await verifyEmail(token);
          set({ isLoading: false });
          return { success: true, data };
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      // ── Resend Verification ──────────────────────────────────
      resendVerification: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await resendVerification(email);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      // ── Forgot Password ──────────────────────────────────────
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await forgotPassword(email);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      // ── Reset Password ───────────────────────────────────────
      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await resetPassword(token, newPassword);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const msg = getErrorMessage(error);
          set({ isLoading: false, error: msg });
          return { success: false, message: msg };
        }
      },

      // ── Logout ───────────────────────────────────────────────
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'bancario-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;