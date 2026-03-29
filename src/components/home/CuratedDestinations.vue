<template>
  <section class="curated-section" v-loading="loading">
    <div class="header">
      <p class="subtitle">探索近期热门景点</p>
      <h2 class="title">精选景点</h2>
    </div>

    <div v-if="items.length" class="grid">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="grid-item"
        :class="spanClass(index)"
      >
        <AttractionCard :item="item" :to="`/attractions/${item.id}`" />
      </div>
    </div>

    <div v-else-if="loadError && !loading" class="state-card">
      <h3>推荐景点加载失败</h3>
      <p>{{ loadError }}</p>
      <el-button round @click="fetchData">重新加载</el-button>
    </div>

    <div v-else-if="!loading" class="state-card">
      <h3>暂无精选推荐</h3>
      <p>当前暂无可展示的首页精选景点，你可以稍后再来查看。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AttractionCard from '@/components/attraction/AttractionCard.vue';
import { getHotAttractions, type AttractionCard as AttractionCardType } from '@/api/attractions';

const items = ref<AttractionCardType[]>([]);
const loading = ref(false);
const loadError = ref('');

const fetchData = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await getHotAttractions(6);
    items.value = res?.data?.list || [];
  } catch (error) {
    console.error('Failed to load curated destinations', error);
    items.value = [];
    loadError.value = '当前无法获取首页精选景点，请稍后重试。';
  } finally {
    loading.value = false;
  }
};

const spanClass = (index: number) => {
  if (index === 0 || index === 3) return 'span-2';
  return '';
};

onMounted(fetchData);
</script>

<style scoped lang="scss">
.curated-section {
  background: #fafafa;
  padding: 48px 24px;
  border-radius: 24px;

  .header {
    margin-bottom: 24px;

    .subtitle {
      color: #d4af37;
      font-size: 14px;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }

    .title {
      color: #1a1a1a;
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    grid-auto-rows: 240px;

    .grid-item {
      height: 100%;

      &.span-2 {
        grid-row: span 2;
      }

      :deep(.attraction-card) {
        height: 100%;
      }
    }
  }

  .state-card {
    padding: 48px 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.8);
    text-align: center;
    color: #6b7280;

    h3 {
      margin: 0 0 10px;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
    }

    p {
      margin: 0 0 20px;
      line-height: 1.7;
    }
  }
}

@media (max-width: 1024px) {
  .curated-section {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 640px) {
  .curated-section {
    padding: 32px 16px;

    .header {
      .title {
        font-size: 26px;
      }
    }

    .grid {
      grid-template-columns: 1fr;
      grid-auto-rows: 260px;

      .grid-item {
        height: 260px;

        &.span-2 {
          grid-row: span 1;
        }
      }
    }
  }
}
</style>
