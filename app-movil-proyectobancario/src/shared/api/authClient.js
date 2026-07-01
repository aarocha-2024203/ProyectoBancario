// src/shared/api/authClient.js
import axios from 'axios';
import { ENDPOINTS } from '../constants/endpoints.js';
import { getRefreshToken, useAuthStore } from '../store/authStore.js';

const NO_REFRESH_PATHS = [
  '/auth/login', '/auth/register', '/auth/forgot-password',
  '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification',
];
const isNoRefreshPath = (url = '') =>
  NO_REFRESH_PATHS.some((p) => url.includes(p));

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

const authClient = axios.create({
  baseURL: ENDPOINTS.AUTH.BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

authClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const is401 = error.response?.status === 401;
    if (!is401 || original._retry || isNoRefreshPath(original.url)) {
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return authClient(original);
      });
    }
    original._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('Sin refresh token');
      const { data } = await axios.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });
      const newToken = data?.accessToken || data?.token;
      if (!newToken) throw new Error('Refresh no devolvió token');
      useAuthStore.getState().setAccessToken(newToken);
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return authClient(original);
    } catch (err) {
      processQueue(err, null);
      await useAuthStore.getState().logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default authClient;