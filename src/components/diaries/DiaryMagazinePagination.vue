<template>
  <section class="pagination-shell">
    <div class="pagination-copy">
      <p class="pagination-eyebrow">目录页码</p>
      <h2>第 {{ currentPage }} 页，共 {{ totalPages }} 页</h2>
      <p>当前共收录 {{ total.toLocaleString('zh-CN') }} 篇旅行日记，按每页 {{ pageSize }} 篇的节奏继续翻阅。</p>
    </div>

    <div class="pagination-panel">
      <button
        class="page-action"
        :disabled="currentPage <= 1"
        @click="$emit('change', currentPage - 1)"
      >
        上一页
      </button>

      <div class="page-list" aria-label="分页">
        <button
          v-for="entry in pageEntries"
          :key="entry.key"
          class="page-number"
          :class="{ active: entry.page === currentPage, ghost: entry.type === 'ellipsis' }"
          :disabled="entry.type === 'ellipsis' || entry.page === currentPage"
          @click="entry.page && $emit('change', entry.page)"
        >
          {{ entry.label }}
        </button>
      </div>

      <button
        class="page-action"
        :disabled="currentPage >= totalPages"
        @click="$emit('change', currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}>();

defineEmits<{
  (event: 'change', page: number): void;
}>();

interface PageEntry {
  key: string;
  label: string;
  page?: number;
  type: 'page' | 'ellipsis';
}

const pageEntries = computed<PageEntry[]>(() => {
  const totalPages = props.totalPages;
  const currentPage = props.currentPage;

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      key: `page-${index + 1}`,
      label: String(index + 1),
      page: index + 1,
      type: 'page'
    }));
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalized = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const entries: PageEntry[] = [];

  normalized.forEach((page, index) => {
    const previous = normalized[index - 1];

    if (typeof previous === 'number' && page - previous > 1) {
      entries.push({
        key: `ellipsis-${previous}-${page}`,
        label: '...',
        type: 'ellipsis'
      });
    }

    entries.push({
      key: `page-${page}`,
      label: String(page),
      page,
      type: 'page'
    });
  });

  return entries;
});
</script>

<style scoped lang="scss">
.pagination-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 30px;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.pagination-eyebrow {
  margin: 0 0 10px;
  color: #c79b1d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.pagination-copy {
  h2 {
    margin: 0;
    color: #111827;
    font-size: 32px;
    line-height: 1.12;
    font-weight: 760;
  }

  p:last-child {
    margin: 14px 0 0;
    max-width: 520px;
    color: #475569;
    font-size: 15px;
    line-height: 1.8;
  }
}

.pagination-panel {
  min-width: 360px;
  padding: 18px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}

.page-action,
.page-number {
  min-width: 42px;
  height: 42px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: rgba(255, 255, 255, 0.92);
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.45);
    background: rgba(212, 175, 55, 0.12);
    color: #9a7313;
    box-shadow: 0 12px 22px rgba(212, 175, 55, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.52;
  }
}

.page-action {
  min-width: 88px;
}

.page-number.active {
  border-color: rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.12) 100%);
  color: #9a7313;
  box-shadow: 0 14px 26px rgba(212, 175, 55, 0.08);
}

.page-number.ghost {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

@media (max-width: 1024px) {
  .pagination-shell {
    grid-template-columns: 1fr;
  }

  .pagination-panel {
    min-width: 0;
  }
}

@media (max-width: 767px) {
  .pagination-shell {
    padding: 22px 18px;
    border-radius: 24px;
  }

  .pagination-copy h2 {
    font-size: 28px;
  }

  .pagination-copy p:last-child {
    font-size: 14px;
  }

  .pagination-panel {
    padding: 16px 14px;
    border-radius: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-action {
    flex: 1 1 120px;
  }

  .page-list {
    order: 3;
    width: 100%;
  }
}
</style>
