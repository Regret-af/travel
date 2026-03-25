import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface AuthUser {
  id?: string;
  username?: string;
  nickname?: string;
  email?: string;
  avatarUrl?: string;
  status?: number;
  roles?: string[];
  createdAt?: string;
}

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export function login(payload: LoginRequest) {
  return request.post<ApiResponse<LoginResponse>>('/auth/login', payload);
}

export function register(payload: RegisterRequest) {
  return request.post<ApiResponse<{ userId: number }>>('/auth/register', payload);
}
