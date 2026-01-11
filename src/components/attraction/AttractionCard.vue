<template>
  <div class="attraction-card">
    <div class="image-box">
      <img :src="item.imageUrl ? `${item.imageUrl}/webp_low` : ''" :alt="item.name" />
      <div class="tags" v-if="item.tags?.length">
        <el-tag
          v-for="tag in item.tags"
          :key="tag"
          size="small"
          effect="dark"
          type="info"
        >
          {{ tag }}
        </el-tag>
      </div>
      <div class="info-overlay">
        <div class="title">{{ item.name }}</div>
        <div class="meta">
          <span class="location">{{ item.location }}</span>
          <span class="price">{{ priceSymbol }}</span>
        </div>
        <div class="rate-box">
          <el-rate
            v-model="rateValue"
            disabled
            :colors="[gold, gold, gold]"
            void-color="#cbd5e1"
            disabled-void-color="#cbd5e1"
            allow-half
            :texts="[]"
            show-score
            score-template="{value}"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AttractionCard } from '@/api/attractions';

const props = defineProps<{
  item: AttractionCard;
}>();

const gold = '#D4AF37';
const rateValue = ref(props.item.rating || 0);

const priceSymbol = computed(() => {
  const level = props.item.priceLevel || 1;
  return '￥'.repeat(Math.min(Math.max(level, 1), 4));
});
</script>

<style scoped lang="scss">
$gold: #D4AF37;

.attraction-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);

  .image-box {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1);
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .tags {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      gap: 8px;

      :deep(.el-tag) {
        background: rgba(0, 0, 0, 0.48);
        border: none;
        color: #f8fafc;
        backdrop-filter: blur(4px);
      }
    }

    .info-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 16px;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%);
      color: #f8fafc;
      transform: translateY(100%);
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);

      .title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
      }

      .rate-box {
        display: flex;
        align-items: center;
        gap: 6px;

        :deep(.el-rate__icon) {
          margin-right: 2px;
        }

        :deep(.el-rate__text) {
          color: $gold;
          font-weight: 600;
          margin-left: 6px;
        }
      }
    }
  }

  &:hover {
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.16);

    .image-box img {
      transform: scale(1.1);
    }

    .info-overlay {
      transform: translateY(0);
    }
  }
}
</style>
