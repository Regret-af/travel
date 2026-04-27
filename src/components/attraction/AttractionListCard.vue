<template>
  <article
    class="attraction-list-card"
    role="link"
    tabindex="0"
    @click="goToDetail"
    @keyup.enter="goToDetail"
    @keyup.space.prevent="goToDetail"
  >
    <div class="card-image">
      <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.name" />
      <div v-else class="image-fallback" />
    </div>

    <div class="card-content">
      <div class="card-meta">
        <span v-if="item.category?.name" class="card-badge">{{ item.category.name }}</span>
      </div>

      <h3 :title="item.name">{{ item.name }}</h3>
      <p v-if="item.summary" :title="item.summary">{{ item.summary }}</p>

      <div class="card-footer">
        <span v-if="item.locationText" class="location-line">
          <el-icon><Location /></el-icon>
          {{ item.locationText }}
        </span>
        <span v-if="typeof item.viewCount === 'number'" class="view-line">
          <el-icon><View /></el-icon>
          {{ formatCountStat(item.viewCount) }}
        </span>
        <span class="detail-link">查看详情</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Location, View } from '@element-plus/icons-vue';
import type { AttractionCard } from '@/api/attractions';
import { formatCountStat } from '@/utils/formatters';

const props = defineProps<{
  item: AttractionCard;
}>();

const router = useRouter();

const goToDetail = () => {
  router.push(`/attractions/${props.item.id}`);
};
</script>

<style scoped lang="scss">
.attraction-list-card {
  display: flex;
  min-width: 0;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  flex-direction: column;
  border-radius: 24px;
  background: var(--color-surface-soft);
  border: 1px solid rgba(226, 232, 240, 0.72);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.32s ease,
    box-shadow 0.32s ease,
    border-color 0.32s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    border-color: rgba(0, 91, 173, 0.24);
    box-shadow: 0 18px 46px rgba(15, 23, 42, 0.1);
    outline: none;

    .card-image img,
    .image-fallback {
      transform: scale(1.05);
    }
  }
}

.card-image {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);

  img,
  .image-fallback {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s ease;
  }
}

.image-fallback {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(15, 23, 42, 0.12)),
    linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);
}

.card-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 30px;
}

.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 30px;
  margin-bottom: 16px;
}

.card-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 30px;
  padding: 0 13px;
  border-radius: var(--radius-chip);
  background: rgba(0, 91, 173, 0.12);
  color: #005bad;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-4xl);
  line-height: 1.28;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
}

p {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.82;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px 20px;
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.72);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.location-line,
.view-line {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.location-line {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.view-line {
  flex-shrink: 0;
}

.detail-link {
  margin-left: auto;
  color: #005bad;
  font-weight: var(--font-weight-bold);
}

@media (max-width: 767px) {
  .attraction-list-card {
    border-radius: 22px;
  }

  .card-content {
    padding: 24px 22px;
  }

  h3 {
    font-size: var(--font-size-5xl);
  }

  .card-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .detail-link {
    margin-left: 0;
  }
}
</style>
