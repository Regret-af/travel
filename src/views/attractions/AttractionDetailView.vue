<template>
  <div class="attraction-detail-page">
    <template v-if="pageStatus === 'success' && detail">
      <section class="detail-hero" :style="heroBackgroundStyle">
        <div class="hero-overlay" />
        <div class="hero-glow hero-glow-cyan" />
        <div class="hero-glow hero-glow-gold" />

        <div class="hero-topbar">
          <button class="hero-back" type="button" @click="goBackToList">
            返回景点列表
          </button>
          <span v-if="detail.category?.name" class="hero-category">{{ detail.category.name }}</span>
        </div>

        <div class="hero-content">
          <div class="hero-copy">
            <p class="hero-eyebrow">景点详情</p>
            <h1>{{ detail.name }}</h1>

            <div class="hero-meta">
              <span v-if="detail.locationText" class="hero-meta-pill">{{ detail.locationText }}</span>
            </div>
          </div>

          <button class="hero-scroll" type="button" @click="scrollToIntro">
            继续阅读
          </button>
        </div>
      </section>

      <section ref="introRef" class="intro-shell">
        <div class="intro-card">
          <p class="section-eyebrow">景点概览</p>
          <div class="intro-headline">
            <h2>关键信息</h2>
            <p>{{ introSummary }}</p>
          </div>
        </div>

        <div class="meta-grid">
          <article v-if="detail.category?.name" class="meta-card">
            <span class="meta-label">景点分类</span>
            <strong class="meta-value">{{ detail.category?.name }}</strong>
          </article>

          <article v-if="detail.locationText" class="meta-card">
            <span class="meta-label">所在位置</span>
            <strong class="meta-value">{{ detail.locationText }}</strong>
          </article>

          <article v-if="viewCountText" class="meta-card">
            <span class="meta-label">浏览记录</span>
            <strong class="meta-value">{{ viewCountText }}</strong>
          </article>
        </div>
      </section>

      <section v-if="hasGuideContent" class="guide-shell">
        <div class="guide-grid">
          <article v-if="mapQuery" class="guide-card guide-card-map">
            <p class="section-eyebrow">地图位置</p>
            <h2>在地图中查看景点位置</h2>
            <p class="guide-description">
              {{ mapDescription }}
            </p>

            <div class="map-preview">
              <div ref="mapContainerRef" class="map-frame" />

              <div v-if="mapStatus !== 'ready'" class="map-status">
                {{ mapStatusText }}
              </div>
            </div>

            <div class="map-actions">
              <button
                v-if="mapStatus === 'ready'"
                type="button"
                class="guide-link"
                @click="recenterMap"
              >
                回到景点位置
              </button>
              <a
                v-if="baiduMapUrl"
                class="guide-link guide-link-primary"
                :href="baiduMapUrl"
                target="_blank"
                rel="noreferrer"
              >
                在百度地图中查看
              </a>
            </div>
          </article>

          <article v-if="guideFacts.length" class="guide-card guide-card-facts">
            <p class="section-eyebrow">出行参考</p>
            <h2>快速查看实用信息</h2>

            <div class="guide-facts">
              <div
                v-for="fact in guideFacts"
                :key="fact.label"
                class="guide-fact"
              >
                <span class="guide-fact-label">{{ fact.label }}</span>
                <template v-if="fact.label === '联系电话' && telephoneItems.length">
                  <div class="guide-fact-links">
                    <a
                      v-for="phone in telephoneItems"
                      :key="phone"
                      class="guide-fact-link"
                      :href="`tel:${phone.replace(/\\s+/g, '')}`"
                    >
                      {{ phone }}
                    </a>
                  </div>
                </template>
                <strong v-else class="guide-fact-value">{{ fact.value }}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="story-shell">
        <div class="story-frame">
          <div class="story-intro">
            <p class="section-eyebrow">景点介绍</p>
            <h2>以阅读的方式，重新理解该景点</h2>
          </div>

          <div v-if="descriptionParagraphs.length" class="story-body">
            <p
              v-for="(paragraph, index) in descriptionParagraphs"
              :key="`${index}-${paragraph.slice(0, 12)}`"
              class="story-paragraph"
              :class="{ 'story-paragraph-first': index === 0 }"
            >
              {{ paragraph }}
            </p>
          </div>

          <div v-else class="story-empty">
            <p class="story-empty-title">当前还没有更多介绍</p>
            <p class="story-empty-text">
              目前可以先查看封面、分类和位置信息，稍后再回来了解更多内容。
            </p>
          </div>
        </div>
      </section>
    </template>

    <section v-else-if="pageStatus === 'loading'" class="loading-shell">
      <div class="loading-hero">
        <div class="loading-sheen" />
      </div>
      <div class="loading-card-grid">
        <div class="loading-card loading-card-wide">
          <span class="loading-line short" />
          <span class="loading-line medium" />
          <span class="loading-line long" />
        </div>
        <div class="loading-card loading-card-compact">
          <span class="loading-line medium" />
          <span class="loading-line short" />
        </div>
      </div>
    </section>

    <section v-else class="state-shell">
      <div class="state-card">
        <div class="state-mark" :class="{ 'state-mark-error': pageStatus === 'error' }" />
        <p class="section-eyebrow">{{ pageStatus === 'error' ? '暂时无法打开' : '内容暂未找到' }}</p>
        <h2>{{ stateTitle }}</h2>
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
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAttractionDetail, type AttractionDetail } from '@/api/attractions';
import { loadBaiduMapSdk, type BaiduMapMap, type BaiduMapNamespace } from '@/utils/baiduMap';
import { formatCountStat, formatDate } from '@/utils/formatters';

