<template>
  <section class="curated-section" v-loading="loading">
    <div class="header">
      <div class="home-section-heading">
        <p class="home-section-eyebrow">景点</p>
        <h2 class="home-section-title">近期热门推荐</h2>
      </div>
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
      <h3>景点内容加载失败</h3>
      <p>{{ loadError }}</p>
      <el-button round @click="fetchData">重新加载</el-button>
    </div>

    <div v-else-if="!loading" class="state-card">
      <h3>暂无景点内容</h3>
      <p>当前暂无可展示的景点内容，你可以稍后再来查看。</p>
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
    const res = await getHotAttractions(6, { skipErrorToast: true });
    items.value = res?.data?.list || [];
  } catch (error) {
    console.error('Failed to load curated destinations', error);
    items.value = [];
    loadError.value = '当前无法获取景点内容，请稍后重试。';
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
      font-size: var(--font-size-5xl);
      font-weight: var(--font-weight-bold);
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
