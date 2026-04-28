import request from '../utils/request';
import type { ApiResponse, PaginatedData } from '@/types/api';

interface NotificationSenderApi {
  id?: string | number;
  nickname?: string;
  avatarUrl?: string;
}

interface NotificationApiItem {
  id: string | number;
  type?: string;
  title?: string;
  content?: string;
  sender?: NotificationSenderApi | null;
  relatedDiaryId?: string | number;
  relatedCommentId?: string | number;
  isRead?: boolean;
  readTime?: string;
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
  relatedCommentId?: string;
  isRead: boolean;
  readTime?: string;
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
  type?: NotificationType;
}

export interface UnreadCountData {
  unreadCount: number;
}

export interface NotificationReadData {
  id: string;
  isRead: boolean;
  readTime?: string;
}

export interface NotificationReadAllData {
  updatedCount: number;
  readTime?: string;
}

export type NotificationType = 'COMMENT' | 'LIKE' | 'FAVORITE' | 'SYSTEM';

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapNotification = (item: NotificationApiItem): NotificationItem => ({
  id: String(item.id),
  type: item.type,
  title: item.title,
  content: item.content,
  sender: item.sender
    ? {
        id: typeof item.sender.id === 'undefined' ? undefined : String(item.sender.id),
        nickname: item.sender.nickname,
        avatarUrl: item.sender.avatarUrl
      }
    : undefined,
  relatedDiaryId: typeof item.relatedDiaryId === 'undefined' ? undefined : String(item.relatedDiaryId),
  relatedCommentId: typeof item.relatedCommentId === 'undefined' ? undefined : String(item.relatedCommentId),
  isRead: Boolean(item.isRead),
  readTime: item.readTime,
  createdAt: item.createdAt
});

const mapPage = (page?: PaginatedData<NotificationApiItem>): NotificationPage => ({
  list: page?.list?.map(mapNotification) || [],
  pageNum: toNumber(page?.pageNum, 1),
  pageSize: toNumber(page?.pageSize, 0),
  total: toNumber(page?.total, 0),
  pages: toNumber(page?.pages, 0)
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

export function readAllNotifications(params: Pick<NotificationListParams, 'type'> = {}) {
  return request.patch<ApiResponse<NotificationReadAllData>>('/notifications/read-all', null, {
    params: {
      ...(params.type ? { type: params.type } : {})
    }
  });
}
