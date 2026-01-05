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
import { onMounted, onUnmounted, shallowRef } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTopRatedAttractions, type AttractionCard } from '@/api/attractions';

const mapRef = shallowRef<HTMLDivElement | null>(null);
const mapInstance = shallowRef<L.Map | null>(null);

const createPulseIcon = () =>
  L.divIcon({
    className: 'custom-pulse-container',
    html: `
      <div class="pulse-marker">
        <div class="ping"></div>
        <div class="dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

const initMap = () => {
  if (!mapRef.value) return;
  
  mapInstance.value = L.map(mapRef.value, {
    zoomControl: true,
    attributionControl: false,
    scrollWheelZoom: false, // 禁止滚动缩放防止首页误触
    dragging: !L.Browser.mobile // 移动端禁用拖拽提升滚动体验
  }).setView([20, 10], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18
  }).addTo(mapInstance.value);
};

const addMarkers = (list: AttractionCard[]) => {
  if (!mapInstance.value) return;
  
  list.forEach((item) => {
    if (item.latitude == null || item.longitude == null) return;

    const marker = L.marker([item.latitude, item.longitude], { 
      icon: createPulseIcon() 
    });
    
    const popupHtml = `
      <div class="popup-card">
        <div class="img-wrapper">
          <img src="${item.imageUrl || ''}" alt="${item.name}" />
        </div>
        <div class="popup-info">
          <div class="name">${item.name}</div>
          <div class="meta">
            <span class="loc">${item.location || ''}</span>
            <span class="rating">★ ${item.rating ?? '5.0'}</span>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { 
      className: 'insight-popup',
      maxWidth: 220,
      closeButton: false,
      autoPan: false
    });

    marker.on('mouseover', function() {
      this.openPopup();
    });

    marker.on('mouseout', function() {
      this.closePopup();
    });

    marker.addTo(mapInstance.value!);
  });
};

const loadData = async () => {
  try {
    const res = await getTopRatedAttractions(15);
    const list = res?.data?.list || [];
    addMarkers(list);
  } catch (error) {
    console.error('Map points loading failed', error);
  }
};

onMounted(() => {
  initMap();
  loadData();
});

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.remove();
  }
});
</script>

<style scoped lang="scss">
$gold: #d4af37;

.global-insight {
  background: #0f172a;
  padding: 40px 24px;
  border-radius: 24px;
  margin: 20px 0;

  .map-header {
    margin-bottom: 24px;
    .subtitle { color: $gold; font-size: 14px; letter-spacing: 2px; }
    .title { font-size: 32px; color: #fff; font-weight: 800; font-family: serif; }
  }

  .map-container {
    height: 550px;
    border-radius: 20px;
    background: #1a1a1a;
    z-index: 1;
  }
}

:deep(.custom-pulse-container) {
  background: transparent !important;
  border: none !important;

  .pulse-marker {
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    .dot {
      width: 8px;
      height: 8px;
      background: $gold;
      border-radius: 50%;
      box-shadow: 0 0 10px $gold;
    }

    .ping {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(212, 175, 55, 0.4);
      border-radius: 50%;
      animation: map-ping 1.5s ease-out infinite;
    }
  }
}

@keyframes map-ping {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

:deep(.insight-popup) {
  pointer-events: none;
  
  .leaflet-popup-content-wrapper {
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
  }

  .leaflet-popup-content {
    margin: 0 !important;
    width: 220px !important;
  }

  .popup-card {
    .img-wrapper {
      height: 110px;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .popup-info {
      padding: 12px;
      .name { color: #fff; font-weight: 600; margin-bottom: 4px; }
      .meta { 
        display: flex; justify-content: space-between;
        color: rgba(255,255,255,0.6); font-size: 12px;
        .rating { color: $gold; }
      }
    }
  }

  .leaflet-popup-tip { background: rgba(15, 23, 42, 0.9); }
}
</style>