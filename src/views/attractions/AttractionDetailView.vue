<template>
  <div class="attraction-detail-page">
    <template v-if="pageStatus === 'success' && detail">
      <section class="hero-stage">
        <div class="hero-media" :style="heroBackgroundStyle" />
        <div class="hero-overlay" />

        <div class="hero-shell">
          <div class="hero-topbar">
            <button class="hero-back" type="button" @click="goBackToList">
              <span class="material-symbols-outlined">arrow_back</span>
              返回景点列表
            </button>

            <div class="hero-topbar-meta">
              <span v-if="detail.category?.name" class="hero-pill hero-pill-solid">
                {{ detail.category.name }}
              </span>
              <span v-if="weatherUpdatedText" class="hero-pill">
                天气更新 {{ weatherUpdatedText }}
              </span>
            </div>
          </div>

          <div class="hero-content">
            <div class="hero-copy">
              <div class="hero-location-row">
                <span class="material-symbols-outlined">location_on</span>
                <span>{{ heroLocation }}</span>
              </div>
              <h1 class="headline-text">{{ detail.name }}</h1>
            </div>
          </div>
        </div>
      </section>

      <section class="tag-strip">
        <article v-if="detail.category?.name" class="tag-card">
          <span class="material-symbols-outlined tag-icon">park</span>
          <span>{{ detail.category.name }}</span>
        </article>

        <article v-if="detail.locationText" class="tag-card">
          <span class="material-symbols-outlined tag-icon">pin_drop</span>
          <span>{{ detail.locationText }}</span>
        </article>

        <article v-if="viewCountText" class="tag-card">
          <span class="material-symbols-outlined tag-icon">visibility</span>
          <span>{{ viewCountText }}</span>
        </article>
      </section>

      <section
        ref="contentAnchorRef"
        class="content-grid"
        :class="{ 'content-grid-single': !showWeatherSection }"
      >
        <div v-if="showWeatherSection" class="weather-column">
          <div class="weather-grid">
            <article class="weather-card weather-card-current">
              <div class="weather-glow" />
              <div class="weather-current-head">
                <div>
                  <p class="panel-label">当前天气</p>
                  <h2 class="headline-text weather-temp">
                    {{ currentTemperatureText }}
                  </h2>
                  <p class="weather-subline">{{ currentWeatherDescription }}</p>
                </div>
                <span class="material-symbols-outlined weather-main-icon">
                  {{ currentWeatherIcon }}
                </span>
              </div>

              <div class="weather-current-meta">
                <div v-if="humidityText" class="weather-meta-item">
                  <span class="material-symbols-outlined">water_drop</span>
                  <span>{{ humidityText }}</span>
                </div>
                <div v-if="windText" class="weather-meta-item">
                  <span class="material-symbols-outlined">air</span>
                  <span>{{ windText }}</span>
                </div>
              </div>
            </article>

            <div class="weather-sidecards">
              <article class="weather-tip-card" :class="weatherSuitabilityClass">
                <span class="material-symbols-outlined">
                  {{ weatherTipIcon }}
                </span>
                <div>
                  <h3>{{ weatherTipTitle }}</h3>
                  <p>{{ weatherTipText }}</p>
                </div>
              </article>

              <article
                v-if="primaryAlert"
                class="weather-alert-card"
                :class="alertLevelClass(primaryAlert.level)"
              >
                <span class="material-symbols-outlined">warning</span>
                <div>
                  <h3>{{ primaryAlert.title || '天气预警' }}</h3>
                  <p>{{ primaryAlert.description || '请合理安排出行。' }}</p>
                </div>
              </article>

              <article v-else class="weather-alert-card weather-alert-card-muted">
                <span class="material-symbols-outlined">verified</span>
                <div>
                  <h3>当前无天气预警</h3>
                  <p>暂未发现会明显影响出行的天气预警信息。</p>
                </div>
              </article>
            </div>
          </div>

          <article class="forecast-card">
            <div class="forecast-head">
              <h3 class="headline-text">3 日天气预报</h3>
              <span v-if="weatherSourceLabel" class="forecast-source">
                数据源 {{ weatherSourceLabel }}
              </span>
            </div>

            <div class="forecast-grid">
              <div
                v-for="item in forecastItems"
                :key="item.date || item.weekLabel || item.weatherTextDay"
                class="forecast-item"
              >
                <span class="forecast-day">{{ item.weekLabel || '--' }}</span>
                <span class="material-symbols-outlined forecast-icon">
                  {{ resolveWeatherIcon(item.weatherTextDay, item.iconKeyDay) }}
                </span>
                <strong class="forecast-temp">
                  {{ formatForecastTemp(item.tempMin, item.tempMax) }}
                </strong>
                <span class="forecast-weather">
                  {{ item.weatherTextDay || '天气待更新' }}
                </span>
                <span
                  class="forecast-status"
                  :class="item.isSuitable ? 'forecast-status-ok' : 'forecast-status-risk'"
                >
                  {{ item.isSuitable ? '适合游玩' : '谨慎安排' }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <div class="practical-column">
          <article v-if="mapQuery" class="map-card">
            <div class="map-frame-shell">
              <div ref="mapContainerRef" class="map-frame" />

              <div v-if="mapStatus !== 'ready'" class="map-status">
                {{ mapStatusText }}
              </div>
            </div>

            <div class="map-actions">
              <button
                v-if="mapStatus === 'ready'"
                type="button"
                class="map-action"
                @click="recenterMap"
              >
                回到景点位置
              </button>
              <a
                v-if="baiduMapUrl"
                class="map-action map-action-primary"
                :href="baiduMapUrl"
                target="_blank"
                rel="noreferrer"
              >
                在百度地图中查看
              </a>
            </div>
          </article>

          <article class="info-card">
            <div class="info-head">
              <span class="material-symbols-outlined">info</span>
              <h3 class="headline-text">快速查看实用信息</h3>
            </div>

            <div class="info-list">
              <div
                v-for="fact in practicalFacts"
                :key="fact.label"
                class="info-item"
              >
                <span class="info-label">{{ fact.label }}</span>
                <template v-if="fact.type === 'phone' && telephoneItems.length">
                  <div class="info-phone-list">
                    <a
                      v-for="phone in telephoneItems"
                      :key="phone"
                      class="info-phone"
                      :href="`tel:${phone.replace(/\s+/g, '')}`"
                    >
                      {{ phone }}
                    </a>
                  </div>
                </template>
                <p v-else class="info-value">{{ fact.value }}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="story-section">
        <div class="story-grid">
          <div class="story-side">
            <div class="story-side-inner">
              <span class="story-label">The Core Story</span>
              <h2 class="headline-text">以阅读的方式，重新理解该景点</h2>
              <div class="story-divider" />
              <p class="story-summary">{{ introSummary }}</p>
            </div>
          </div>

          <div class="story-content">
            <div class="story-lead-card">
              <p class="story-lead-title">景点导读</p>
              <p class="story-lead-copy">
                {{ introSummary }}
              </p>
            </div>

            <DiaryRichContent
              v-if="detail.description?.trim()"
              :content="detail.description"
            />

            <div v-else class="story-empty">
              <h3 class="headline-text">正文还在补充中</h3>
              <p>
                目前已经可以查看景点主图、天气、地图与实用信息。后续切换为富文本后，这里也能直接承载正文图片与更丰富的内容结构。
              </p>
            </div>
          </div>
        </div>
      </section>
    </template>

    <section v-else-if="pageStatus === 'loading'" class="loading-shell">
      <div class="loading-hero" />

      <div class="loading-grid">
        <div class="loading-card loading-card-wide" />
        <div class="loading-card" />
      </div>

      <div class="loading-grid loading-grid-columns">
        <div class="loading-card loading-card-tall" />
        <div class="loading-card loading-card-tall" />
      </div>
    </section>

    <section v-else class="state-shell">
      <div class="state-card">
        <div class="state-mark" :class="{ 'state-mark-error': pageStatus === 'error' }" />
        <p class="state-label">{{ pageStatus === 'error' ? '暂时无法打开' : '内容暂未找到' }}</p>
        <h2 class="headline-text">{{ stateTitle }}</h2>
        <p class="state-description">{{ stateDescription }}</p>

        <div class="state-actions">
          <el-button v-if="pageStatus === 'error'" type="primary" round @click="reloadDetail">
            重新加载
          </el-button>
          <el-button round @click="goBackToList">
            返回景点列表
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DiaryRichContent from '@/components/diaries/DiaryRichContent.vue';
import {
  getAttractionDetail,
  getAttractionWeather,
  type AttractionDetail,
  type AttractionWeather,
  type AttractionWeatherAlert,
  type AttractionWeatherForecast
} from '@/api/attractions';
import { loadBaiduMapSdk, type BaiduMapMap, type BaiduMapNamespace } from '@/utils/baiduMap';
import { formatCountStat, formatDate, formatDateTime } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();

const detail = ref<AttractionDetail | null>(null);
const weather = ref<AttractionWeather | null>(null);
const pageStatus = ref<'loading' | 'success' | 'empty' | 'error'>('loading');
const weatherStatus = ref<'idle' | 'loading' | 'success' | 'hidden' | 'error'>('idle');
const errorMessage = ref('');
const contentAnchorRef = ref<HTMLElement | null>(null);
const mapContainerRef = ref<HTMLElement | null>(null);
const mapStatus = ref<'idle' | 'loading' | 'ready' | 'missing-ak' | 'error'>('idle');
const baiduMapAk = import.meta.env.VITE_BAIDU_MAP_AK?.trim() || '';
let fetchSequence = 0;
let mapInstance: BaiduMapMap | null = null;
let mapSdk: BaiduMapNamespace | null = null;
let mapControlsInitialized = false;
const markerIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#005bad" flood-opacity="0.28"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <circle cx="28" cy="28" r="22" fill="#005bad"/>
    <path
      d="M28 15.5c-5.24 0-9.5 4.26-9.5 9.5 0 7.13 9.5 17.67 9.5 17.67S37.5 32.13 37.5 25c0-5.24-4.26-9.5-9.5-9.5zm0 12.83A3.33 3.33 0 1 1 28 21.67a3.33 3.33 0 0 1 0 6.66z"
      fill="#ffffff"
    />
  </g>
</svg>
`)}`;

const weatherIconPreset = new Map<string, string>([
  ['sunny', 'sunny'],
  ['clear-day', 'sunny'],
  ['clear-night', 'clear_night'],
  ['partly-cloudy-day', 'partly_cloudy_day'],
  ['partly-cloudy-night', 'partly_cloudy_night'],
  ['cloudy', 'cloud'],
  ['overcast', 'cloud'],
  ['foggy', 'foggy'],
  ['light-rain', 'rainy'],
  ['moderate-rain', 'rainy'],
  ['heavy-rain', 'rainy'],
  ['snow', 'weather_snowy'],
  ['thunderstorm', 'thunderstorm']
]);

const heroBackgroundStyle = computed(() => ({
  backgroundImage: detail.value?.coverUrl
    ? `linear-gradient(180deg, rgba(12, 17, 24, 0.08) 0%, rgba(12, 17, 24, 0.22) 42%, rgba(12, 17, 24, 0.62) 100%), url(${detail.value.coverUrl})`
    : 'radial-gradient(circle at 16% 18%, rgba(94, 162, 255, 0.28), transparent 22%), radial-gradient(circle at 82% 14%, rgba(255, 202, 77, 0.26), transparent 18%), linear-gradient(135deg, #eef4fb 0%, #f7f9fb 58%, #eef2f6 100%)'
}));
const heroLocation = computed(
  () => detail.value?.locationText?.trim() || detail.value?.addressDetail?.trim() || '景点详情'
);
const introSummary = computed(
  () =>
    detail.value?.summary?.trim() ||
    '从天气、位置与正文开始，建立对这个景点最直接的第一印象。'
);
const viewCountText = computed(() =>
  typeof detail.value?.viewCount === 'number' ? `${formatCountStat(detail.value.viewCount)} 浏览` : ''
);
const openingHoursText = computed(() => detail.value?.openingHours?.trim() || '');
const addressDetailText = computed(() => detail.value?.addressDetail?.trim() || '');
const telephoneText = computed(() => detail.value?.telephone?.trim() || '');
const weatherUpdatedText = computed(() => {
  const value = weather.value?.sourceUpdatedAt?.trim();
  return value ? formatDateTime(value) : '';
});
const weatherSourceLabel = computed(() => weather.value?.source?.trim() || '');
const telephoneItems = computed(() => {
  const normalized = detail.value?.telephoneList
    ?.map((item) => item?.trim())
    .filter(Boolean);

  if (normalized?.length) {
    return normalized;
  }

  return telephoneText.value ? [telephoneText.value] : [];
});
const mapQuery = computed(() => {
  const segments = [detail.value?.name, addressDetailText.value, detail.value?.locationText]
    .map((item) => item?.trim())
    .filter(Boolean);

  return segments.join(' ');
});
const hasCoordinates = computed(
  () => typeof detail.value?.latitude === 'number' && typeof detail.value?.longitude === 'number'
);
const baiduMapUrl = computed(() => {
  if (hasCoordinates.value) {
    return `https://api.map.baidu.com/marker?location=${detail.value!.latitude},${detail.value!.longitude}&title=${encodeURIComponent(detail.value?.name || '景点位置')}&content=${encodeURIComponent(heroLocation.value)}&output=html`;
  }

  return mapQuery.value
    ? `https://api.map.baidu.com/place/search?query=${encodeURIComponent(mapQuery.value)}&region=${encodeURIComponent(detail.value?.locationText || '全国')}&output=html`
    : '';
});
const practicalFacts = computed(() => {
  const facts = [
    { label: '开放时间', value: openingHoursText.value, type: 'text' as const },
    { label: '详细地址', value: addressDetailText.value || heroLocation.value, type: 'text' as const },
    { label: '联系电话', value: telephoneItems.value.join(' / '), type: 'phone' as const },
    {
      label: '最近同步',
      value: formatDate(detail.value?.sourceSyncedAt?.trim() || detail.value?.updatedAt?.trim()),
      type: 'text' as const
    }
  ];

  return facts.filter((item) => item.value);
});
const showWeatherSection = computed(
  () => weatherStatus.value === 'success' && Boolean(weather.value?.available)
);
const currentWeather = computed(() => weather.value?.current);
const forecastItems = computed<AttractionWeatherForecast[]>(() => weather.value?.forecast || []);
const primaryAlert = computed<AttractionWeatherAlert | null>(() => weather.value?.alerts?.[0] || null);
const currentTemperatureText = computed(() => {
  const value = currentWeather.value?.temperature;
  return typeof value === 'number' ? `${Math.round(value)}°` : '--';
});
const currentWeatherDescription = computed(() => {
  const feelsLike = currentWeather.value?.feelsLike;
  const weatherText = currentWeather.value?.weatherText?.trim() || '天气信息更新中';

  if (typeof feelsLike === 'number') {
    return `体感温度 ${Math.round(feelsLike)}° · ${weatherText}`;
  }

  return weatherText;
});
const humidityText = computed(() => {
  const value = currentWeather.value?.humidity;
  return typeof value === 'number' ? `湿度 ${value}%` : '';
});
const windText = computed(() => {
  const segments = [currentWeather.value?.windDirection, currentWeather.value?.windLevel]
    .map((item) => item?.trim())
    .filter(Boolean);

  return segments.join(' ');
});
const weatherTipText = computed(
  () => currentWeather.value?.travelTip?.trim() || '当前天气信息较稳定，可结合景点开放时间安排出行。'
);
const weatherTipTitle = computed(() =>
  currentWeather.value?.isSuitable === false ? '出行建议' : '当前适宜度'
);
const weatherTipIcon = computed(() =>
  currentWeather.value?.isSuitable === false ? 'warning' : 'lightbulb'
);
const weatherSuitabilityClass = computed(() =>
  currentWeather.value?.isSuitable === false ? 'weather-tip-card-caution' : 'weather-tip-card-positive'
);
const currentWeatherIcon = computed(() =>
  resolveWeatherIcon(currentWeather.value?.weatherText, currentWeather.value?.iconKey)
);
const mapStatusText = computed(() => {
  if (mapStatus.value === 'loading') {
    return '地图正在加载中...';
  }

  if (mapStatus.value === 'missing-ak') {
    return '当前未配置百度地图 AK，暂时无法展示内嵌地图。';
  }

  if (mapStatus.value === 'error') {
    return '暂时无法加载地图，可先使用下方按钮在百度地图中查看。';
  }

  return '';
});
const stateTitle = computed(() =>
  pageStatus.value === 'error' ? '景点详情暂时无法加载' : '未找到对应景点内容'
);
const stateDescription = computed(() =>
  pageStatus.value === 'error'
    ? errorMessage.value || '当前无法加载该景点详情，请稍后重试。'
    : '当前未找到可展示的景点详情，你可以返回景点列表继续浏览。'
);

function resolveWeatherIcon(weatherText?: string, iconKey?: string) {
  const normalizedKey = iconKey?.trim().toLowerCase();

  if (normalizedKey && weatherIconPreset.has(normalizedKey)) {
    return weatherIconPreset.get(normalizedKey) || 'cloud';
  }

  const text = weatherText?.trim() || '';

  if (!text) return 'cloud';
  if (text.includes('雷')) return 'thunderstorm';
  if (text.includes('雪')) return 'weather_snowy';
  if (text.includes('雨')) return 'rainy';
  if (text.includes('雾') || text.includes('霾')) return 'foggy';
  if (text.includes('阴') || text.includes('云')) return 'cloud';
  if (text.includes('晴')) return 'sunny';

  return 'cloud';
}

function formatForecastTemp(min?: number, max?: number) {
  const hasMin = typeof min === 'number';
  const hasMax = typeof max === 'number';

  if (hasMin && hasMax) {
    return `${Math.round(min!)}° / ${Math.round(max!)}°`;
  }

  if (hasMax) {
    return `${Math.round(max!)}°`;
  }

  if (hasMin) {
    return `${Math.round(min!)}°`;
  }

  return '--';
}

function alertLevelClass(level?: string) {
  const normalized = level?.trim().toLowerCase();

  if (normalized === 'red') return 'weather-alert-card-red';
  if (normalized === 'orange') return 'weather-alert-card-orange';
  if (normalized === 'yellow') return 'weather-alert-card-yellow';
  if (normalized === 'blue') return 'weather-alert-card-blue';
  return '';
}

function createMapMarker(point: InstanceType<BaiduMapNamespace['Point']>) {
  if (!mapSdk) {
    return null;
  }

  const icon = new mapSdk.Icon(markerIconUrl, new mapSdk.Size(56, 56), {
    imageSize: new mapSdk.Size(56, 56),
    anchor: new mapSdk.Size(28, 28)
  });

  return new mapSdk.Marker(point, { icon });
}

const goBackToList = () => {
  router.push('/attractions');
};

const ensureMapInstance = async () => {
  if (!mapContainerRef.value) return null;

  if (!baiduMapAk) {
    mapStatus.value = 'missing-ak';
    return null;
  }

  mapStatus.value = 'loading';

  const BMap = await loadBaiduMapSdk(baiduMapAk);
  mapSdk = BMap;

  if (!mapContainerRef.value) return null;

  if (!mapInstance) {
    mapInstance = new BMap.Map(mapContainerRef.value);
  }

  if (!mapControlsInitialized) {
    mapInstance.enableScrollWheelZoom(true);
    mapInstance.addControl(new BMap.NavigationControl());
    mapInstance.addControl(new BMap.ScaleControl());
    mapControlsInitialized = true;
  }

  return mapInstance;
};

const renderBaiduMap = async () => {
  if (pageStatus.value !== 'success' || !detail.value || !mapQuery.value || !mapContainerRef.value) {
    return;
  }

  try {
    const map = await ensureMapInstance();
    if (!map || !detail.value || !mapSdk) return;

    map.clearOverlays();

    if (hasCoordinates.value) {
      const point = new mapSdk.Point(detail.value.longitude!, detail.value.latitude!);
      map.centerAndZoom(point, 15);
      const marker = createMapMarker(point);
      if (marker) {
        map.addOverlay(marker);
      }
      mapStatus.value = 'ready';
      return;
    }

    const geocoder = new mapSdk.Geocoder();
    geocoder.getPoint(
      mapQuery.value,
      (point) => {
        if (!point || !mapInstance || !mapSdk) {
          mapStatus.value = 'error';
          return;
        }

        mapInstance.clearOverlays();
        mapInstance.centerAndZoom(point, 15);
        const marker = createMapMarker(point);
        if (marker) {
          mapInstance.addOverlay(marker);
        }
        mapStatus.value = 'ready';
      },
      detail.value?.locationText || undefined
    );
  } catch (error) {
    console.error('Failed to render Baidu map', error);
    mapStatus.value = baiduMapAk ? 'error' : 'missing-ak';
  }
};

const recenterMap = () => {
  if (!mapInstance || !mapSdk || !detail.value) return;

  if (hasCoordinates.value) {
    const point = new mapSdk.Point(detail.value.longitude!, detail.value.latitude!);
    mapInstance.clearOverlays();
    mapInstance.centerAndZoom(point, 15);
    const marker = createMapMarker(point);
    if (marker) {
      mapInstance.addOverlay(marker);
    }
    return;
  }

  if (!mapQuery.value) return;

  const geocoder = new mapSdk.Geocoder();
  geocoder.getPoint(
    mapQuery.value,
    (point) => {
      if (!point || !mapInstance || !mapSdk) return;

      mapInstance.clearOverlays();
      mapInstance.centerAndZoom(point, 15);
      const marker = createMapMarker(point);
      if (marker) {
        mapInstance.addOverlay(marker);
      }
    },
    detail.value?.locationText || undefined
  );
};

const fetchDetail = async (id: string | string[] | undefined) => {
  const attractionId = Array.isArray(id) ? id[0] : id;
  const requestId = ++fetchSequence;

  if (!attractionId) {
    detail.value = null;
    weather.value = null;
    errorMessage.value = '';
    pageStatus.value = 'empty';
    weatherStatus.value = 'idle';
    return;
  }

  pageStatus.value = 'loading';
  weatherStatus.value = 'loading';
  errorMessage.value = '';
  detail.value = null;
  weather.value = null;

  const [detailResult, weatherResult] = await Promise.allSettled([
    getAttractionDetail(attractionId),
    getAttractionWeather(attractionId, { skipErrorToast: true })
  ]);

  if (requestId !== fetchSequence) return;

  if (detailResult.status === 'rejected') {
    console.error('Failed to load attraction detail', detailResult.reason);
    errorMessage.value = '当前无法获取景点详情，请稍后重试。';
    pageStatus.value = 'error';
    weatherStatus.value = 'idle';
    return;
  }

  detail.value = detailResult.value.data || null;
  pageStatus.value = detail.value ? 'success' : 'empty';

  if (pageStatus.value !== 'success') {
    weatherStatus.value = 'idle';
    return;
  }

  if (weatherResult.status === 'fulfilled') {
    weather.value = weatherResult.value.data;
    weatherStatus.value = weather.value.available ? 'success' : 'hidden';
  } else {
    console.error('Failed to load attraction weather', weatherResult.reason);
    weather.value = null;
    weatherStatus.value = 'error';
  }
};

const reloadDetail = () => {
  fetchDetail(route.params.id);
};

watch(
  () => route.params.id,
  (id) => {
    fetchDetail(id);
  },
  { immediate: true }
);

watch(
  () => [
    pageStatus.value,
    detail.value?.id,
    detail.value?.latitude,
    detail.value?.longitude,
    detail.value?.locationText,
    mapContainerRef.value
  ],
  () => {
    if (pageStatus.value !== 'success') {
      mapStatus.value = 'idle';
      return;
    }

    nextTick(() => {
      renderBaiduMap();
    });
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  mapInstance = null;
  mapSdk = null;
  mapControlsInitialized = false;
});
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.headline-text {
  font-family: 'Plus Jakarta Sans', var(--font-family-sans);
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

.attraction-detail-page {
  max-width: 1400px;
  margin: 0 auto;
  color: #2c2f30;
}

.hero-stage {
  position: relative;
  min-height: 716px;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(44, 47, 48, 0.12);
}

.hero-media,
.hero-overlay {
  position: absolute;
  inset: 0;
}

.hero-media {
  background-position: center;
  background-size: cover;
  transform: scale(1.01);
}

.hero-overlay {
  background: linear-gradient(180deg, rgba(13, 21, 31, 0.06) 0%, rgba(13, 21, 31, 0.16) 36%, rgba(13, 21, 31, 0.68) 100%);
}

.hero-shell {
  position: relative;
  z-index: 1;
  min-height: 716px;
  padding: 28px 32px 42px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hero-topbar-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.hero-back,
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.hero-back {
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.18);
  color: #eef2ff;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.24);
    border-color: rgba(255, 255, 255, 0.36);
  }
}

.hero-pill {
  color: rgba(238, 242, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.hero-pill-solid {
  color: #002c59;
  background: rgba(255, 255, 255, 0.88);
}

.hero-content {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 24px;
}

.hero-copy {
  max-width: min(860px, 100%);
}

.hero-location-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(238, 242, 255, 0.92);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 14px 0 0;
  color: #ffffff;
  font-size: clamp(48px, 8vw, 86px);
  line-height: 0.94;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.tag-strip {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.tag-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 0 22px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(44, 47, 48, 0.06);
  color: #2c2f30;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.tag-icon {
  color: #005bad;
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}

.content-grid {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 32px;
}

.content-grid-single {
  grid-template-columns: 1fr;
}

.weather-column,
.practical-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.weather-column {
  grid-column: span 8;
}

.practical-column {
  grid-column: span 4;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.weather-card,
.forecast-card,
.map-card,
.info-card,
.story-lead-card,
.story-empty,
.loading-card,
.state-card {
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 36px rgba(44, 47, 48, 0.06);
}

.weather-card-current {
  position: relative;
  overflow: hidden;
  padding: 32px;
}

.weather-glow {
  position: absolute;
  right: -40px;
  top: -28px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(94, 162, 255, 0.12);
  filter: blur(24px);
}

.weather-current-head,
.forecast-head,
.info-head {
  position: relative;
  z-index: 1;
}

.weather-current-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.panel-label {
  margin: 0;
  color: #595c5d;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.weather-temp {
  margin: 10px 0 0;
  color: #005bad;
  font-size: clamp(58px, 5vw, 92px);
  line-height: 0.94;
  font-weight: 800;
}

.weather-subline {
  margin: 10px 0 0;
  color: #595c5d;
  font-size: var(--font-size-base);
  line-height: 1.7;
}

.weather-main-icon {
  color: #5ea2ff;
  font-size: 74px;
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 48;
}

.weather-current-meta {
  position: relative;
  z-index: 1;
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
}

.weather-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2c2f30;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.weather-meta-item .material-symbols-outlined {
  color: #005bad;
}

.weather-sidecards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.weather-tip-card,
.weather-alert-card {
  padding: 24px;
  border: 1px solid transparent;
  border-radius: 28px;
  display: flex;
  gap: 14px;
}

.weather-tip-card .material-symbols-outlined,
.weather-alert-card .material-symbols-outlined {
  font-size: 32px;
}

.weather-tip-card h3,
.weather-alert-card h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  line-height: 1.3;
  font-weight: var(--font-weight-bold);
}

.weather-tip-card p,
.weather-alert-card p {
  margin: 8px 0 0;
  color: #595c5d;
  font-size: var(--font-size-sm);
  line-height: 1.8;
}

.weather-tip-card-positive {
  background: rgba(0, 91, 173, 0.05);
  border-color: rgba(0, 91, 173, 0.1);

  .material-symbols-outlined,
  h3 {
    color: #005bad;
  }
}

.weather-tip-card-caution {
  background: rgba(255, 202, 77, 0.14);
  border-color: rgba(245, 186, 0, 0.2);

  .material-symbols-outlined,
  h3 {
    color: #664b00;
  }
}

.weather-alert-card {
  background: rgba(255, 202, 77, 0.12);
  border-color: rgba(247, 186, 0, 0.28);

  .material-symbols-outlined,
  h3 {
    color: #664b00;
  }
}

.weather-alert-card-muted {
  background: rgba(239, 241, 242, 0.86);
  border-color: rgba(218, 221, 223, 0.9);

  .material-symbols-outlined,
  h3 {
    color: #005bad;
  }
}

.weather-alert-card-blue {
  background: rgba(94, 162, 255, 0.12);
  border-color: rgba(94, 162, 255, 0.2);
}

.weather-alert-card-yellow {
  background: rgba(255, 202, 77, 0.14);
  border-color: rgba(247, 186, 0, 0.22);
}

.weather-alert-card-orange {
  background: rgba(255, 167, 38, 0.14);
  border-color: rgba(255, 167, 38, 0.24);
}

.weather-alert-card-red {
  background: rgba(251, 81, 81, 0.12);
  border-color: rgba(251, 81, 81, 0.2);

  .material-symbols-outlined,
  h3 {
    color: #b31b25;
  }
}

.forecast-card {
  padding: 30px;
}

.forecast-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: #2c2f30;
    font-size: var(--font-size-6xl);
    font-weight: 800;
    line-height: 1.1;
  }
}

.forecast-source {
  color: #757778;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
}

.forecast-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.forecast-item {
  padding: 24px 18px;
  border-radius: 24px;
  background: #eff1f2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.forecast-day {
  color: #595c5d;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.forecast-icon {
  margin: 16px 0 10px;
  color: #005bad;
  font-size: 42px;
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 36;
}

.forecast-temp {
  color: #2c2f30;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.forecast-weather {
  margin-top: 10px;
  color: #595c5d;
  font-size: var(--font-size-sm);
}

.forecast-status {
  margin-top: 16px;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
}

.forecast-status-ok {
  background: #5ea2ff;
  color: #002348;
}

.forecast-status-risk {
  background: #dadddf;
  color: #595c5d;
}

.map-card {
  position: relative;
  padding: 0;
  overflow: hidden;
}

.map-frame-shell {
  position: relative;
  height: 288px;
  background: linear-gradient(135deg, #e6e8ea 0%, #eff1f2 100%);
}

.map-frame {
  width: 100%;
  height: 100%;
}

.map-status {
  position: absolute;
  inset: 0;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(12px);
  color: #595c5d;
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.map-actions {
  padding: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.map-action {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(117, 119, 120, 0.18);
  background: #ffffff;
  color: #2c2f30;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 91, 173, 0.24);
  }
}

.map-action-primary {
  background: #005bad;
  color: #eef2ff;
  border-color: #005bad;
}

.info-card {
  padding: 28px;
}

.info-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
  border-bottom: 1px solid #dadddf;

  .material-symbols-outlined {
    color: #005bad;
  }

  h3 {
    margin: 0;
    color: #2c2f30;
    font-size: var(--font-size-4xl);
    line-height: 1.16;
    font-weight: 800;
  }
}

.info-list {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.info-label {
  color: #757778;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.info-value {
  margin: 8px 0 0;
  color: #2c2f30;
  font-size: var(--font-size-md);
  line-height: 1.7;
  font-weight: var(--font-weight-semibold);
}

.info-phone-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-phone {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(94, 162, 255, 0.08);
  color: #005bad;
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.story-section {
  padding: 64px 0 0;
}

.story-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.96fr) minmax(0, 1.04fr);
  gap: 48px;
  align-items: start;
}

.story-side-inner {
  position: sticky;
  top: 112px;
}

.story-label {
  color: #005bad;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.story-side h2 {
  margin: 16px 0 0;
  color: #2c2f30;
  font-size: clamp(32px, 4vw, 56px);
  line-height: 1.08;
  font-weight: 800;
}

.story-divider {
  width: 88px;
  height: 4px;
  border-radius: 999px;
  margin-top: 28px;
  background: linear-gradient(90deg, #005bad, #5ea2ff);
}

.story-summary {
  margin: 24px 0 0;
  color: #595c5d;
  font-size: var(--font-size-base);
  line-height: 1.9;
}

.story-content {
  color: #595c5d;
}

.story-lead-card {
  padding: 24px 26px;
  margin-bottom: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 241, 242, 0.72) 100%);
}

.story-lead-title {
  margin: 0;
  color: #005bad;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.story-lead-copy {
  margin: 12px 0 0;
  color: #2c2f30;
  font-size: var(--font-size-lg);
  line-height: 1.95;
}

.story-content :deep(.rich-content) {
  color: #595c5d;
  font-size: var(--font-size-lg);
  line-height: 1.95;
}

.story-content :deep(h2),
.story-content :deep(h3),
.story-content :deep(h4) {
  font-family: 'Plus Jakarta Sans', var(--font-family-sans);
}

.story-empty {
  padding: 28px;

  h3 {
    margin: 0;
    color: #2c2f30;
    font-size: var(--font-size-5xl);
    line-height: 1.2;
  }

  p {
    margin: 14px 0 0;
    color: #595c5d;
    font-size: var(--font-size-base);
    line-height: 1.85;
  }
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-card {
  background: linear-gradient(90deg, rgba(230, 232, 234, 0.88), rgba(239, 241, 242, 1), rgba(230, 232, 234, 0.88));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 640px;
  border-radius: 32px;
}

.loading-grid {
  display: grid;
  gap: 24px;
}

.loading-card {
  min-height: 220px;
}

.loading-card-wide {
  min-height: 180px;
}

.loading-grid-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.loading-card-tall {
  min-height: 360px;
}

.state-shell {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-card {
  width: min(100%, 720px);
  padding: 48px 36px;
  text-align: center;
}

.state-mark {
  width: 92px;
  height: 92px;
  margin: 0 auto 18px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(94, 162, 255, 0.24) 0%, rgba(255, 202, 77, 0.18) 100%);
  box-shadow: 0 18px 40px rgba(44, 47, 48, 0.08);
}

.state-mark-error {
  background: linear-gradient(135deg, rgba(251, 81, 81, 0.2) 0%, rgba(255, 202, 77, 0.2) 100%);
}

.state-label {
  margin: 0;
  color: #005bad;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.state-card h2 {
  margin: 16px 0 0;
  color: #2c2f30;
  font-size: var(--font-size-12xl);
  line-height: 1.08;
  font-weight: 800;
}

.state-description {
  max-width: 520px;
  margin: 16px auto 0;
  color: #595c5d;
  font-size: var(--font-size-lg);
  line-height: 1.82;
}

.state-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1200px) {
  .content-grid,
  .weather-grid,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .weather-column,
  .practical-column {
    grid-column: span 12;
  }

  .practical-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .story-side-inner {
    position: static;
  }
}

@media (max-width: 900px) {
  .hero-stage {
    min-height: 560px;
  }

  .hero-shell {
    min-height: 560px;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .forecast-grid,
  .loading-grid-columns,
  .practical-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .hero-stage,
  .weather-card,
  .forecast-card,
  .map-card,
  .info-card,
  .story-lead-card,
  .story-empty,
  .loading-hero,
  .loading-card,
  .state-card {
    border-radius: 24px;
  }

  .hero-stage {
    min-height: 460px;
  }

  .hero-shell {
    min-height: 460px;
    padding: 18px 18px 24px;
  }

  .hero-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-topbar-meta {
    justify-content: flex-start;
  }

  .hero-copy h1 {
    font-size: clamp(38px, 12vw, 56px);
  }

  .tag-strip,
  .content-grid {
    margin-top: 20px;
  }

  .tag-card {
    width: 100%;
    justify-content: flex-start;
  }

  .weather-card-current,
  .forecast-card,
  .info-card,
  .story-lead-card,
  .story-empty,
  .state-card {
    padding: 22px 18px;
  }

  .weather-current-head {
    flex-direction: column;
  }

  .weather-temp {
    font-size: 62px;
  }

  .forecast-grid {
    gap: 14px;
  }

  .forecast-item {
    padding: 20px 16px;
  }

  .map-frame-shell {
    height: 240px;
  }

  .story-section {
    padding-top: 36px;
  }

  .story-side h2 {
    font-size: 34px;
  }

  .story-content :deep(.rich-content) {
    font-size: var(--font-size-base);
  }

  .loading-hero {
    min-height: 420px;
  }

  .state-card h2 {
    font-size: var(--font-size-8xl);
  }

  .state-actions {
    flex-direction: column;
  }

  .state-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
