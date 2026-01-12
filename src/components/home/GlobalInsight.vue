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
const closeTimers = new WeakMap<L.Marker, number | undefined>();

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
    popupAnchor: [0, -5]
  });

const initMap = () => {
  if (!mapRef.value) return;

  mapInstance.value = L.map(mapRef.value, {
    zoomControl: true,
    attributionControl: false,
    dragging: !L.Browser.mobile
  }).setView([30, 110], 3);

  L.tileLayer('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
    minZoom: 3,
    opacity: 0.85
  }).addTo(mapInstance.value);
};

const addMarkers = (list: AttractionCard[]) => {
  if (!mapInstance.value) return;

  list.forEach((item) => {
    if (item.latitude == null || item.longitude == null) return;

    const marker = L.marker([item.latitude, item.longitude], {
      icon: createPulseIcon()
    });

    // <img src="${item.imageUrl ? `${item.imageUrl}/webp_low` : ''}" alt="${item.name}" />
    const popupHtml = `
      <div class="popup-card" data-id="${item.id}">
        <div class="img-wrapper">
          <img src="${item.imageUrl || ''}" alt="${item.name}" />
        </div>
        <div class="popup-info">
          <div class="name">${item.name}</div>
          <div class="meta">
            <span class="loc">${item.location || '未知地点'}</span>
            <span class="rating">★ ${item.rating ?? '5.0'}</span>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, {
      className: 'insight-popup',
      maxWidth: 240,
      closeButton: false,
      autoPan: false
    });

    const clearTimer = (m: L.Marker) => {
      const timer = closeTimers.get(m);
      if (timer) {
        clearTimeout(timer);
        closeTimers.set(m, undefined);
      }
    };

    marker.on('mouseover', function (this: L.Marker) {
      clearTimer(this);
      this.openPopup();
    });

    marker.on('mouseout', function (this: L.Marker) {
      const timer = window.setTimeout(() => this.closePopup(), 300);
      closeTimers.set(this, timer);
    });

    marker.on('popupopen', function (this: L.Marker) {
      const popupEl = this.getPopup()?.getElement();
      if (!popupEl) return;

      popupEl.addEventListener('mouseenter', () => clearTimer(this));
      popupEl.addEventListener('mouseleave', () => {
        const timer = window.setTimeout(() => this.closePopup(), 300);
        closeTimers.set(this, timer);
      });

      const imgWrapper = popupEl.querySelector('.img-wrapper') as HTMLElement | null;

      if (imgWrapper) {
        imgWrapper.addEventListener('click', (e) => {
          e.stopPropagation();

          const card = imgWrapper.closest('.popup-card') as HTMLElement | null;
          const id = card?.dataset.id;

          if (id) {
            window.location.href = `/attractions/${id}`;
          }
        });

        imgWrapper.style.cursor = 'pointer';
      }
    });

    marker.addTo(mapInstance.value!);
  });
};

const loadData = async () => {
  try {
    const res = await getTopRatedAttractions(12);
    const list = res?.data?.list || [];
    addMarkers(list);
  } catch (error) {
    console.error('地图数据加载失败', error);
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
$bg-soft: #fcfcfd;
$text-main: #2c3e50;

.global-insight {
  background: $bg-soft;
  padding: 50px 24px;
  border-radius: 30px;

  .map-header {
    margin-bottom: 35px;
    text-align: center;

    .subtitle {
      color: $gold;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 5px;
      margin-bottom: 10px;
    }

    .title {
      font-size: 34px;
      color: $text-main;
      font-weight: 800;
      font-family: 'PingFang SC', 'Hiragino Sans GB', sans-serif;
    }
  }

  .map-container {
    height: 600px;
    border-radius: 24px;
    background: #f0f2f5;
    z-index: 1;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.05);
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
      width: 10px;
      height: 10px;
      background: $gold;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
    }

    .ping {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(212, 175, 55, 0.4);
      border-radius: 50%;
      animation: map-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  }
}

@keyframes map-ping {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }

  100% {
    transform: scale(3.5);
    opacity: 0;
  }
}

:deep(.insight-popup) {
  // pointer-events: none;

  .leaflet-popup-content-wrapper {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(15px);
    border-radius: 18px;
    padding: 0;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }

  .leaflet-popup-content {
    margin: 0 !important;
    width: 240px !important;
  }

  .popup-card {
    .img-wrapper {
      height: 135px;
      border-radius: 18px 18px 0 0;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .popup-info {
      padding: 18px;

      .name {
        color: #1a1a1a;
        font-weight: 700;
        margin-bottom: 6px;
        font-size: 18px;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        color: #7f8c8d;
        font-size: 13px;

        .rating {
          color: $gold;
          font-weight: bold;
        }
      }
    }
  }

  .leaflet-popup-tip {
    background: rgba(255, 255, 255, 0.95);
  }
}
</style>
