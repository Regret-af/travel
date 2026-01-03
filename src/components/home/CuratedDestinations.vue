<template>
  <section class="curated-section" v-loading="loading">
    <div class="header">
      <p class="subtitle">探索高评分的绝佳去处</p>
      <h2 class="title">精选目的地</h2>
    </div>
    <div class="grid">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="grid-item"
        :class="spanClass(index)"
      >
        <AttractionCard :item="item" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AttractionCard from '@/components/attraction/AttractionCard.vue';
import { getTopRatedAttractions, type AttractionCard as AttractionCardType } from '@/api/attractions';

const items = ref<AttractionCardType[]>([]);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getTopRatedAttractions(6);
    items.value = res?.data?.list || [];
  } catch (error) {
    console.error('Failed to load curated destinations', error);
  } finally {
    loading.value = false;
  }
};

const spanClass = (index: number) => {
  if (index === 0 || index === 3) return 'span-2';
  return '';
};

onMounted(() => {
  fetchData();
});
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
      grid-auto-rows: auto;

      .grid-item {
        &.span-2 {
          grid-row: span 1;
        }
      }
    }
  }
}
</style>
