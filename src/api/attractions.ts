import request from '../utils/request';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse, PaginatedData } from '@/types/api';

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
  coverUrl?: string;
  locationText?: string;
  latitude?: number | string;
  longitude?: number | string;
  viewCount?: number;
  createdAt?: string;
  category?: AttractionCategoryApi | null;
}

interface AttractionDetailApi extends AttractionApiItem {
  description?: string;
  updatedAt?: string;
  baiduUid?: string;
  sourceSyncedAt?: string;
  addressDetail?: string;
  telephone?: string;
  telephoneList?: string[];
  openingHours?: string;
}

interface AttractionWeatherCurrentApi {
  weatherText?: string;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  windDirection?: string;
  windLevel?: string;
  isSuitable?: boolean;
  travelTip?: string;
  iconKey?: string;
}

interface AttractionWeatherForecastApi {
  date?: string;
  weekLabel?: string;
  weatherTextDay?: string;
  weatherTextNight?: string;
  tempMin?: number;
  tempMax?: number;
  isSuitable?: boolean;
  iconKeyDay?: string;
  iconKeyNight?: string;
}

interface AttractionWeatherAlertApi {
  title?: string;
  level?: string;
  description?: string;
}

interface AttractionWeatherApi {
  available: boolean;
  source?: string;
  sourceUpdateTime?: string;
  current?: AttractionWeatherCurrentApi;
  forecast?: AttractionWeatherForecastApi[];
  alerts?: AttractionWeatherAlertApi[];
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
  coverUrl?: string;
  locationText?: string;
  latitude?: number;
  longitude?: number;
  viewCount?: number;
  createdAt?: string;
  category?: AttractionCategory;
}

export interface PageAttractionCard {
  list: AttractionCard[];
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface AttractionDetail extends AttractionCard {
  description?: string;
  updatedAt?: string;
  baiduUid?: string;
  sourceSyncedAt?: string;
  addressDetail?: string;
  telephone?: string;
  telephoneList?: string[];
  openingHours?: string;
}

export interface AttractionWeatherCurrent {
  weatherText?: string;
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  windDirection?: string;
  windLevel?: string;
  isSuitable?: boolean;
  travelTip?: string;
  iconKey?: string;
}

export interface AttractionWeatherForecast {
  date?: string;
  weekLabel?: string;
  weatherTextDay?: string;
  weatherTextNight?: string;
  tempMin?: number;
  tempMax?: number;
  isSuitable?: boolean;
  iconKeyDay?: string;
  iconKeyNight?: string;
}

export interface AttractionWeatherAlert {
  title?: string;
  level?: string;
  description?: string;
}

export interface AttractionWeather {
  available: boolean;
  source?: string;
  sourceUpdateTime?: string;
  current?: AttractionWeatherCurrent;
  forecast: AttractionWeatherForecast[];
  alerts: AttractionWeatherAlert[];
}

export interface AttractionListParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
  sort?: string;
}

type RequestBehaviorOptions = Pick<AxiosRequestConfig, 'skipErrorToast'>;

const toCoordinate = (value?: number | string) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

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
    coverUrl: item.coverUrl,
    locationText: item.locationText,
    latitude: toCoordinate(item.latitude),
    longitude: toCoordinate(item.longitude),
    viewCount: item.viewCount,
    createdAt: item.createdAt,
    category
  };
};

const mapAttractionDetail = (item: AttractionDetailApi): AttractionDetail => ({
  ...mapAttraction(item),
  description: item.description,
  updatedAt: item.updatedAt,
  baiduUid: item.baiduUid,
  sourceSyncedAt: item.sourceSyncedAt,
  addressDetail: item.addressDetail,
  telephone: item.telephone,
  telephoneList: item.telephoneList,
  openingHours: item.openingHours
});

const mapAttractionWeather = (payload?: AttractionWeatherApi | null): AttractionWeather => ({
  available: Boolean(payload?.available),
  source: payload?.source,
  sourceUpdateTime: payload?.sourceUpdateTime,
  current: payload?.current
    ? {
        weatherText: payload.current.weatherText,
        temperature: payload.current.temperature,
        feelsLike: payload.current.feelsLike,
        humidity: payload.current.humidity,
        windDirection: payload.current.windDirection,
        windLevel: payload.current.windLevel,
        isSuitable: payload.current.isSuitable,
        travelTip: payload.current.travelTip,
        iconKey: payload.current.iconKey
      }
    : undefined,
  forecast: (payload?.forecast || []).map((item) => ({
    date: item.date,
    weekLabel: item.weekLabel,
    weatherTextDay: item.weatherTextDay,
    weatherTextNight: item.weatherTextNight,
    tempMin: item.tempMin,
    tempMax: item.tempMax,
    isSuitable: item.isSuitable,
    iconKeyDay: item.iconKeyDay,
    iconKeyNight: item.iconKeyNight
  })),
  alerts: (payload?.alerts || []).map((item) => ({
    title: item.title,
    level: item.level,
    description: item.description
  }))
});

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

const createDetailResponse = (res: ApiResponse<AttractionDetailApi>): ApiResponse<AttractionDetail> => ({
  ...res,
  data: mapAttractionDetail(res.data)
});

export async function getAttractionCategories(options: RequestBehaviorOptions = {}) {
  const res = await request.get<ApiResponse<AttractionCategoryApi[]>>('/attraction-categories', {
    skipErrorToast: options.skipErrorToast
  });

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

export async function getFeaturedAttractions(options: RequestBehaviorOptions = {}) {
  const res = await request.get<ApiResponse<PaginatedData<AttractionApiItem>>>('/attractions', {
    params: { pageNum: 1, pageSize: 3, sort: 'hot' },
    skipErrorToast: options.skipErrorToast
  });

  return createPageResponse(res);
}

export async function searchAttractions(params: AttractionListParams = {}, options: RequestBehaviorOptions = {}) {
  const normalized = normalizeListParams(params);
  const res = await request.get<ApiResponse<PaginatedData<AttractionApiItem>>>('/attractions', {
    params: normalized,
    skipErrorToast: options.skipErrorToast
  });

  return createPageResponse(res);
}

export async function getHotAttractions(limit: number, options: RequestBehaviorOptions = {}) {
  const res = await request.get<ApiResponse<PaginatedData<AttractionApiItem>>>('/attractions', {
    params: { pageNum: 1, pageSize: limit, sort: 'hot' },
    skipErrorToast: options.skipErrorToast
  });

  return createPageResponse(res);
}

export async function getAttractionDetail(id: string | number) {
  const res = await request.get<ApiResponse<AttractionDetailApi>>(`/attractions/${id}`);

  return createDetailResponse(res);
}

export async function getAttractionWeather(id: string | number, options: RequestBehaviorOptions = {}) {
  const res = await request.get<ApiResponse<AttractionWeatherApi>>(`/attractions/${id}/weather`, {
    skipErrorToast: options.skipErrorToast
  });

  return {
    ...res,
    data: mapAttractionWeather(res.data)
  };
}

export async function searchAttractionsByQuery(query: string, options: RequestBehaviorOptions = {}) {
  return searchAttractions({
    keyword: query,
    pageNum: 1,
    pageSize: 5,
    sort: 'hot'
  }, options);
}
