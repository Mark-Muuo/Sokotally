import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Optional: attach token if present (storage/auth.js helper exists)
export function setAuthToken(getTokenFn) {
  api.interceptors.request.use((config) => {
    try {
      const token = getTokenFn ? getTokenFn() : undefined;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    return config;
  });
}


