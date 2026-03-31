<template>
  <section class="global-insight">
    <div class="map-header">
      <div>
        <p class="subtitle">地图探索</p>
        <h2 class="title">从地图上发现值得去看的景点</h2>
      </div>
      <div v-if="status === 'success'" class="header-meta">
        <span class="meta-chip">已定位 {{ mappedItems.length }} 处景点</span>
        <span class="meta-chip meta-chip-soft">点击点位后锁定右侧卡片</span>
      </div>
    </div>

    <section v-if="status === 'loading'" class="state-shell loading-shell" aria-label="地图模块加载中">
      <div class="map-skeleton" />
      <div class="panel-skeleton">
        <span class="skeleton-pill" />
        <span class="skeleton-title" />
        <span class="skeleton-line medium" />
        <span class="skeleton-line long" />
        <span class="skeleton-line short" />
      </div>
    </section>

    <section v-else-if="status === 'error'" class="state-shell">
      <div class="state-card">
        <span class="state-badge">加载受阻</span>
        <h3>地图探索暂时没有顺利展开</h3>
        <p>{{ errorMessage }}</p>
        <div class="state-actions">
          <el-button type="primary" round @click="loadData">重新加载</el-button>
          <el-button round @click="router.push('/attractions')">查看景点列表</el-button>
        </div>
      </div>
    </section>

    <section v-else-if="status === 'empty'" class="state-shell">
      <div class="state-card">
        <span class="state-badge">内容待补充</span>
        <h3>暂时还没有可用于地图探索的景点</h3>
        <p>当前景点数据里还缺少可用于落点的经纬度信息，你仍可前往景点列表继续浏览。</p>
        <div class="state-actions">
          <el-button type="primary" round @click="router.push('/attractions')">查看景点列表</el-button>
        </div>
      </div>
    </section>

    <section v-else class="insight-grid">
      <div class="map-stage">
        <div ref="mapRef" class="map-canvas" />
        <div class="map-overlay">
          <span class="overlay-chip">{{ activeItem?.name || '地图探索已就绪' }}</span>
          <span class="overlay-chip overlay-chip-soft">
            {{ activeItem?.locationText || '把视线停在任一点位上，先挑一处感兴趣的地方开始。' }}
          </span>
        </div>
      </div>

      <aside class="insight-panel">
        <div class="panel-header">
          <div>
            <p class="panel-eyebrow">当前地图视图</p>
            <h3>{{ activeItem?.name || '先从右侧卡片挑一个景点' }}</h3>
          </div>
          <el-button text class="panel-link" @click="router.push('/attractions')">
            查看全部
          </el-button>
        </div>

        <p class="panel-description">
          {{ panelDescription }}
        </p>

        <div class="card-list">
          <article
            v-for="item in mappedItems"
            :key="item.id"
            class="insight-card"
            :class="{ active: item.id === activeId }"
            tabindex="0"
            @mouseenter="handleCardHover(item.id)"
            @focus="handleCardHover(item.id)"
            @click="handleCardSelect(item.id)"
            @keyup.enter="handleCardSelect(item.id)"
          >
            <div class="card-cover">
              <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.name" />
              <div v-else class="card-cover-fallback" />

              <div class="card-badges">
                <span v-if="item.category?.name" class="card-badge">{{ item.category.name }}</span>
                <span v-if="item.id === activeId" class="card-badge card-badge-strong">当前选中</span>
              </div>
            </div>

            <div class="card-copy">
              <div class="card-head">
                <h4>{{ item.name }}</h4>
                <span v-if="item.locationText" class="card-location">{{ item.locationText }}</span>
              </div>

              <p class="card-summary">{{ item.summary?.trim() || '这处景点暂时没有摘要，点击查看详情继续了解。' }}</p>

              <div class="card-footer">
                <span class="card-metric">{{ formatCountStat(item.viewCount) }} 浏览</span>
                <button class="card-action" type="button" @click.stop="goToDetail(item.id)">
                  查看详情
                </button>
              </div>
            </div>
          </article>
        </div>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getHotAttractions, type AttractionCard } from '@/api/attractions';
import { formatCountStat } from '@/utils/formatters';

type ModuleStatus = 'loading' | 'success' | 'empty' | 'error';

const router = useRouter();

const mapRef = ref<HTMLDivElement | null>(null);
const mapInstance = shallowRef<L.Map | null>(null);
const markersLayer = shallowRef<L.LayerGroup | null>(null);
const markerMap = new Map<string, L.Marker>();
const items = ref<AttractionCard[]>([]);
const activeId = ref('');
const status = ref<ModuleStatus>('loading');
const errorMessage = ref('');

