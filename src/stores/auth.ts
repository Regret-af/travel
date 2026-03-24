import { defineStore } from 'pinia';
import type { AuthUser } from '@/api/auth';
import type { LoginRequest, LoginResponse } from '@/api/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const loadUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: loadUser() as AuthUser | null
  }),
  actions: {
    setAuth(token: string, user: AuthUser | null) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    },
    async login(payload: LoginRequest) {
      const { login } = await import('@/api/auth');
      const res = await login(payload);
      const data = (res?.data || {}) as LoginResponse;
      const token = data.accessToken || data.token || '';

      if (!token) {
        throw new Error('登录响应缺少 token');
      }

      this.setAuth(token, data.user || null);
      return data;
    },
    async fetchMe() {
      if (!this.token) {
        this.clearAuth();
        return null;
      }

      try {
        const { getMe } = await import('@/api/user');
        const res = await getMe();
        const user = res?.data || null;

        if (!user) {
          this.clearAuth();
          return null;
        }

        this.setAuth(this.token, user);
        return user;
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },
    clearAuth() {
      this.token = '';
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    logout() {
      this.clearAuth();
    }
  }
});
