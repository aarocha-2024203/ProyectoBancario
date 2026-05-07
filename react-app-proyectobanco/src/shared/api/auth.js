import api from './api';
import axios from 'axios';

// Instancia especial para forgot-password (su URL no tiene /v1/)
const apiBase = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// POST /auth/register
export const registerUser = (data) =>
  api.post('/auth/register', data);

// POST /auth/verify-email
export const verifyEmail = (token) =>
  api.post('/auth/verify-email', { token });

// POST /auth/login
export const loginUser = (data) =>
  api.post('/auth/login', data);

// POST /auth/resend-verification
export const resendVerification = (email) =>
  api.post('/auth/resend-verification', { email });

// POST /auth/forgot-password
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

// POST /auth/reset-password
export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword });

// GET /auth/profile
export const getProfile = () =>
  api.get('/auth/profile');