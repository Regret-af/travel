import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
  timestamp?: string;
}

export interface UserMe {
  id: string;
  email?: string;
  username?: string;
  nickname?: string;
  avatarUrl?: string;
  status?: number;
  roles?: string[];
  createdAt?: string;
}

export function getMe() {
  return request.get<ApiResponse<UserMe>>('/users/me');
}
