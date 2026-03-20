import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️  Change this to your server IP when testing on a physical device
// localhost will NOT work on Android — use your machine's local IP
export const API_BASE = 'http://192.168.11.23:3201/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync('auth_token').catch(() => {});
    }
    return Promise.reject(err);
  }
);

export default api;
