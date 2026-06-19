import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export type UserRole = 'ADMIN' | 'USER';

const STORAGE_KEY = 'bookstore_user';

export const getCurrentUser = (): { userId: number; role: UserRole } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: number; username: string; role: string };
    if (parsed?.id && parsed?.role) {
      const role: UserRole = parsed.role === 'ADMIN' ? 'ADMIN' : 'USER';
      return { userId: parsed.id, role };
    }
  } catch {
    /* ignore */
  }
  return null;
};

export const apiClient = axios.create({
  baseURL
});

apiClient.interceptors.request.use((config) => {
  const user = getCurrentUser();
  if (user) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['X-USER-ID'] = String(user.userId);
    (config.headers as Record<string, string>)['X-ROLE'] = user.role;
  }
  return config;
});

