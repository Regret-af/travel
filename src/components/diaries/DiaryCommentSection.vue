<template>
  <section class="comment-section">
    <div class="section-heading">
      <div>
        <p class="section-eyebrow">评论区</p>
        <h2>读完之后，留下一句真实感受</h2>
      </div>
      <span class="comment-count">共 {{ totalCount }} 条评论</span>
    </div>

    <div class="comment-form-shell">
      <el-input
        :model-value="modelValue"
        type="textarea"
        :rows="4"
        resize="none"
        :readonly="!isLoggedIn"
        :placeholder="isLoggedIn ? '写下这篇旅途故事带给你的感受' : '登录后写下你的阅读感受'"
        @update:model-value="$emit('update:modelValue', String($event ?? ''))"
        @focus="!isLoggedIn && $emit('require-auth')"
      />
      <div class="comment-form-footer">
        <p class="comment-hint">
          {{ isLoggedIn ? '仅支持一级评论，留言会直接公开显示在当前日记下。' : '评论前需要先登录。' }}
        </p>
        <el-button type="primary" round :loading="submitting" @click="$emit('submit')">
          {{ isLoggedIn ? '发表评论' : '登录后评论' }}
        </el-button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="comment-loading">
      <article v-for="placeholder in 3" :key="placeholder" class="comment-skeleton">
        <span class="skeleton-avatar" />
        <div class="skeleton-body">
          <span class="skeleton-line short" />
          <span class="skeleton-line medium" />
          <span class="skeleton-line long" />
        </div>
      </article>
    </div>

    <div v-else-if="status === 'error'" class="comment-state">
      <h3>评论暂时加载失败</h3>
      <p>{{ errorMessage }}</p>
      <button class="state-link" @click="$emit('retry')">重新加载评论</button>
    </div>

    <div v-else-if="!comments.length" class="comment-state">
      <h3>还没有人留下第一句评论</h3>
      <p>这篇旅程刚刚停驻在这里，欢迎写下第一条留言。</p>
    </div>

    <div v-else class="comment-list">
      <article v-for="comment in comments" :key="comment.id" class="comment-card">
        <div class="comment-author">
          <el-avatar :size="44" :src="comment.author?.avatarUrl" />
          <div class="comment-meta">
            <p class="comment-name">{{ comment.author?.nickname || '旅行者' }}</p>
            <span v-if="formatTime(comment.createdAt)" class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          </div>
        </div>

        <p class="comment-content">{{ comment.content }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DiaryComment } from '@/api/diaries';
import { formatDateTime } from '@/utils/formatters';

defineProps<{
  comments: DiaryComment[];
  totalCount: number;
  modelValue: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  submitting: boolean;
  isLoggedIn: boolean;
  errorMessage: string;
}>();

defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'submit'): void;
  (event: 'retry'): void;
  (event: 'require-auth'): void;
}>();

const formatTime = (value?: string) => {
  return formatDateTime(value);
};
</script>

<style scoped lang="scss">
.comment-section {
  padding: 30px;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.84);
  box-shadow: 0 22px 58px rgba(15, 23, 42, 0.06);
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;

  h2 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-8xl);
    line-height: 1.12;
    font-weight: var(--font-weight-title);
  }
}

.section-eyebrow {
  margin: 0 0 10px;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.comment-count {
  color: #64748b;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.comment-form-shell {
  margin-top: 24px;
  padding: 18px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(226, 232, 240, 0.88);

  :deep(.el-textarea__inner) {
    min-height: 140px !important;
    border-radius: 20px;
    background: rgba(248, 250, 252, 0.96);
    box-shadow: none;
    border: 1px solid rgba(226, 232, 240, 0.88);
    color: #334155;
    line-height: 1.8;
    padding: 16px 18px;
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }

  :deep(.el-textarea__inner:focus) {
    border-color: rgba(212, 175, 55, 0.45);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
  }
}

.comment-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.comment-hint {
  margin: 0;
  color: #64748b;
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.comment-loading,
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.comment-card,
.comment-skeleton {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(226, 232, 240, 0.84);
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-name {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.comment-time {
  color: #64748b;
  font-size: var(--font-size-xs);
}

.comment-content {
  margin: 16px 0 0;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.comment-state {
  margin-top: 24px;
  padding: 28px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  text-align: center;

  h3 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-5xl);
  }

  p {
    margin: 12px 0 0;
    color: #64748b;
    line-height: 1.8;
  }
}

.state-link {
  margin-top: 18px;
  color: #9a7313;
  background: transparent;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.comment-skeleton {
  display: flex;
  gap: 14px;
}

.skeleton-avatar,
.skeleton-line {
  display: block;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  flex-shrink: 0;
}

.skeleton-body {
  flex: 1;
}

.skeleton-line {
  height: 12px;
  border-radius: 999px;

  & + & {
    margin-top: 12px;
  }
}

.skeleton-line.short {
  width: 32%;
}

.skeleton-line.medium {
  width: 74%;
}

.skeleton-line.long {
  width: 92%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 767px) {
  .comment-section {
    padding: 22px 18px;
    border-radius: 24px;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;

    h2 {
      font-size: var(--font-size-6xl);
    }
  }

  .comment-form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .comment-content {
    font-size: var(--font-size-md);
  }
}
</style>
