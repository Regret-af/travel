<template>
  <section class="interaction-panel">
    <div class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">阅读</span>
        <strong>{{ formatCount(detail.viewCount) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">喜欢</span>
        <strong>{{ formatCount(detail.likeCount) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">收藏</span>
        <strong>{{ formatCount(detail.favoriteCount) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-label">评论</span>
        <strong>{{ formatCount(detail.commentCount) }}</strong>
      </article>
    </div>

    <div class="action-row">
      <button
        class="action-chip"
        :class="{ active: detail.liked }"
        :disabled="likePending"
        @click="$emit('toggle-like')"
      >
        <el-icon><Star /></el-icon>
        {{ detail.liked ? '已喜欢' : '喜欢这篇日记' }}
      </button>

      <button
        class="action-chip"
        :class="{ active: detail.favorited }"
        :disabled="favoritePending"
        @click="$emit('toggle-favorite')"
      >
        <el-icon><CollectionTag /></el-icon>
        {{ detail.favorited ? '已收藏' : '收藏阅读' }}
      </button>

      <button class="action-chip action-chip-neutral" @click="$emit('focus-comment')">
        <el-icon><ChatLineRound /></el-icon>
        写评论
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChatLineRound, CollectionTag, Star } from '@element-plus/icons-vue';
import type { DiaryDetail } from '@/api/diaries';

defineProps<{
  detail: DiaryDetail;
  likePending: boolean;
  favoritePending: boolean;
}>();

defineEmits<{
  (event: 'toggle-like'): void;
  (event: 'toggle-favorite'): void;
  (event: 'focus-comment'): void;
}>();

const formatCount = (value?: number) => Number(value ?? 0).toLocaleString('zh-CN');
</script>

<style scoped lang="scss">
.interaction-panel {
  padding: 28px;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.84);
  box-shadow: 0 20px 54px rgba(15, 23, 42, 0.06);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(226, 232, 240, 0.86);

  strong {
    display: block;
    margin-top: 10px;
    color: #111827;
    font-size: 28px;
    line-height: 1;
    font-family: Georgia, 'Times New Roman', serif;
  }
}

.stat-label {
  display: inline-flex;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
}

.action-chip {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover:not(:disabled),
  &.active {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.45);
    background: rgba(212, 175, 55, 0.12);
    color: #9a7313;
    box-shadow: 0 12px 24px rgba(212, 175, 55, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
}

.action-chip-neutral:hover {
  border-color: rgba(34, 211, 238, 0.32);
  background: rgba(34, 211, 238, 0.08);
  color: #0f172a;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

@media (max-width: 767px) {
  .interaction-panel {
    padding: 22px 18px;
    border-radius: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-card {
    padding: 16px;

    strong {
      font-size: 24px;
    }
  }

  .action-row {
    flex-direction: column;
  }

  .action-chip {
    justify-content: center;
  }
}
</style>
