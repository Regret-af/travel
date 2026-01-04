import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface User { 
    id: number;
    username: string;
    avatarUrl?: string;
    bio?: string;
}

export interface DiaryCard {
  id: number;
  title: string;
  user?: User;
  summary?: string;
  coverImage?: string;
  isFeatured?: number;
  likeCount?: number;
  viewCount?: number;
  createdAt?: string;
}

export interface PageDiaryCard {
  list: DiaryCard[];
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
}

export function getDiaryFeed() {
  return request.get<ApiResponse<PageDiaryCard>>('/diaries', {
    params: { page: 1, size: 3, featured: 1, sort: '-createdAt' }
  });
}