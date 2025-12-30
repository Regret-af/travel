import axios, { type AxiosRequestConfig } from 'axios'
import router from '../router'
import { useAuthStore } from '../store/auth'
import { useMockRequest } from './mock/mockRequest'
import type { Result } from '../types/api'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 8000,
})

instance.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      const auth = useAuthStore()
      auth.clear()
      router.push('/auth/login')
    }
    return Promise.reject(error)
  },
)

export async function request<T>(config: AxiosRequestConfig): Promise<Result<T>> {
  if (useMock) {
    return useMockRequest<T>(config)
  }

  const res = await instance.request<Result<T>>(config)
  return res.data
}
