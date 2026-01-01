import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface AttractionCard {
  id: number;
  name: string;
  location?: string;
  imageUrl?: string;
  rating?: number;
  tags?: string[];
  viewCount?: number;
  priceLevel?: number;
  createdAt?: string;
}

export interface PageAttractionCard {
  list: AttractionCard[];
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
}

export interface DiaryCard {
  id: number;
  title: string;
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

export function getFeaturedAttractions() {
  return request.get<ApiResponse<PageAttractionCard>>('/attractions', {
    params: { page: 1, size: 3, sort: '-rating' }
  });
}

export function searchAttractions(params: Record<string, unknown>) {
  return request.get<ApiResponse<PageAttractionCard>>('/attractions', { params });
}

export function getDiaryFeed() {
  return request.get<ApiResponse<PageDiaryCard>>('/diaries', {
    params: { page: 1, size: 3, featured: 1, sort: '-createdAt' }
  });
}