const route = useRoute();
const router = useRouter();

const detail = ref<AttractionDetail | null>(null);
const pageStatus = ref<'loading' | 'success' | 'empty' | 'error'>('loading');
const errorMessage = ref('');
const introRef = ref<HTMLElement | null>(null);
const mapContainerRef = ref<HTMLElement | null>(null);
const mapStatus = ref<'idle' | 'loading' | 'ready' | 'missing-ak' | 'error'>('idle');
let fetchSequence = 0;
let mapInstance: BaiduMapMap | null = null;
let mapSdk: BaiduMapNamespace | null = null;
let mapControlsInitialized = false;
const baiduMapAk = import.meta.env.VITE_BAIDU_MAP_AK?.trim() || '';

const heroBackgroundStyle = computed(() => ({
  backgroundImage: detail.value?.coverUrl
    ? `linear-gradient(115deg, rgba(15, 23, 42, 0.62) 0%, rgba(15, 23, 42, 0.26) 42%, rgba(15, 23, 42, 0.72) 100%), url(${detail.value.coverUrl})`
    : 'radial-gradient(circle at 20% 18%, rgba(34, 211, 238, 0.26), transparent 24%), radial-gradient(circle at 82% 18%, rgba(212, 175, 55, 0.22), transparent 20%), linear-gradient(135deg, #e8f6fb 0%, #f8fafc 52%, #eef3ff 100%)'
}));
const introSummary = computed(
  () =>
    detail.value?.summary?.trim() ||
    '从封面、位置与正文开始，建立对该景点最直接的第一印象。'
);
const descriptionParagraphs = computed(() => {
  const description = detail.value?.description?.trim() || '';
  if (!description) return [];

  return description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
});
const viewCountText = computed(() =>
  typeof detail.value?.viewCount === 'number' ? `${formatCountStat(detail.value.viewCount)} 浏览` : ''
);
const updatedAtText = computed(() => {
  const value = detail.value?.sourceSyncedAt?.trim() || detail.value?.updatedAt?.trim();
  if (!value) return '';

  return formatDate(value);
});
const openingHoursText = computed(() => detail.value?.openingHours?.trim() || '');
const telephoneText = computed(() => detail.value?.telephone?.trim() || '');
const addressDetailText = computed(() => detail.value?.addressDetail?.trim() || '');
const telephoneItems = computed(() => {
  const list = detail.value?.telephoneList
    ?.map((item) => item?.trim())
    .filter(Boolean);

  if (list?.length) {
    return list;
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
const coordinateText = computed(() => {
  if (!hasCoordinates.value) return '';

  return `${detail.value!.latitude!.toFixed(5)}, ${detail.value!.longitude!.toFixed(5)}`;
});
const baiduMapUrl = computed(() => {
  if (hasCoordinates.value) {
    return `https://api.map.baidu.com/marker?location=${detail.value!.latitude},${detail.value!.longitude}&title=${encodeURIComponent(detail.value?.name || '景点位置')}&content=${encodeURIComponent(detail.value?.locationText || detail.value?.name || '景点位置')}&output=html`;
  }

  return mapQuery.value
    ? `https://api.map.baidu.com/place/search?query=${encodeURIComponent(mapQuery.value)}&region=${encodeURIComponent(detail.value?.locationText || '全国')}&output=html`
    : '';
});
const mapDescription = computed(() => {
  if (detail.value?.locationText?.trim()) {
    return `可拖动或缩放地图查看周边，迷失位置时可一键回到 ${detail.value.locationText.trim()}。`;
  }

  return '可拖动或缩放地图查看周边，迷失位置时可一键回到景点位置。';
});
const guideFacts = computed(() => {
  const facts = [
    { label: '开放时间', value: openingHoursText.value },
    { label: '详细地址', value: addressDetailText.value },
    { label: '联系电话', value: telephoneItems.value.join(' / ') },
    { label: '最近同步', value: updatedAtText.value }
  ];

  return facts.filter((fact) => fact.value);
});
const mapStatusText = computed(() => {
  if (mapStatus.value === 'loading') {
    return '地图正在加载中…';
  }

  if (mapStatus.value === 'missing-ak') {
    return '当前未配置百度地图 AK，暂时无法展示内嵌地图。';
  }

  if (mapStatus.value === 'error') {
    return '暂时无法加载地图，可先使用下方按钮在百度地图中查看。';
  }

  return '';
});
const hasGuideContent = computed(
  () => Boolean(mapQuery.value || guideFacts.value.length)
);
const stateTitle = computed(() =>
  pageStatus.value === 'error' ? '景点详情暂时无法加载' : '未找到对应景点内容'
);
const stateDescription = computed(() =>
  pageStatus.value === 'error'
    ? errorMessage.value || '当前无法加载该景点详情，请稍后重试。'
    : '当前未找到可展示的景点详情，你可以返回景点列表继续浏览。'
);

const goBackToList = () => {
  router.push('/attractions');
};

const scrollToIntro = () => {
  nextTick(() => {
    const targetTop = introRef.value?.getBoundingClientRect().top;

    if (typeof targetTop !== 'number') return;

    window.scrollTo({
      top: Math.max(window.scrollY + targetTop - 96, 0),
      behavior: 'smooth'
    });
  });
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
      map.addOverlay(new mapSdk.Marker(point));
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
        mapInstance.addOverlay(new mapSdk.Marker(point));
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
    mapInstance.addOverlay(new mapSdk.Marker(point));
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
      mapInstance.addOverlay(new mapSdk.Marker(point));
    },
    detail.value?.locationText || undefined
  );
};

const fetchDetail = async (id: string | string[] | undefined) => {
  const attractionId = Array.isArray(id) ? id[0] : id;
  const requestId = ++fetchSequence;

  if (!attractionId) {
    detail.value = null;
    errorMessage.value = '';
    pageStatus.value = 'empty';
    return;
  }

  pageStatus.value = 'loading';
  errorMessage.value = '';

  try {
    const res = await getAttractionDetail(attractionId);
    if (requestId !== fetchSequence) return;
    detail.value = res.data || null;
    pageStatus.value = detail.value ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== fetchSequence) return;
    console.error('Failed to load attraction detail', error);
    detail.value = null;
    errorMessage.value = '当前无法获取景点详情，请稍后重试。';
    pageStatus.value = 'error';
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
.attraction-detail-page {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  color: #111827;
}

.detail-hero,
.intro-card,
.meta-card,
.guide-card,
.story-frame,
.state-card,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.detail-hero {
  position: relative;
  min-height: 58vh;
  padding: 28px 36px 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-position: center;
  background-size: cover;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
}

.hero-overlay,
.hero-glow {
  position: absolute;
  pointer-events: none;
}

.hero-overlay {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.22) 46%, rgba(15, 23, 42, 0.58) 100%);
}

