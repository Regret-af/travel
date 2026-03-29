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

export interface UpdateUserProfilePayload {
  nickname: string;
  avatarUrl: string;
}

export interface UpdateUserProfileResult {
  id: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function updateMyProfile(payload: UpdateUserProfilePayload) {
  return request.put<ApiResponse<UpdateUserProfileResult>>('/users/me/profile', payload);
}

export function updateMyPassword(payload: UpdatePasswordPayload) {
  return request.put<ApiResponse<boolean>>('/users/me/password', payload);
}
