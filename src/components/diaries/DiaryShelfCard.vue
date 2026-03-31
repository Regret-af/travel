<template>
  <component
    :is="linkComponent"
    v-bind="linkProps"
    class="shelf-card"
    :class="{
      'shelf-card-disabled': !isClickable,
      'shelf-card-invalid': invalid
    }"
  >
    <div class="cover-shell">
      <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" class="cover-image" />
      <div v-else class="cover-fallback" />
      <div class="cover-overlay" />

      <div class="badge-stack">
        <span v-if="badge" class="status-badge" :class="`status-badge-${badgeTone}`">
          {{ badge }}
        </span>
        <span v-else-if="invalid" class="status-badge status-badge-slate">暂不可访问</span>
      </div>
    </div>

    <article class="content-shell">
      <div class="meta-row">
        <div class="author-meta">
          <el-avatar :size="46" :src="item.author?.avatarUrl" />
          <div class="author-copy">
            <p class="author-name">{{ item.author?.nickname || '旅行者' }}</p>
            <span v-if="publishedLabel" class="publish-time">{{ publishedLabel }}</span>
          </div>
        </div>
      </div>

      <h2 class="diary-title" :title="item.title">{{ item.title }}</h2>
      <p class="diary-summary" :title="summaryText">{{ summaryText }}</p>

      <div class="metric-row" aria-label="日记统计">
        <span class="metric-item">
          <el-icon><View /></el-icon>
          {{ formatCountStat(item.viewCount) }}
        </span>
        <span class="metric-item">
          <el-icon><Star /></el-icon>
          {{ formatCountStat(item.likeCount) }}
        </span>
        <span class="metric-item">
          <el-icon><CollectionTag /></el-icon>
          {{ formatCountStat(item.favoriteCount) }}
        </span>
        <span class="metric-item">
          <el-icon><ChatLineRound /></el-icon>
          {{ formatCountStat(item.commentCount) }}
        </span>
      </div>

      <span class="entry-note">{{ resolvedNote }}</span>
    </article>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ChatLineRound, CollectionTag, Star, View } from '@element-plus/icons-vue';
import type { DiaryCard } from '@/api/diaries';
import { formatCountStat, formatDate } from '@/utils/formatters';

const props = withDefaults(
  defineProps<{
    item: DiaryCard;
    to?: string;
    badge?: string;
    badgeTone?: 'gold' | 'slate' | 'danger';
    invalid?: boolean;
    note?: string;
  }>(),
  {
    to: '',
    badge: '',
    badgeTone: 'gold',
    invalid: false,
    note: ''
  }
);

const isClickable = computed(() => Boolean(props.to) && !props.invalid);
const linkComponent = computed(() => (isClickable.value ? RouterLink : 'article'));
const linkProps = computed(() => (isClickable.value ? { to: props.to } : {}));
const publishedLabel = computed(() => formatDate(props.item.publishedAt));
const summaryText = computed(() => {
  const value = props.item.summary?.trim();

  if (value) return value;
  if (props.invalid) return '这篇内容当前暂时无法打开，你仍可以把它留在收藏里，之后再回来看看。';

  return '这篇旅行日记暂时没有摘要，点击可继续翻阅完整的沿途记录。';
});
const resolvedNote = computed(() => {
  if (props.note) return props.note;
  return props.invalid ? '当前暂时无法打开这篇内容' : '继续翻阅这篇旅途故事';
});
</script>

<style scoped lang="scss">
.shelf-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
  gap: 0;
  align-items: stretch;
  color: inherit;
  text-decoration: none;

  &:hover {
    .cover-image,
    .cover-fallback {
      transform: scale(1.05);
    }

    .content-shell {
      transform: translateY(-6px);
      box-shadow: 0 24px 58px rgba(15, 23, 42, 0.12);
    }
  }
}

.shelf-card-disabled {
  cursor: default;
}

.shelf-card-invalid {
  .cover-image,
  .cover-fallback {
    filter: grayscale(0.92);
  }

  .content-shell {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.92) 100%);
  }
}

.cover-shell {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  border-radius: 30px;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 48%, #eef2ff 100%);
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.08);
}

.cover-image,
.cover-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease, filter 0.35s ease;
}

.cover-fallback {
  background:
    radial-gradient(circle at 24% 22%, rgba(255, 255, 255, 0.82), transparent 18%),
    linear-gradient(140deg, rgba(34, 211, 238, 0.24) 0%, rgba(212, 175, 55, 0.2) 46%, rgba(15, 23, 42, 0.12) 100%);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.18) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0) 34%, rgba(255, 255, 255, 0.16) 100%);
}

.badge-stack {
  position: absolute;
  left: 18px;
  top: 18px;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
  backdrop-filter: blur(12px);
}

.status-badge-gold {
  background: rgba(212, 175, 55, 0.18);
  border: 1px solid rgba(212, 175, 55, 0.28);
  color: #9a7313;
}

.status-badge-slate {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #475569;
}

.status-badge-danger {
  background: rgba(248, 113, 113, 0.18);
  border: 1px solid rgba(248, 113, 113, 0.24);
  color: #b91c1c;
}

.content-shell {
  position: relative;
  z-index: 1;
  margin: 26px 0 26px -62px;
  padding: 28px 30px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

.meta-row,
.author-meta {
  display: flex;
  align-items: center;
}

.author-meta {
  gap: 12px;
}

.author-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.publish-time {
  color: #64748b;
  font-size: var(--font-size-xs);
}

.diary-title {
  margin: 20px 0 0;
  color: #111827;
  font-size: var(--font-size-8xl);
  line-height: 1.16;
  font-weight: var(--font-weight-title);
  letter-spacing: -0.03em;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.diary-summary {
  margin: 14px 0 0;
  color: #475569;
  font-size: var(--font-size-md);
  line-height: 1.85;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
}

.metric-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);

  :deep(.el-icon) {
    color: #c79b1d;
    font-size: var(--font-size-md);
  }
}

.entry-note {
  display: inline-flex;
  margin-top: 20px;
  width: fit-content;
  color: #9a7313;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
}

@media (max-width: 900px) {
  .shelf-card {
    grid-template-columns: 1fr;
  }

  .content-shell {
    margin: -44px 16px 0;
  }
}

@media (max-width: 767px) {
  .cover-shell {
    min-height: 220px;
    border-radius: 24px;
  }

  .content-shell {
    margin: -28px 12px 0;
    padding: 22px 18px;
    border-radius: 22px;
  }

  .diary-title {
    font-size: var(--font-size-5xl);
  }
}
</style>