const mappedItems = computed(() =>
  items.value.filter(
    (item) => typeof item.latitude === 'number' && typeof item.longitude === 'number'
  )
);
const activeItem = computed(
  () => mappedItems.value.find((item) => item.id === activeId.value) || mappedItems.value[0] || null
);
const panelDescription = computed(() => {
  if (!activeItem.value) {
    return '先从地图点位或卡片里锁定一处景点，再决定要不要继续查看详情。';
  }

  return activeItem.value.locationText
    ? `${activeItem.value.locationText} 已经落到地图里，右侧卡片会跟随当前选中的点位即时更新。`
    : '当前已锁定一处景点，右侧卡片会跟随地图点位即时更新。';
});

const createMarkerIcon = (isActive = false) =>
  L.divIcon({
    className: 'insight-marker',
    html: `
      <span class="marker-core${isActive ? ' marker-core-active' : ''}">
        <span class="marker-dot"></span>
      </span>
    `,
    iconSize: isActive ? [28, 28] : [22, 22],
    iconAnchor: isActive ? [14, 14] : [11, 11],
    popupAnchor: [0, -12]
  });

const createPopupContent = (item: AttractionCard) => {
  const root = document.createElement('div');
  root.className = 'popup-card';

  if (item.coverUrl) {
    const image = document.createElement('img');
    image.src = item.coverUrl;
    image.alt = item.name;
    image.className = 'popup-image';
    root.appendChild(image);
  }

  const body = document.createElement('div');
  body.className = 'popup-body';

  const title = document.createElement('strong');
  title.className = 'popup-title';
  title.textContent = item.name;
  body.appendChild(title);

  const meta = document.createElement('span');
  meta.className = 'popup-meta';
  meta.textContent = item.locationText || item.category?.name || '地图点位已定位';
  body.appendChild(meta);

  root.appendChild(body);
  return root;
};

const ensureMap = () => {
  if (mapInstance.value || !mapRef.value) return;

  mapInstance.value = L.map(mapRef.value, {
    zoomControl: true,
    attributionControl: true,
    minZoom: 3,
    maxZoom: 17,
    scrollWheelZoom: false
  }).setView([30, 110], 3);

  L.tileLayer(
    'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18
    }
  ).addTo(mapInstance.value);

  markersLayer.value = L.layerGroup().addTo(mapInstance.value);
};

const refreshMarkerState = (options: { flyTo?: boolean; openPopup?: boolean } = {}) => {
  markerMap.forEach((marker, id) => {
    marker.setIcon(createMarkerIcon(id === activeId.value));
    if (id !== activeId.value) {
      marker.closePopup();
    }
  });

  const activeMarker = markerMap.get(activeId.value);

  if (!activeMarker || !mapInstance.value) return;

  if (options.flyTo) {
    mapInstance.value.flyTo(activeMarker.getLatLng(), Math.max(mapInstance.value.getZoom(), 4), {
      animate: true,
      duration: 0.55
    });
  }

  if (options.openPopup) {
    activeMarker.openPopup();
  }
};

const renderMarkers = () => {
  if (!markersLayer.value || !mapInstance.value) return;

  markersLayer.value.clearLayers();
  markerMap.clear();

  mappedItems.value.forEach((item) => {
    if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return;

    const marker = L.marker([item.latitude, item.longitude], {
      icon: createMarkerIcon(item.id === activeId.value)
    });

    marker.bindTooltip(item.name, {
      direction: 'top',
      offset: [0, -12],
      opacity: 0.96,
      className: 'insight-tooltip'
    });

    marker.bindPopup(createPopupContent(item), {
      closeButton: false,
      autoPan: false,
      className: 'insight-popup',
      maxWidth: 260
    });

    marker.on('click', () => {
      activeId.value = item.id;
      refreshMarkerState({ flyTo: true, openPopup: true });
    });

    markerMap.set(item.id, marker);
    marker.addTo(markersLayer.value!);
  });

  const bounds = L.latLngBounds(
    mappedItems.value.map((item) => [item.latitude as number, item.longitude as number] as [number, number])
  );

  if (bounds.isValid()) {
    mapInstance.value.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 5
    });
  }

  refreshMarkerState({ openPopup: true });
};

