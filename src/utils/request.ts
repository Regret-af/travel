import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { useAuthStore } from '@/stores/auth';
import { pinia } from '@/stores';
import { ApiRequestError, type ApiResponse } from '@/types/api';

const request = axios.create({
  baseURL: '/api/v1'
});

const SUCCESS_CODE = 0;
const AUTH_INVALID_CODES = new Set([40100]);
const MESSAGE_DEDUP_WINDOW = 800;

let lastMessage = '';
let lastMessageAt = 0;

const getAuthStore = () => useAuthStore(pinia);

const shouldHandleAuthInvalid = (code?: number, status?: number) =>
  status === 401 || (typeof code === 'number' && AUTH_INVALID_CODES.has(code));

const clearAuthState = () => {
  const authStore = getAuthStore();

  if (!authStore.token && !authStore.user) {
    return;
  }

  authStore.clearAuth();
};

const showErrorMessage = (message: string, config?: AxiosRequestConfig) => {
  if (!message || config?.skipErrorToast) {
    return;
  }

  const now = Date.now();

  if (message === lastMessage && now - lastMessageAt < MESSAGE_DEDUP_WINDOW) {
    return;
  }

  lastMessage = message;
  lastMessageAt = now;
  ElMessage.error(message);
};

const createHandledError = (options: {
  message: string;
  kind: 'business' | 'http' | 'network';
  code?: number;
  status?: number;
  requestId?: string;
  timestamp?: string;
  cause?: unknown;
}) =>
  new ApiRequestError({
    ...options,
    handledByRequest: true
  });

request.interceptors.request.use((config) => {
  const authStore = getAuthStore();
  const token = authStore.token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

request.interceptors.response.use(
  (res: AxiosResponse<ApiResponse<unknown>>) => {
    const payload = res.data;

    if (!payload || typeof payload !== 'object' || !('code' in payload)) {
      return payload;
    }

    if (payload.code === SUCCESS_CODE) {
      return payload;
    }

    const message = payload.message || '请求失败，请稍后重试';

    const normalizedStatus = shouldHandleAuthInvalid(payload.code, res.status) ? 401 : res.status;

    if (normalizedStatus === 401) {
      clearAuthState();
    }

    showErrorMessage(message, res.config);

    return Promise.reject(
      createHandledError({
        message,
        kind: 'business',
        code: payload.code,
        status: normalizedStatus,
        requestId: payload.requestId,
        timestamp: payload.timestamp
      })
    );
  },
  (error: AxiosError) => {
    const { response } = error;
    const config = error.config;

    if (!response) {
      const message = '网络异常，请检查网络后重试';
      showErrorMessage(message, config);

      return Promise.reject(
        createHandledError({
          message,
          kind: 'network',
          cause: error
        })
      );
    }

    const status = response.status;
    const payload = (response.data || {}) as Partial<ApiResponse<unknown>>;
    const backendMessage = typeof payload.message === 'string' ? payload.message : '';
    const requestId = typeof payload.requestId === 'string' ? payload.requestId : undefined;
    const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : undefined;
    const businessCode = typeof payload.code === 'number' ? payload.code : undefined;

    let message = backendMessage || '请求失败，请稍后重试';

    if (status === 401) {
      clearAuthState();
      message = backendMessage || '登录状态已失效，请重新登录';
    } else if (status === 403) {
      message = backendMessage || '暂无权限执行该操作';
    } else if (status >= 500) {
      message = backendMessage || '服务器开小差了，请稍后重试';
    }

    showErrorMessage(message, config);

    return Promise.reject(
      createHandledError({
        message,
        kind: 'http',
        code: businessCode,
        status,
        requestId,
        timestamp,
        cause: error
      })
    );
  }
);

export default request;
