import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3005/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const getToken = () => {
  try {
    const stored = localStorage.getItem('bancario-auth');
    if (!stored) return null;
    return JSON.parse(stored)?.state?.token || null;
  } catch { return null; }
};

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bancario-auth');
      window.location.href = '/auth/login';
    }
    if (error.response?.status === 403) {
      // El usuario ya no tiene permisos — verificar su rol actual
      try {
        const stored = localStorage.getItem('bancario-auth');
        const state  = JSON.parse(stored)?.state;
        const role   = state?.user?.role;
        // Si está en el admin pero ya no tiene rol admin, redirige
        if (window.location.pathname.includes('/dashboard/admin') && role !== 'ADMIN_ROLE') {
          window.location.href = '/dashboard';
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;