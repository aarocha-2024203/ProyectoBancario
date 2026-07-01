// src/shared/api/userClient.js
import axios from 'axios';
import { ENDPOINTS } from '../constants/endpoints.js';
import { getRefreshToken, useAuthStore } from '../store/authStore.js';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

const userClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BANKING_URL || 'http://localhost:3006/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

userClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

userClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const is401 = error.response?.status === 401;
    if (!is401 || original._retry) return Promise.reject(error);
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return userClient(original);
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
      return userClient(original);
    } catch (err) {
      processQueue(err, null);
      await useAuthStore.getState().logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default userClient;