.hero-glow {
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.72;
}

.hero-glow-cyan {
  width: 260px;
  height: 260px;
  right: -40px;
  top: 12%;
  background: rgba(34, 211, 238, 0.22);
}

.hero-glow-gold {
  width: 220px;
  height: 220px;
  left: -30px;
  bottom: 12%;
  background: rgba(212, 175, 55, 0.18);
}

.hero-topbar,
.hero-content {
  position: relative;
  z-index: 1;
}

.hero-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-back,
.hero-category,
.hero-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  backdrop-filter: blur(12px);
}

.hero-back {
  border: none;
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.hero-category {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.82);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.hero-copy {
  max-width: 700px;
  color: #f8fafc;
}

.hero-eyebrow,
.section-eyebrow {
  margin: 0 0 12px;
  color: #f0cf79;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 0;
  font-size: var(--font-size-hero);
  line-height: 0.98;
  font-weight: var(--font-weight-display);
  letter-spacing: -0.04em;
}

.hero-meta {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-meta-pill {
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.14);

  &.ghost {
    background: rgba(255, 255, 255, 0.14);
  }
}

.hero-scroll {
  flex-shrink: 0;
  min-height: 54px;
  padding: 0 22px;
  border-radius: 999px;
  border: none;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.9);
  color: #111827;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  }
}

