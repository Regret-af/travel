import request from '../utils/request';
import type { ApiResponse } from '@/types/api';

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
