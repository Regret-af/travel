<template>
  <section class="global-insight">
    <div class="map-header">
      <p class="subtitle">灵感交互地图</p>
      <h2 class="title">Global Insight</h2>
    </div>

    <div class="map-container">
      <div class="empty-panel">
        <span class="badge">安全降级</span>
        <h3>当前景点接口未提供地图坐标</h3>
        <p>
          首页已保留全球洞察模块结构，但地图点位与点位跳转暂不展示。
          你仍可前往景点列表查看全部景点，并进入详情页。
        </p>
        <el-button type="primary" round class="cta-btn" @click="router.push('/attractions')">
          查看景点列表
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
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
    width: 100%;
    min-height: 600px;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.2), transparent 30%),
      radial-gradient(circle at 80% 25%, rgba(99, 102, 241, 0.18), transparent 32%),
      linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #eef2ff 100%);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-panel {
    max-width: 460px;
    padding: 34px 30px;
    border-radius: 28px;
    text-align: center;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(14px);
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12);

    .badge {
      display: inline-flex;
      margin-bottom: 16px;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(212, 175, 55, 0.12);
      color: $gold;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    h3 {
      margin: 0 0 12px;
      color: #111827;
      font-size: 28px;
      font-weight: 800;
    }

    p {
      margin: 0;
      color: #4b5563;
      line-height: 1.8;
    }

    .cta-btn {
      margin-top: 24px;
      min-width: 160px;
    }
  }
}

@media (max-width: 1024px) {
  .global-insight {
    padding: 40px 20px;

    .map-container {
      min-height: 480px;
      border-radius: 20px;
    }
  }
}

@media (max-width: 640px) {
  .global-insight {
    padding: 32px 16px;

    .map-header .title {
      font-size: 26px;
    }

    .map-container {
      min-height: 360px;
      border-radius: 18px;
    }

    .empty-panel {
      padding: 28px 20px;

      h3 {
        font-size: 22px;
      }
    }
  }
}
</style>