const handleCardHover = (id: string) => {
  if (id === activeId.value) return;
  activeId.value = id;
  refreshMarkerState();
};

const handleCardSelect = (id: string) => {
  activeId.value = id;
  refreshMarkerState({ flyTo: true, openPopup: true });
};

const goToDetail = (id: string) => {
  router.push(`/attractions/${id}`);
};

const loadData = async () => {
  status.value = 'loading';
  errorMessage.value = '';

  try {
    const res = await getHotAttractions(8, { skipErrorToast: true });
    items.value = res.data.list || [];

    if (!mappedItems.value.length) {
      status.value = 'empty';
      return;
    }

    activeId.value = mappedItems.value[0].id;
    status.value = 'success';

    await nextTick();
    ensureMap();
    mapInstance.value?.invalidateSize();
    renderMarkers();
  } catch (error) {
    console.error('Failed to load global insight map', error);
    items.value = [];
    activeId.value = '';
    status.value = 'error';
    errorMessage.value = '当前无法加载首页地图探索内容，请稍后重试。';
  }
};

loadData();

onUnmounted(() => {
  markerMap.clear();
  markersLayer.value?.clearLayers();
  mapInstance.value?.remove();
  mapInstance.value = null;
  markersLayer.value = null;
});
</script>

<style scoped lang="scss">
$gold: #d4af37;

.global-insight {
  padding: 50px 24px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 14% 16%, rgba(34, 211, 238, 0.08), transparent 22%),
    radial-gradient(circle at 88% 18%, rgba(212, 175, 55, 0.1), transparent 20%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.84);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.map-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.subtitle,
.panel-eyebrow {
  margin: 0 0 10px;
  color: $gold;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
}

.title {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-10xl);
  line-height: 1.12;
  font-weight: var(--font-weight-display);
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.meta-chip,
.overlay-chip,
.card-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.meta-chip {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #475569;
}

.meta-chip-soft {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.18);
  color: #9a7313;
}

.state-shell,
.insight-grid {
  min-height: 600px;
}

.state-shell {
  display: grid;
  place-items: center;
}

.loading-shell {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  display: grid;
  gap: 22px;
}

.map-skeleton,
.panel-skeleton,
.skeleton-pill,
.skeleton-title,
.skeleton-line {
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0.78),
    rgba(241, 245, 249, 0.96),
    rgba(226, 232, 240, 0.78)
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.map-skeleton,
.panel-skeleton,
.state-card,
.map-stage,
.insight-panel {
  border-radius: 28px;
}

.map-skeleton {
  min-height: 600px;
}

.panel-skeleton {
  padding: 28px;
}

.skeleton-pill,
.skeleton-title,
.skeleton-line {
  display: block;
  border-radius: 999px;
}

.skeleton-pill {
  width: 132px;
  height: 34px;
}

.skeleton-title {
  width: 78%;
  height: 20px;
  margin-top: 22px;
}

.skeleton-line {
  height: 14px;
  margin-top: 16px;
}

.skeleton-line.medium {
  width: 82%;
}

.skeleton-line.long {
  width: 100%;
}

.skeleton-line.short {
  width: 58%;
}

.state-card {
  width: min(100%, 560px);
  padding: 40px 32px;
  text-align: center;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}

.state-badge {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.1);
  color: #9a7313;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.state-card h3 {
  margin: 18px 0 0;
  color: #111827;
  font-size: var(--font-size-7xl);
  line-height: 1.2;
  font-weight: var(--font-weight-title);
}

.state-card p {
  margin: 14px 0 0;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.8;
}

.state-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: 22px;
}

.map-stage,
.insight-panel {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.map-stage {
  min-height: 600px;
}

.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.map-overlay {
  position: absolute;
  left: 18px;
  right: 18px;
  top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  pointer-events: none;
}

.overlay-chip {
  max-width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.88);
  color: #0f172a;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.overlay-chip-soft {
  color: #475569;
}

.insight-panel {
  padding: 26px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-header h3 {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-7xl);
  line-height: 1.15;
  font-weight: var(--font-weight-title);
}

.panel-link {
  padding-right: 0;
  color: #9a7313;
  font-weight: var(--font-weight-bold);
}

.panel-description {
  margin: 14px 0 0;
  color: #475569;
  font-size: var(--font-size-md);
  line-height: 1.8;
}

