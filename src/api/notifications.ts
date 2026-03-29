import request from '../utils/request';
import type { ApiResponse, PaginatedData } from '@/types/api';

interface NotificationSenderApi {
  id?: string;
  nickname?: string;
  avatarUrl?: string;
}

interface NotificationApiItem {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  sender?: NotificationSenderApi | null;
  relatedDiaryId?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  sender?: {
    id?: string;
    nickname?: string;
    avatarUrl?: string;
  };
  relatedDiaryId?: string;
  isRead: boolean;
  createdAt?: string;
}

export interface NotificationPage {
  list: NotificationItem[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface NotificationListParams {
  pageNum?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: string;
}

export interface UnreadCountData {
  unreadCount: number;
}

export interface NotificationReadData {
  id: string;
  isRead: boolean;
  readTime?: string;
}

const mapNotification = (item: NotificationApiItem): NotificationItem => ({
  id: item.id,
  type: item.type,
  title: item.title,
  content: item.content,
  sender: item.sender
    ? {
        id: item.sender.id,
        nickname: item.sender.nickname,
        avatarUrl: item.sender.avatarUrl
      }
    : undefined,
  relatedDiaryId: item.relatedDiaryId,
  isRead: Boolean(item.isRead),
  createdAt: item.createdAt
});

const mapPage = (page?: PaginatedData<NotificationApiItem>): NotificationPage => ({
  list: page?.list?.map(mapNotification) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

const normalizeParams = (params: NotificationListParams = {}) => ({
  pageNum: Number(params.pageNum ?? 1),
  pageSize: Number(params.pageSize ?? 5),
  ...(typeof params.isRead === 'boolean' ? { isRead: params.isRead } : {}),
  ...(params.type ? { type: params.type } : {})
});

export async function getNotifications(params: NotificationListParams = {}) {
  const res = await request.get<ApiResponse<PaginatedData<NotificationApiItem>>>('/notifications', {
    params: normalizeParams(params)
  });

  return {
    ...res,
    data: mapPage(res.data)
  };
}

export function getNotificationUnreadCount() {
  return request.get<ApiResponse<UnreadCountData>>('/notifications/unread-count');
}

export function readNotification(notificationId: string) {
  return request.patch<ApiResponse<NotificationReadData>>(`/notifications/${notificationId}/read`);
}
