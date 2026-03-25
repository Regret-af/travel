import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
  timestamp?: string;
}

interface AttractionCategoryApi {
  id: string;
  name: string;
  code: string;
  sortOrder?: number;
}

interface AttractionApiItem {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  coverUrl?: string;
  locationText?: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  category?: AttractionCategoryApi | null;
}

interface PaginatedData<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
  list: T[];
}

export interface AttractionCategory {
  id: string;
  name: string;
  code: string;
  sortOrder?: number;
}

export interface AttractionCard {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  coverUrl?: string;
  locationText?: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  category?: AttractionCategory;
  imageUrl?: string;
  location?: string;
}

export interface PageAttractionCard {
  list: AttractionCard[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface AttractionListParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
  sort?: string;
}

const mapCategory = (category?: AttractionCategoryApi | null): AttractionCategory | undefined => {
  if (!category) return undefined;

  return {
    id: category.id,
    name: category.name,
    code: category.code,
    sortOrder: category.sortOrder
  };
};

const mapAttraction = (item: AttractionApiItem): AttractionCard => {
  const category = mapCategory(item.category);

  return {
    id: item.id,
    name: item.name,
    summary: item.summary,
    description: item.description,
    coverUrl: item.coverUrl,
    locationText: item.locationText,
    viewCount: item.viewCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    category,
    imageUrl: item.coverUrl,
    location: item.locationText
  };
};

const mapPage = (page?: PaginatedData<AttractionApiItem>): PageAttractionCard => ({
  list: page?.list?.map(mapAttraction) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

const normalizeListParams = (params: AttractionListParams = {}) => ({
  pageNum: Number(params.pageNum ?? 1),
  pageSize: Number(params.pageSize ?? 10),
  keyword: typeof params.keyword === 'string' ? params.keyword.trim() : undefined,
  categoryId: typeof params.categoryId === 'string' ? params.categoryId : undefined,
  sort: typeof params.sort === 'string' ? params.sort : undefined
});

const createPageResponse = (
  res: ApiResponse<PaginatedData<AttractionApiItem>>
): ApiResponse<PageAttractionCard> => ({
  ...res,
  data: mapPage(res.data)
});

const createDetailResponse = (res: ApiResponse<AttractionApiItem>): ApiResponse<AttractionCard> => ({
  ...res,
  data: mapAttraction(res.data)
});

export async function getAttractionCategories() {
  const res = await request.get<ApiResponse<AttractionCategoryApi[]>>('/attraction-categories');

  return {
    ...res,
    data: (res.data || []).map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      sortOrder: item.sortOrder
    }))
  };
}

export async function getFeaturedAttractions() {
  const res = await request.get<ApiResponse<PaginatedData<AttractionApiItem>>>('/attractions', {
    params: { pageNum: 1, pageSize: 3, sort: 'hot' }
  });

  return createPageResponse(res);
}

export async function searchAttractions(params: AttractionListParams = {}) {
  const normalized = normalizeListParams(params);
  const res = await request.get<ApiResponse<PaginatedData<AttractionApiItem>>>('/attractions', {
    params: normalized
  });

  return createPageResponse(res);
}

export async function getTopRatedAttractions(limit: number) {
  const res = await request.get<ApiResponse<PaginatedData<AttractionApiItem>>>('/attractions', {
    params: { pageNum: 1, pageSize: limit, sort: 'hot' }
  });

  return createPageResponse(res);
}

export async function getAttractionDetail(id: string | number) {
  const res = await request.get<ApiResponse<AttractionApiItem>>(`/attractions/${id}`);

  return createDetailResponse(res);
}

export async function searchAttractionsByQuery(query: string) {
  return searchAttractions({
    keyword: query,
    pageNum: 1,
    pageSize: 5,
    sort: 'hot'
  });
}
