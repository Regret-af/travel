<template>
  <div class="attraction-detail-page" v-loading="loading">
    <template v-if="detail && !errorMessage">
      <section class="hero-card">
        <div class="cover-wrap">
          <img v-if="detail.coverUrl" :src="detail.coverUrl" :alt="detail.name" />
          <div v-else class="cover-fallback" />

          <div class="cover-overlay">
            <div class="badge-row">
              <span v-if="detail.category?.name" class="badge">{{ detail.category.name }}</span>
              <span v-if="detail.locationText" class="badge ghost">{{ detail.locationText }}</span>
            </div>

            <div class="hero-copy">
              <p class="eyebrow">景点详情</p>
              <h1>{{ detail.name }}</h1>
              <p v-if="detail.summary" class="summary">
                {{ detail.summary }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <article class="content-card">
          <div class="section-head">
            <p class="section-subtitle">景点介绍</p>
            <h2>真实内容展示</h2>
          </div>

          <p v-if="detail.summary" class="lead">{{ detail.summary }}</p>
          <div v-if="detail.description" class="body-text">{{ detail.description }}</div>
          <div v-else class="body-empty">
            当前接口暂未提供更详细的景点正文内容。
          </div>
        </article>

        <aside class="meta-panel">
          <div class="meta-card">
            <p class="meta-label">地点</p>
            <p class="meta-value">{{ detail.locationText || '待补充' }}</p>
          </div>

          <div class="meta-card">
            <p class="meta-label">浏览量</p>
            <p class="meta-value">{{ viewCountText }}</p>
          </div>

          <div class="meta-card">
            <p class="meta-label">创建时间</p>
            <p class="meta-value">{{ detail.createdAt || '待补充' }}</p>
          </div>

          <div class="meta-card">
            <p class="meta-label">更新时间</p>
            <p class="meta-value">{{ detail.updatedAt || '待补充' }}</p>
          </div>

          <div class="action-card">
            <h3>继续探索更多景点</h3>
            <p>返回景点列表，继续浏览其他目的地与分类内容。</p>
            <el-button type="primary" round @click="router.push('/attractions')">
              返回景点列表
            </el-button>
          </div>
        </aside>
      </section>
    </template>

    <section v-else-if="!loading" class="empty-shell">
      <div class="empty-card">
        <p class="eyebrow">景点详情</p>
        <h2>{{ errorTitle }}</h2>
        <p>{{ errorDescription }}</p>
        <el-button type="primary" round @click="router.push('/attractions')">
          返回景点列表
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAttractionDetail, type AttractionDetail } from '@/api/attractions';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const detail = ref<AttractionDetail | null>(null);
const errorMessage = ref('');

const viewCountText = computed(() =>
  typeof detail.value?.viewCount === 'number' ? `${detail.value.viewCount} 次浏览` : '待补充'
);

const errorTitle = computed(() => (errorMessage.value ? '景点详情加载失败' : '未找到对应景点'));
const errorDescription = computed(() =>
  errorMessage.value || '该景点可能不存在，或当前无法从接口获取到详情数据。'
);

const fetchDetail = async (id: string | string[] | undefined) => {
  const attractionId = Array.isArray(id) ? id[0] : id;
  if (!attractionId) {
    detail.value = null;
    errorMessage.value = '';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await getAttractionDetail(attractionId);
    detail.value = res.data || null;
  } catch (error) {
    console.error('Failed to load attraction detail', error);
    detail.value = null;
    errorMessage.value = '当前无法获取景点详情，请稍后重试。';
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.params.id,
  (id) => {
    fetchDetail(id);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.attraction-detail-page {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: #111827;
}

.hero-card {
  border-radius: 32px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);

  .cover-wrap {
    position: relative;
    min-height: 520px;
    background: linear-gradient(135deg, #dbeafe 0%, #eef2ff 100%);

    img,
    .cover-fallback {
      width: 100%;
      min-height: 520px;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .cover-fallback {
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.18) 0%, rgba(15, 23, 42, 0.08) 100%),
        linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);
    }

    .cover-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 28px;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%);
      color: #ffffff;
    }

    .badge-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(10px);
      font-size: 13px;
      font-weight: 600;

      &.ghost {
        background: rgba(255, 255, 255, 0.14);
      }
    }

    .hero-copy {
      max-width: 760px;
    }

    .eyebrow {
      margin: 0 0 14px;
      color: #f4d27a;
      letter-spacing: 0.14em;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 56px;
      line-height: 1.05;
      font-weight: 800;
    }

    .summary {
      margin: 18px 0 0;
      font-size: 16px;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.86);
      max-width: 640px;
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 24px;
}

.content-card,
.meta-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-card {
  padding: 34px 32px;
  border-radius: 28px;
  background: #fafafa;

  .section-head {
    margin-bottom: 4px;

    .section-subtitle {
      margin: 0 0 8px;
      color: #d4af37;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
    }
  }

  .lead {
    margin: 0;
    color: #374151;
    line-height: 1.9;
    font-size: 18px;
  }

  .body-text {
    color: #4b5563;
    line-height: 2;
    white-space: pre-line;
    font-size: 15px;
  }

  .body-empty {
    padding: 22px 20px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.9);
    color: #6b7280;
    line-height: 1.8;
  }
}

.meta-card,
.action-card {
  padding: 22px 20px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.meta-card {
  .meta-label {
    margin: 0 0 10px;
    color: #d4af37;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .meta-value {
    margin: 0;
    color: #111827;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.6;
  }
}

.action-card {
  h3 {
    margin: 0 0 10px;
    font-size: 24px;
    color: #111827;
  }

  p {
    margin: 0 0 18px;
    color: #6b7280;
    line-height: 1.8;
  }
}

.empty-shell {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-card {
  max-width: 520px;
  padding: 40px 32px;
  border-radius: 32px;
  text-align: center;
  background: #fafafa;

  .eyebrow {
    margin: 0 0 10px;
    color: #d4af37;
    letter-spacing: 0.14em;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font-size: 34px;
    color: #111827;
  }

  p {
    margin: 16px 0 24px;
    color: #6b7280;
    line-height: 1.8;
  }
}

@media (max-width: 1024px) {
  .hero-card .cover-wrap {
    min-height: 420px;

    img,
    .cover-fallback {
      min-height: 420px;
    }

    h1 {
      font-size: 42px;
    }
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .attraction-detail-page {
    gap: 24px;
  }

  .hero-card {
    border-radius: 24px;

    .cover-wrap {
      min-height: 320px;

      img,
      .cover-fallback {
        min-height: 320px;
      }

      .cover-overlay {
        padding: 20px 18px;
      }

      h1 {
        font-size: 32px;
      }
    }
  }

  .content-card {
    padding: 26px 20px;
    border-radius: 22px;

    .section-head h2 {
      font-size: 26px;
    }
  }

  .empty-card {
    padding: 32px 20px;
    border-radius: 24px;

    h2 {
      font-size: 28px;
    }
  }
}
</style>
