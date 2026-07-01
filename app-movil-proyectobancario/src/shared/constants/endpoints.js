// src/shared/constants/endpoints.js

const AUTH_BASE =
  process.env.EXPO_PUBLIC_AUTH_URL || 'http://localhost:3005/api/v1';

const BANKING_BASE =
  process.env.EXPO_PUBLIC_BANKING_URL || 'http://localhost:3006/api/v1';

export const ENDPOINTS = {
  AUTH: {
    BASE: `${AUTH_BASE}/auth`,
    REGISTER: `${AUTH_BASE}/auth/register`,
    LOGIN: `${AUTH_BASE}/auth/login`,
    VERIFY_EMAIL: `${AUTH_BASE}/auth/verify-email`,
    RESEND_VERIFICATION: `${AUTH_BASE}/auth/resend-verification`,
    FORGOT_PASSWORD: `${AUTH_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${AUTH_BASE}/auth/reset-password`,
    REFRESH: `${AUTH_BASE}/auth/refresh`,
    PROFILE: `${AUTH_BASE}/auth/profile`,
  },
  USERS: {
    BASE: `${AUTH_BASE}/users`,
    CHANGE_ROLE: (userId) => `${AUTH_BASE}/users/change-role/${userId}`,
  },
  COINS: {
    CREATE: `${BANKING_BASE}/coins/create`,
    LIST: `${BANKING_BASE}/coins/`,
    BY_ID: (id) => `${BANKING_BASE}/coins/${id}`,
    STATUS: (id) => `${BANKING_BASE}/coins/${id}/status`,
  },
  ACCOUNTS: {
    CREATE: `${BANKING_BASE}/accounts/create`,
    LIST: `${BANKING_BASE}/accounts/`,
    BY_ID: (n) => `${BANKING_BASE}/accounts/${n}`,
  },
  WITHDRAWAL: {
    CREATE: `${BANKING_BASE}/withdrawal/`,
    STATEMENT: (n) => `${BANKING_BASE}/withdrawal/statement/${n}`,
  },
  DEPOSITS: {
    CREATE: `${BANKING_BASE}/deposits/create`,
  },
  SERVICES: {
    LIST: `${BANKING_BASE}/service/`,
  },
  ACCOUNT_STATEMENTS: {
    LIST: `${BANKING_BASE}/accountStatements`,
    PDF: (n) => `${BANKING_BASE}/accountStatements/account/${n}/pdf`,
  },
};