import request from '../utils/request';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse, PaginatedData } from '@/types/api';

interface DiaryAuthorApi {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
}

interface DiaryApiItem {
  id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  author?: DiaryAuthorApi | null;
  contentType?: string;
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  liked?: boolean;
  favorited?: boolean;
  publishedAt?: string;
}

interface UserDiaryApiItem extends DiaryApiItem {
  status?: number;
}

interface FavoriteDiaryApiItem extends DiaryApiItem {
  invalid?: boolean;
}

interface DiaryDetailApiItem extends DiaryApiItem {
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DiaryCommentApiAuthor {
  id?: string;
  nickname?: string;
  avatarUrl?: string;
}

interface DiaryCommentApiItem {
  id: string;
  diaryId?: string;
  content: string;
  author?: DiaryCommentApiAuthor | null;
  createdAt?: string;
}

export interface DiaryAuthor {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface DiaryCard {
  id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  author?: DiaryAuthor;
  contentType?: string;
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  liked?: boolean;
  favorited?: boolean;
  publishedAt?: string;
}

export interface PageDiaryCard {
  list: DiaryCard[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface DiaryDetail extends DiaryCard {
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDiaryCard extends DiaryCard {
  status?: number;
}

export interface FavoriteDiaryCard extends DiaryCard {
  invalid?: boolean;
}

export interface PageUserDiaryCard {
  list: UserDiaryCard[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface PageFavoriteDiaryCard {
  list: FavoriteDiaryCard[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface DiaryComment {
  id: string;
  diaryId?: string;
  content: string;
  author?: {
    id?: string;
    nickname?: string;
    avatarUrl?: string;
  };
  createdAt?: string;
}

export interface PageDiaryComment {
  list: DiaryComment[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface DiaryListParams {
  pageNum?: number;
  pageSize?: number;
  sort?: 'latest' | 'hot';
}

export interface FavoriteDiaryListParams {
  pageNum?: number;
  pageSize?: number;
}

export interface DiaryCommentListParams {
  pageNum?: number;
  pageSize?: number;
}

export interface CreateTravelDiaryPayload {
  title: string;
  summary?: string;
  coverUrl?: string;
  content: string;
}

export interface CreateDiaryCommentPayload {
  content: string;
}

export interface DiaryLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface DiaryFavoriteResponse {
  favorited: boolean;
  favoriteCount: number;
}

type RequestBehaviorOptions = Pick<AxiosRequestConfig, 'skipErrorToast'>;

const mapDiary = (item: DiaryApiItem): DiaryCard => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  coverUrl: item.coverUrl,
  author: item.author
    ? {
        id: item.author.id,
        nickname: item.author.nickname,
        avatarUrl: item.author.avatarUrl,
        bio: item.author.bio
      }
    : undefined,
  contentType: item.contentType,
  viewCount: item.viewCount,
  likeCount: item.likeCount,
  favoriteCount: item.favoriteCount,
  commentCount: item.commentCount,
  liked: item.liked,
  favorited: item.favorited,
  publishedAt: item.publishedAt
});

const mapUserDiary = (item: UserDiaryApiItem): UserDiaryCard => ({
  ...mapDiary(item),
  status: item.status
});

const mapFavoriteDiary = (item: FavoriteDiaryApiItem): FavoriteDiaryCard => ({
  ...mapDiary(item),
  invalid: Boolean(item.invalid)
});

const mapPage = (page?: PaginatedData<DiaryApiItem>): PageDiaryCard => ({
  list: page?.list?.map(mapDiary) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

const mapUserDiaryPage = (page?: PaginatedData<UserDiaryApiItem>): PageUserDiaryCard => ({
  list: page?.list?.map(mapUserDiary) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

const mapFavoriteDiaryPage = (
  page?: PaginatedData<FavoriteDiaryApiItem>
): PageFavoriteDiaryCard => ({
  list: page?.list?.map(mapFavoriteDiary) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

const mapDiaryDetail = (item?: DiaryDetailApiItem | null): DiaryDetail => ({
  id: item?.id || '',
  title: item?.title || '',
  summary: item?.summary,
  coverUrl: item?.coverUrl,
  content: item?.content,
  contentType: item?.contentType,
  author: item?.author
    ? {
        id: item.author.id,
        nickname: item.author.nickname,
        avatarUrl: item.author.avatarUrl,
        bio: item.author.bio
      }
    : undefined,
  viewCount: item?.viewCount,
  likeCount: item?.likeCount,
  favoriteCount: item?.favoriteCount,
  commentCount: item?.commentCount,
  liked: item?.liked,
  favorited: item?.favorited,
  publishedAt: item?.publishedAt,
  createdAt: item?.createdAt,
  updatedAt: item?.updatedAt
});

const mapDiaryComment = (item: DiaryCommentApiItem): DiaryComment => ({
  id: item.id,
  diaryId: item.diaryId,
  content: item.content,
  author: item.author
    ? {
        id: item.author.id,
        nickname: item.author.nickname,
        avatarUrl: item.author.avatarUrl
      }
    : undefined,
  createdAt: item.createdAt
});

const mapCommentPage = (page?: PaginatedData<DiaryCommentApiItem>): PageDiaryComment => ({
  list: page?.list?.map(mapDiaryComment) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

const normalizeListParams = (params: DiaryListParams = {}) => ({
  pageNum: Number(params.pageNum ?? 1),
  pageSize: Number(params.pageSize ?? 10),
  sort: params.sort === 'hot' ? 'hot' : 'latest'
});

const normalizeCommentListParams = (params: DiaryCommentListParams = {}) => ({
  pageNum: Number(params.pageNum ?? 1),
  pageSize: Number(params.pageSize ?? 10)
});

const normalizeFavoriteListParams = (params: FavoriteDiaryListParams = {}) => ({
  pageNum: Number(params.pageNum ?? 1),
  pageSize: Number(params.pageSize ?? 10)
});

const createPageResponse = (res: ApiResponse<PaginatedData<DiaryApiItem>>): ApiResponse<PageDiaryCard> => ({
  ...res,
  data: mapPage(res.data)
});

const createDetailResponse = (res: ApiResponse<DiaryDetailApiItem>): ApiResponse<DiaryDetail> => ({
  ...res,
  data: mapDiaryDetail(res.data)
});

const createUserDiaryPageResponse = (
  res: ApiResponse<PaginatedData<UserDiaryApiItem>>
): ApiResponse<PageUserDiaryCard> => ({
  ...res,
  data: mapUserDiaryPage(res.data)
});

const createFavoriteDiaryPageResponse = (
  res: ApiResponse<PaginatedData<FavoriteDiaryApiItem>>
): ApiResponse<PageFavoriteDiaryCard> => ({
  ...res,
  data: mapFavoriteDiaryPage(res.data)
});

const createCommentPageResponse = (
  res: ApiResponse<PaginatedData<DiaryCommentApiItem>>
): ApiResponse<PageDiaryComment> => ({
  ...res,
  data: mapCommentPage(res.data)
});

const createCommentResponse = (res: ApiResponse<DiaryCommentApiItem>): ApiResponse<DiaryComment> => ({
  ...res,
  data: mapDiaryComment(res.data)
});

export async function getDiaryFeed(options: RequestBehaviorOptions = {}) {
  const res = await request.get<ApiResponse<PaginatedData<DiaryApiItem>>>('/travel-diaries', {
    params: { pageNum: 1, pageSize: 3, sort: 'latest' },
    skipErrorToast: options.skipErrorToast
  });

  return createPageResponse(res);
}

export async function getTravelDiaryList(params: DiaryListParams = {}) {
  const res = await request.get<ApiResponse<PaginatedData<DiaryApiItem>>>('/travel-diaries', {
    params: normalizeListParams(params)
  });

  return createPageResponse(res);
}

export async function getUserTravelDiaries(
  userId: string,
  params: DiaryListParams = {},
  options: RequestBehaviorOptions = {}
) {
  const res = await request.get<ApiResponse<PaginatedData<DiaryApiItem>>>(`/users/${userId}/travel-diaries`, {
    params: normalizeListParams(params),
    skipErrorToast: options.skipErrorToast
  });

  return createPageResponse(res);
}

export async function createTravelDiary(payload: CreateTravelDiaryPayload) {
  const res = await request.post<ApiResponse<DiaryDetailApiItem>>('/travel-diaries', payload);

  return createDetailResponse(res);
}

export async function getTravelDiaryDetail(diaryId: string, options: RequestBehaviorOptions = {}) {
  const res = await request.get<ApiResponse<DiaryDetailApiItem>>(`/travel-diaries/${diaryId}`, {
    skipErrorToast: options.skipErrorToast
  });

  return createDetailResponse(res);
}

export async function getTravelDiaryComments(diaryId: string, params: DiaryCommentListParams = {}) {
  const res = await request.get<ApiResponse<PaginatedData<DiaryCommentApiItem>>>(
    `/travel-diaries/${diaryId}/comments`,
    {
      params: normalizeCommentListParams(params)
    }
  );

  return createCommentPageResponse(res);
}

export async function createTravelDiaryComment(diaryId: string, payload: CreateDiaryCommentPayload) {
  const res = await request.post<ApiResponse<DiaryCommentApiItem>>(`/travel-diaries/${diaryId}/comments`, payload);

  return createCommentResponse(res);
}

export async function getMyTravelDiaries(params: DiaryListParams = {}) {
  const res = await request.get<ApiResponse<PaginatedData<UserDiaryApiItem>>>('/users/me/travel-diaries', {
    params: normalizeListParams(params)
  });

  return createUserDiaryPageResponse(res);
}

export async function getMyFavoriteDiaries(params: FavoriteDiaryListParams = {}) {
  const res = await request.get<ApiResponse<PaginatedData<FavoriteDiaryApiItem>>>(
    '/users/me/favorite-diaries',
    {
      params: normalizeFavoriteListParams(params)
    }
  );

  return createFavoriteDiaryPageResponse(res);
}

export async function likeTravelDiary(diaryId: string) {
  return request.post<ApiResponse<DiaryLikeResponse>>(`/travel-diaries/${diaryId}/likes`);
}

export async function unlikeTravelDiary(diaryId: string) {
  return request.delete<ApiResponse<DiaryLikeResponse>>(`/travel-diaries/${diaryId}/likes`);
}

export async function favoriteTravelDiary(diaryId: string) {
  return request.post<ApiResponse<DiaryFavoriteResponse>>(`/travel-diaries/${diaryId}/favorites`);
}

export async function unfavoriteTravelDiary(diaryId: string) {
  return request.delete<ApiResponse<DiaryFavoriteResponse>>(`/travel-diaries/${diaryId}/favorites`);
}
