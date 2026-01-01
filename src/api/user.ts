import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserMe {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  status?: number;
  createdAt?: string;
}

export interface UpdateMeRequest {
  avatarUrl?: string;
  bio?: string;
}

export function getMe() {
  return request.get<ApiResponse<UserMe>>('/users/me');
}

export function updateMe(payload: UpdateMeRequest) {
  return request.put<ApiResponse<boolean>>('/users/me', payload);
}
