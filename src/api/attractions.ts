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
  description?: string;
  rating?: number;
  tags?: string[];
  viewCount?: number;
  priceLevel?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}

export interface PageAttractionCard {
  list: AttractionCard[];
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

export function getTopRatedAttractions(limit: number) {
  return request.get<ApiResponse<PageAttractionCard>>('/attractions', {
    params: { page: 1, size: limit, sort: '-rating' }
  });
}

export function getAttractionDetail(id: number) {
  return request.get<ApiResponse<AttractionCard>>(`/attractions/${id}`);
}

export function searchAttractionsByQuery(query: string) {
  return request.get<ApiResponse<PageAttractionCard>>('/attractions', {
    params: { q: query, page: 1, size: 5 }
  });
}
