export interface BaiduMapPoint {
  lng: number;
  lat: number;
}

export interface BaiduMapMap {
  centerAndZoom(point: BaiduMapPoint | string, zoom: number): void;
  addOverlay(overlay: unknown): void;
  clearOverlays(): void;
  enableScrollWheelZoom(enabled?: boolean): void;
  addControl(control: unknown): void;
}

export interface BaiduMapGeocoder {
  getPoint(
    address: string,
    callback: (point: BaiduMapPoint | null) => void,
    city?: string
  ): void;
}

export interface BaiduMapNamespace {
  Map: new (container: string | HTMLElement) => BaiduMapMap;
  Point: new (lng: number, lat: number) => BaiduMapPoint;
  Size: new (width: number, height: number) => unknown;
  Icon: new (imageUrl: string, size: unknown, options?: Record<string, unknown>) => unknown;
  Marker: new (point: BaiduMapPoint, options?: Record<string, unknown>) => unknown;
  NavigationControl: new () => unknown;
  ScaleControl: new () => unknown;
  Geocoder: new () => BaiduMapGeocoder;
}

declare global {
  interface Window {
    BMap?: BaiduMapNamespace;
    [key: string]: unknown;
  }
}

let baiduMapLoader: Promise<BaiduMapNamespace> | null = null;

export function loadBaiduMapSdk(ak: string) {
  if (window.BMap) {
    return Promise.resolve(window.BMap);
  }

  if (baiduMapLoader) {
    return baiduMapLoader;
  }

  baiduMapLoader = new Promise((resolve, reject) => {
    const callbackName = `__baiduMapReady_${Date.now()}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete window[callbackName];
    };

    window[callbackName] = () => {
      cleanup();

      if (window.BMap) {
        resolve(window.BMap);
        return;
      }

      baiduMapLoader = null;
      reject(new Error('百度地图 SDK 已加载，但 BMap 对象不可用'));
    };

    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${encodeURIComponent(ak)}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      baiduMapLoader = null;
      reject(new Error('百度地图 SDK 加载失败'));
    };

    document.head.appendChild(script);
  });

  return baiduMapLoader;
}
