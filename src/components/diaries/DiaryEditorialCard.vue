<template>
  <RouterLink :to="`/diaries/${item.id}`" class="editorial-card" :class="{ 'editorial-card-reverse': isReverse }">
    <div class="cover-shell">
      <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" class="cover-image" />
      <div v-else class="cover-fallback" />
      <div class="cover-overlay" />
    </div>

    <article class="content-shell">
      <div class="author-meta">
        <el-avatar :size="48" :src="item.author?.avatarUrl" />
        <div class="author-copy">
          <p class="author-name">{{ item.author?.nickname || '旅行者' }}</p>
          <span class="publish-time">{{ publishedLabel }}</span>
        </div>
      </div>

      <h2 class="diary-title">{{ item.title }}</h2>
      <p class="diary-summary">{{ summaryText }}</p>

      <div class="metric-row" aria-label="日记内容指标">
        <span class="metric-item">
          <el-icon><View /></el-icon>
          {{ item.viewCount ?? 0 }}
        </span>
        <span class="metric-item">
          <el-icon><Star /></el-icon>
          {{ item.likeCount ?? 0 }}
        </span>
        <span class="metric-item">
          <el-icon><CollectionTag /></el-icon>
          {{ item.favoriteCount ?? 0 }}
        </span>
        <span class="metric-item">
          <el-icon><ChatLineRound /></el-icon>
          {{ item.commentCount ?? 0 }}
        </span>
      </div>

      <span class="entry-note">继续翻阅这篇旅途故事</span>
    </article>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ChatLineRound, CollectionTag, Star, View } from '@element-plus/icons-vue';
import type { DiaryCard } from '@/api/diaries';

const props = defineProps<{
  item: DiaryCard;
  index: number;
}>();

const isReverse = computed(() => props.index % 2 === 1);
const publishedLabel = computed(() => {
  const value = props.item.publishedAt?.trim();

  if (!value) return '发布日期待更新';

  return value.length >= 10 ? value.slice(0, 10).replace(/-/g, '.') : value;
});
const summaryText = computed(() => {
  const value = props.item.summary?.trim();

  if (!value) return '这篇旅行日记暂时没有摘要，点击继续翻阅完整的沿途记录。';

  return value;
});
</script>

<style scoped lang="scss">
.editorial-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.82fr);
  align-items: center;
  gap: 0;
  color: inherit;
  text-decoration: none;

  &:hover {
    .cover-image,
    .cover-fallback {
      transform: scale(1.06);
    }

    .content-shell {
      transform: translateY(-8px);
      box-shadow: 0 28px 72px rgba(15, 23, 42, 0.14);
    }
  }
}

.editorial-card-reverse {
  grid-template-columns: minmax(340px, 0.82fr) minmax(0, 1.1fr);

  .cover-shell {
    order: 2;
  }

  .content-shell {
    margin-left: 0;
    margin-right: -92px;
  }
}

.cover-shell {
  position: relative;
  min-height: 410px;
  overflow: hidden;
  border-radius: 36px;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 48%, #eef2ff 100%);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.1);
}

.cover-image,
.cover-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(15, 23, 42, 0.12) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0) 34%, rgba(255, 255, 255, 0.18) 100%);
}

.content-shell {
  position: relative;
  z-index: 1;
  margin-left: -92px;
  padding: 34px 34px 32px;
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.1);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.author-name {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.publish-time {
  display: inline-flex;
  width: fit-content;
  min-height: 28px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.95);
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.05em;
}

.diary-title {
  margin: 22px 0 0;
  color: #111827;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 38px;
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.03em;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.diary-summary {
  margin: 18px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.9;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
}

.metric-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;

  :deep(.el-icon) {
    color: #c79b1d;
    font-size: 14px;
  }
}

.entry-note {
  display: inline-flex;
  margin-top: 24px;
  width: fit-content;
  color: #9a7313;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .editorial-card,
  .editorial-card-reverse {
    grid-template-columns: 1fr;

    .cover-shell {
      order: 1;
    }

    .content-shell {
      margin: -54px 18px 0;
      order: 2;
    }
  }

  .cover-shell {
    min-height: 360px;
  }

  .diary-title {
    font-size: 32px;
  }
}

@media (max-width: 767px) {
  .editorial-card,
  .editorial-card-reverse {
    .content-shell {
      margin: -34px 12px 0;
      padding: 24px 20px 22px;
      border-radius: 24px;
    }
  }

  .cover-shell {
    min-height: 250px;
    border-radius: 26px;
  }

  .author-meta {
    gap: 12px;
  }

  .diary-title {
    font-size: 28px;
  }

  .diary-summary {
    font-size: 14px;
    line-height: 1.8;
  }

  .metric-row {
    gap: 10px 14px;
  }
}
</style>
