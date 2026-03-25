import request from '../utils/request';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
  timestamp?: string;
}

interface DiaryAuthorApi {
  id: string;
  nickname?: string;
  avatarUrl?: string;
}

interface DiaryApiItem {
  id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  author?: DiaryAuthorApi | null;
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  liked?: boolean;
  favorited?: boolean;
  publishedAt?: string;
}

interface PaginatedData<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
  list: T[];
}

export interface DiaryAuthor {
  id: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface DiaryCard {
  id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  author?: DiaryAuthor;
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

const mapDiary = (item: DiaryApiItem): DiaryCard => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  coverUrl: item.coverUrl,
  author: item.author
    ? {
        id: item.author.id,
        nickname: item.author.nickname,
        avatarUrl: item.author.avatarUrl
      }
    : undefined,
  viewCount: item.viewCount,
  likeCount: item.likeCount,
  favoriteCount: item.favoriteCount,
  commentCount: item.commentCount,
  liked: item.liked,
  favorited: item.favorited,
  publishedAt: item.publishedAt
});

const mapPage = (page?: PaginatedData<DiaryApiItem>): PageDiaryCard => ({
  list: page?.list?.map(mapDiary) || [],
  pageNum: page?.pageNum ?? 1,
  pageSize: page?.pageSize ?? 0,
  total: page?.total ?? 0,
  pages: page?.pages ?? 0
});

export async function getDiaryFeed() {
  const res = await request.get<ApiResponse<PaginatedData<DiaryApiItem>>>('/travel-diaries', {
    params: { pageNum: 1, pageSize: 3, sort: 'latest' }
  });

  return {
    ...res,
    data: mapPage(res.data)
  };
}