.intro-shell {
  position: relative;
  z-index: 2;
}

.guide-shell {
  padding-top: 2px;
}

.intro-card {
  padding: 34px 34px 32px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
}

.intro-headline {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 28px;
  align-items: start;

  h2 {
    margin: 0;
    font-size: var(--font-size-14xl);
    line-height: 1.06;
    font-weight: var(--font-weight-title);
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: #475569;
    font-size: var(--font-size-xl);
    line-height: 1.95;
  }
}

.meta-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}

.guide-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr);
  gap: 20px;
}

.meta-card {
  grid-column: span 4;
  padding: 24px 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
  }
}

.meta-card-wide {
  grid-column: span 8;
}

.meta-label {
  display: inline-flex;
  margin-bottom: 12px;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.meta-value {
  display: block;
  color: #111827;
  font-size: var(--font-size-5xl);
  line-height: 1.2;
  font-weight: var(--font-weight-title);
}

.guide-card {
  padding: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);

  h2 {
    margin: 0;
    font-size: var(--font-size-10xl);
    line-height: 1.12;
    font-weight: var(--font-weight-title);
    letter-spacing: -0.03em;
  }
}

.guide-description {
  margin: 14px 0 0;
  color: #64748b;
  font-size: var(--font-size-lg);
  line-height: 1.88;
}

.map-preview {
  min-height: 196px;
  margin-top: 24px;
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.88) 0%, rgba(241, 245, 249, 0.96) 100%);
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.8);
}

.map-frame {
  width: 100%;
  height: 100%;
  min-height: 196px;
  display: block;
  background: transparent;
}

.map-status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #475569;
  font-size: var(--font-size-md);
  line-height: 1.8;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(8px);
  z-index: 1;
}

.map-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.guide-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(34, 211, 238, 0.3);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
  }

  &.guide-link-primary {
    background: #111827;
    border-color: #111827;
    color: #f8fafc;
  }
}

.guide-facts {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.guide-fact {
  min-height: 102px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.85);
}

.guide-fact-label {
  display: inline-flex;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.guide-fact-value {
  display: block;
  margin-top: 10px;
  color: #111827;
  font-size: var(--font-size-lg);
  line-height: 1.72;
  font-weight: var(--font-weight-semibold);
}

.guide-fact-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #111827;
  font-size: var(--font-size-md);
  line-height: 1;
  font-weight: var(--font-weight-semibold);
  text-decoration: none;

  &:hover {
    border-color: rgba(34, 211, 238, 0.32);
  }
}

