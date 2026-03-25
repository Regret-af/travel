<template>
  <article
    class="attraction-card"
    :class="{ clickable: Boolean(to) }"
    @click="handleClick"
  >
    <div class="image-box">
      <img v-if="imageSrc" :src="imageSrc" :alt="item.name" />
      <div v-else class="image-fallback" />

      <div class="category-badges" v-if="categoryBadges.length">
        <el-tag
          v-for="badge in categoryBadges"
          :key="badge"
          size="small"
          effect="dark"
          type="info"
        >
          {{ badge }}
        </el-tag>
      </div>

      <div class="info-overlay">
        <div class="title">{{ item.name }}</div>
        <div class="meta" v-if="item.locationText || hasViewCount">
          <span class="location">{{ item.locationText || '地点待补充' }}</span>
          <span v-if="hasViewCount" class="views">{{ viewText }}</span>
        </div>
        <p v-if="summaryText" class="summary">{{ summaryText }}</p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { AttractionCard } from '@/api/attractions';

const props = defineProps<{
  item: AttractionCard;
  to?: string;
}>();

const router = useRouter();

const imageSrc = computed(() => props.item.coverUrl || props.item.imageUrl || '');
const summaryText = computed(() => props.item.summary?.trim() || props.item.description?.trim() || '');
const categoryBadges = computed(() => (props.item.category?.name ? [props.item.category.name] : []));
const hasViewCount = computed(() => typeof props.item.viewCount === 'number');
const viewText = computed(() => `${props.item.viewCount ?? 0} 浏览`);

const handleClick = () => {
  if (!props.to) return;
  router.push(props.to);
};
</script>

<style scoped lang="scss">
.attraction-card {
  position: relative;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  transition: transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s cubic-bezier(0.25, 1, 0.5, 1);

  &.clickable {
    cursor: pointer;
  }

  .image-box {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(160deg, #dcecff 0%, #eef2ff 50%, #f7f7f7 100%);

    img,
    .image-fallback {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1);
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .image-fallback {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(15, 23, 42, 0.18) 100%),
        linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);
    }

    .category-badges {
      position: absolute;
      top: 14px;
      left: 14px;
      display: flex;
      gap: 8px;

      :deep(.el-tag) {
        background: rgba(15, 23, 42, 0.48);
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
      padding: 18px;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(15, 23, 42, 0.78) 100%);
      color: #f8fafc;
      transform: translateY(calc(100% - 72px));
      transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);

      .title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.82);
        margin-bottom: 10px;

        .location,
        .views {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .summary {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.82);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  &:hover {
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
    transform: translateY(-6px);

    .image-box {
      img,
      .image-fallback {
        transform: scale(1.08);
      }
    }

    .info-overlay {
      transform: translateY(0);
    }
  }
}

@media (max-width: 640px) {
  .attraction-card {
    border-radius: 20px;

    .image-box {
      .info-overlay {
        transform: translateY(0);
        padding: 16px;

        .title {
          font-size: 18px;
        }
      }
    }
  }
}
</style>