.card-list {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.insight-card {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: 16px;
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.insight-card:hover,
.insight-card:focus-visible,
.insight-card.active {
  transform: translateY(-2px);
  border-color: rgba(212, 175, 55, 0.32);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
  outline: none;
}

.card-cover {
  position: relative;
  min-height: 132px;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 48%, #eef2ff 100%);
}

.card-cover img,
.card-cover-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-cover-fallback {
  background:
    radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.82), transparent 18%),
    linear-gradient(140deg, rgba(34, 211, 238, 0.22) 0%, rgba(212, 175, 55, 0.18) 48%, rgba(15, 23, 42, 0.14) 100%);
}

.card-badges {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-badge {
  min-height: 28px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.88);
  color: #475569;
}

.card-badge-strong {
  background: rgba(212, 175, 55, 0.18);
  color: #9a7313;
}

.card-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.card-head h4 {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-4xl);
  line-height: 1.2;
  font-weight: var(--font-weight-bold);
}

.card-location {
  display: inline-flex;
  margin-top: 8px;
  color: #64748b;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.card-summary {
  margin: 12px 0 0;
  color: #475569;
  font-size: var(--font-size-sm);
  line-height: 1.78;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.card-footer {
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-metric {
  color: #64748b;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.card-action {
  min-height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: #f8fafc;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    color 0.25s ease;
}

.card-action:hover {
  transform: translateY(-1px);
  background: #9a7313;
  color: #111827;
}

:deep(.leaflet-control-zoom a) {
  font-family: var(--font-family-sans);
}

:deep(.leaflet-control-attribution) {
  font-family: var(--font-family-sans);
  background: rgba(255, 255, 255, 0.86);
  color: #64748b;
}

:deep(.insight-tooltip) {
  background: rgba(15, 23, 42, 0.9);
  border: none;
  border-radius: 999px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.18);
  color: #f8fafc;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  padding: 0 2px;
}

:deep(.insight-tooltip::before) {
  border-top-color: rgba(15, 23, 42, 0.9);
}

:deep(.insight-popup .leaflet-popup-content-wrapper) {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(14px);
}

:deep(.insight-popup .leaflet-popup-content) {
  width: 240px !important;
  margin: 0;
  font-family: var(--font-family-sans);
}

:deep(.insight-popup .leaflet-popup-tip) {
  background: rgba(255, 255, 255, 0.96);
}

:deep(.popup-card) {
  overflow: hidden;
  border-radius: 18px;
}

:deep(.popup-image) {
  display: block;
  width: 100%;
  height: 128px;
  object-fit: cover;
}

:deep(.popup-body) {
  padding: 14px 16px 16px;
}

:deep(.popup-title) {
  display: block;
  color: #111827;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

:deep(.popup-meta) {
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

:deep(.insight-marker) {
  background: transparent;
  border: none;
}

:deep(.marker-core) {
  position: relative;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
}

:deep(.marker-core::before) {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.28);
}

:deep(.marker-dot) {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: $gold;
  box-shadow: 0 0 0 5px rgba(212, 175, 55, 0.18);
}

:deep(.marker-core-active) {
  background: rgba(255, 255, 255, 0.96);
}

:deep(.marker-core-active::before) {
  inset: -7px;
  border-color: rgba(34, 211, 238, 0.32);
}

:deep(.marker-core-active .marker-dot) {
  background: #22d3ee;
  box-shadow:
    0 0 0 6px rgba(34, 211, 238, 0.16),
    0 0 16px rgba(34, 211, 238, 0.4);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1080px) {
  .map-header,
  .insight-grid,
  .loading-shell {
    grid-template-columns: 1fr;
  }

  .map-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-meta {
    justify-content: flex-start;
  }
}

@media (max-width: 767px) {
  .global-insight {
    padding: 32px 16px;
    border-radius: 24px;
  }

  .title {
    font-size: var(--font-size-6xl);
  }

  .state-shell,
  .insight-grid,
  .map-stage,
  .map-canvas,
  .map-skeleton {
    min-height: 360px;
  }

  .map-stage,
  .insight-panel,
  .map-skeleton,
  .panel-skeleton,
  .state-card {
    border-radius: 22px;
  }

  .insight-panel,
  .panel-skeleton,
  .state-card {
    padding: 20px 18px;
  }

  .panel-header h3,
  .state-card h3 {
    font-size: var(--font-size-5xl);
  }

  .insight-card {
    grid-template-columns: 1fr;
  }

  .card-cover {
    min-height: 180px;
  }

  .card-head h4 {
    font-size: var(--font-size-3xl);
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .card-action {
    width: 100%;
  }
}
</style>
