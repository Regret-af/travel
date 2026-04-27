<template>
  <RouterLink :to="`/diaries/${item.id}`" class="diary-card">
    <div class="cover-shell">
      <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" class="cover-image" />
      <div v-else class="cover-fallback" />
    </div>

    <article class="content-shell">
      <h2 class="diary-title" :title="item.title">{{ item.title }}</h2>
      <p class="diary-summary" :title="summaryText">{{ summaryText }}</p>

      <div class="card-footer">
        <div class="author-meta">
          <el-avatar :size="34" :src="item.author?.avatarUrl" class="author-avatar">
            {{ authorInitial }}
          </el-avatar>
          <div class="author-copy">
            <p class="author-name">{{ authorName }}</p>
            <span v-if="publishedLabel" class="publish-time">{{ publishedLabel }}</span>
          </div>
        </div>

        <div class="metric-row" aria-label="日记内容指标">
          <span class="metric-item">
            <el-icon><View /></el-icon>
            {{ formatCountStat(item.viewCount) }}
          </span>
          <span class="metric-item">
            <el-icon><Star /></el-icon>
            {{ formatCountStat(item.likeCount) }}
          </span>
        </div>
      </div>
    </article>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { Star, View } from '@element-plus/icons-vue';
import type { DiaryCard } from '@/api/diaries';
import { formatCountStat, formatDate } from '@/utils/formatters';

const props = defineProps<{
  item: DiaryCard;
}>();

const publishedLabel = computed(() => formatDate(props.item.publishedAt));
const authorName = computed(() => props.item.author?.nickname || '旅行者');
const authorInitial = computed(() => authorName.value.trim().slice(0, 1).toUpperCase() || '旅');
const summaryText = computed(() => {
  const value = props.item.summary?.trim();

  if (!value) return '这篇旅行日记暂时没有摘要，点击继续翻阅完整的沿途记录。';

  return value;
});
</script>

<style scoped lang="scss">
.diary-card {
  position: relative;
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-card);
  background: var(--color-surface-soft);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  transition:
    transform 0.45s ease,
    border-color 0.45s ease,
    box-shadow 0.45s ease;

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(0, 91, 173, 0.18);
    box-shadow: 0 20px 44px rgba(15, 23, 42, 0.09);

    .cover-image,
    .cover-fallback {
      transform: scale(1.08);
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 4px rgba(0, 91, 173, 0.14),
      0 20px 44px rgba(15, 23, 42, 0.09);
  }
}

.cover-shell {
  position: relative;
  height: 288px;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 48%, #eef2ff 100%);
}

.cover-image,
.cover-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.75s ease;
}

.cover-fallback {
  background:
    radial-gradient(circle at 24% 22%, rgba(255, 255, 255, 0.86), transparent 18%),
    linear-gradient(140deg, rgba(34, 211, 238, 0.22) 0%, rgba(212, 175, 55, 0.18) 46%, rgba(0, 91, 173, 0.16) 100%);
}

.content-shell {
  display: flex;
  min-height: 300px;
  flex: 1;
  flex-direction: column;
  padding: 30px 30px 28px;
}

.diary-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-7xl);
  font-weight: var(--font-weight-semibold);
  line-height: 1.25;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.diary-summary {
  margin: 14px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.86);
}

.author-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  flex-shrink: 0;
  background: var(--color-brand-primary);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.author-copy {
  min-width: 0;
}

.author-name {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publish-time {
  display: block;
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.metric-row {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 14px;
  color: var(--color-text-muted);
}

.metric-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  line-height: 1.4;

  :deep(.el-icon) {
    color: currentColor;
    font-size: var(--font-size-sm);
  }
}

@media (max-width: 1100px) {
  .cover-shell {
    height: 260px;
  }
}

@media (max-width: 767px) {
  .diary-card {
    border-radius: 20px;

    &:hover {
      transform: none;
    }
  }

  .cover-shell {
    height: 230px;
  }

  .content-shell {
    min-height: 260px;
    padding: 24px 22px 22px;
  }

  .card-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .diary-title {
    font-size: var(--font-size-5xl);
  }

  .diary-summary {
    font-size: var(--font-size-md);
  }

  .metric-row {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