.guide-fact-links {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.story-shell {
  padding-top: 4px;
}

.story-frame {
  padding: 42px 42px 46px;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.08), transparent 20%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.story-intro {
  max-width: 860px;
  margin: 0 auto 30px;

  h2 {
    margin: 0;
    font-size: var(--font-size-12xl);
    line-height: 1.08;
    font-weight: var(--font-weight-title);
    letter-spacing: -0.03em;
  }
}

.story-body {
  max-width: 760px;
  margin: 0 auto;
}

.story-paragraph {
  margin: 0;
  color: #475569;
  font-size: var(--font-size-xl);
  line-height: 2.05;

  & + & {
    margin-top: 24px;
  }
}

.story-paragraph-first {
  color: #1f2937;
}

.story-empty {
  max-width: 760px;
  margin: 0 auto;
  padding: 26px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
}

.story-empty-title {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-6xl);
  font-weight: var(--font-weight-title);
}

.story-empty-text {
  margin: 14px 0 0;
  color: #64748b;
  font-size: var(--font-size-base);
  line-height: 1.85;
}

.state-card {
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.state-shell {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-card {
  width: min(100%, 680px);
  padding: 46px 34px 42px;
  text-align: center;
}

.state-mark {
  width: 92px;
  height: 92px;
  margin: 0 auto 18px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 36%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(212, 175, 55, 0.22) 100%);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);

  &.state-mark-error {
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 36%),
      linear-gradient(135deg, rgba(248, 113, 113, 0.24) 0%, rgba(251, 191, 36, 0.18) 100%);
  }
}

.state-card h2 {
  margin: 0;
  font-size: var(--font-size-12xl);
  line-height: 1.08;
  font-weight: var(--font-weight-title);
}

.state-description {
  margin: 18px auto 0;
  max-width: 520px;
  color: #64748b;
  font-size: var(--font-size-lg);
  line-height: 1.88;
}

.state-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero {
  min-height: 72vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.8) 0%, rgba(241, 245, 249, 0.96) 100%);
}

.loading-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.65) 50%, rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  animation: loading-sheen 1.3s ease-in-out infinite;
}

.loading-card-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.loading-card {
  padding: 30px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.84);
}

.loading-card-wide {
  min-height: 180px;
}

.loading-card-compact {
  min-height: 180px;
}

.loading-line {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.8));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;

  & + & {
    margin-top: 14px;
  }

  &.short {
    width: 30%;
  }

  &.medium {
    width: 58%;
  }

  &.long {
    width: 84%;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@keyframes loading-sheen {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1100px) {
  .detail-hero {
    min-height: 50vh;
  }

  .hero-copy h1 {
    font-size: var(--font-size-20xl);
  }

  .intro-headline,
  .guide-grid,
  .loading-card-grid {
    grid-template-columns: 1fr;
  }

  .meta-card,
  .meta-card-wide {
    grid-column: span 6;
  }
}

@media (max-width: 767px) {
  .attraction-detail-page {
    gap: 24px;
  }

  .detail-hero,
  .intro-card,
  .meta-card,
  .guide-card,
  .story-frame,
  .state-card,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .detail-hero {
    min-height: 46vh;
    padding: 18px 18px 22px;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-copy h1 {
    font-size: var(--font-size-13xl);
    line-height: 1.04;
  }

  .hero-scroll {
    width: 100%;
    justify-content: center;
  }

  .intro-shell {
    margin-top: -48px;
  }

  .intro-card,
  .guide-card,
  .story-frame,
  .state-card {
    padding: 24px 18px;
  }

  .intro-headline h2,
  .guide-card h2,
  .story-intro h2,
  .state-card h2 {
    font-size: var(--font-size-8xl);
  }

  .intro-headline p,
  .guide-description,
  .state-description {
    font-size: var(--font-size-base);
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .meta-card,
  .meta-card-wide {
    grid-column: span 1;
  }

  .meta-value {
    font-size: var(--font-size-4xl);
  }

  .guide-facts {
    grid-template-columns: 1fr;
  }

  .map-preview {
    min-height: 156px;
    border-radius: 22px;
  }

  .map-frame {
    min-height: 156px;
  }

  .map-status {
    padding: 18px;
    font-size: var(--font-size-sm);
  }

  .guide-link {
    width: 100%;
  }

  .story-body,
  .story-empty {
    margin: 0;
  }

  .story-paragraph {
    font-size: var(--font-size-base);
    line-height: 1.95;
  }

  .state-actions {
    flex-direction: column;
  }

  .state-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .loading-hero {
    min-height: 54vh;
  }
}
</style>
