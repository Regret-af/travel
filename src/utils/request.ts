import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: '/api/v1'
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res: AxiosResponse) => res.data,
  (error: AxiosError) => {
    const { response } = error;
    if (!response) {
      ElMessage.error('网络异常，请稍后重试');
      return Promise.reject(error);
    }

    const status = response.status;

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      ElMessage.error('账号已禁用');
      return Promise.reject(error);
    }

    if (status >= 500) {
      ElMessage.error('服务器错误');
      return Promise.reject(error);
    }

    const message =
      (response.data as { message?: string } | undefined)?.message || '请求失败，请稍后重试';
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default request;
