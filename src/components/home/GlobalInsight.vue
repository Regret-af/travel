<template>
  <section class="global-insight">
    <div class="map-header">
      <p class="subtitle">灵感交互地图</p>
      <h2 class="title">Global Insight</h2>
    </div>
    <div ref="mapRef" class="map-container" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getFeaturedAttractions, type AttractionCard } from '@/api/attractions';

const mapRef = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;

const createPulseIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div class="pulse-marker">
        <span class="ping"></span>
        <span class="dot"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

const initMap = () => {
  if (!mapRef.value) return;
  map = L.map(mapRef.value, {
    zoomControl: true
  }).setView([20, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CartoDB</a>',
    maxZoom: 19
  }).addTo(map);
};

const addMarkers = (list: AttractionCard[]) => {
  if (!map) return;
  list.forEach((item) => {
    if (item.latitude == null || item.longitude == null) return;
    const marker = L.marker([item.latitude, item.longitude], { icon: createPulseIcon() });
    const popupHtml = `
      <div class="popup-card">
        <img src="${item.imageUrl || ''}" alt="${item.name}" />
        <div class="popup-info">
          <div class="name">${item.name}</div>
          <div class="meta">评分 ${item.rating ?? '—'}</div>
        </div>
      </div>
    `;
    marker.bindPopup(popupHtml, { className: 'insight-popup' }).addTo(map);
  });
};

const loadData = async () => {
  try {
    const res = await getFeaturedAttractions();
    const list = res?.data?.list || [];
    addMarkers(list);
  } catch (error) {
    console.error('Failed to load featured attractions for map', error);
  }
};

onMounted(() => {
  initMap();
  loadData();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped lang="scss">
$gold: #d4af37;

.global-insight {
  background: #0f172a;
  padding: 32px 24px;
  border-radius: 24px;
  color: #e5e7eb;

  .map-header {
    margin-bottom: 16px;

    .subtitle {
      color: $gold;
      font-size: 14px;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: #f8fafc;
    }
  }

  .map-container {
    height: 600px;
    border-radius: 24px;
    overflow: hidden;

    :deep(.leaflet-container) {
      background: #1a1a1a !important;
    }
  }
}

.pulse-marker {
  position: relative;
  width: 24px;
  height: 24px;

  .dot {
    position: absolute;
    inset: 6px;
    background: $gold;
    border-radius: 999px;
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.6);
  }

  .ping {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.3);
    animation: ping 1.6s infinite;
  }
}

@keyframes ping {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

:deep(.insight-popup) {
  background: transparent;
  border: none;

  .leaflet-popup-content-wrapper {
    background: rgba(15, 23, 42, 0.92);
    color: #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.35);
  }

  .leaflet-popup-content {
    margin: 0;
  }

  .leaflet-popup-tip {
    background: rgba(15, 23, 42, 0.92);
  }

  .popup-card {
    width: 220px;

    img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 12px 12px 0 0;
      display: block;
    }

    .popup-info {
      padding: 10px 12px 12px;

      .name {
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 4px;
      }

      .meta {
        color: $gold;
        font-size: 13px;
      }
    }
  }
}
</style>
