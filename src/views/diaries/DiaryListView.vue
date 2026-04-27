<template>
  <div class="diaries-page">
    <section class="diary-hero" :style="heroBackgroundStyle">
      <div class="hero-copy">
        <h1>旅行日记</h1>
        <p class="hero-description">
          记录每一段不期而遇的惊喜，分享探索世界的每一刻感动
        </p>
      </div>
    </section>

    <section ref="resultsAnchorRef" class="catalog-bar">
      <p class="catalog-summary">{{ resultHeadline }}</p>
      <div class="sort-actions">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          class="sort-chip"
          :class="{ active: currentSort === option.value }"
          :aria-pressed="currentSort === option.value"
          @click="handleSortChange(option.value)"
        >
          <span class="sort-label">{{ option.label }}</span>
        </button>
      </div>
      <p v-if="isFetching" class="sort-status">目录正在更新中</p>
    </section>

    <section class="list-shell">
      <div v-if="listStatus === 'loading'" class="loading-list" aria-label="日记列表加载中">
        <article v-for="placeholder in placeholders" :key="placeholder" class="loading-card">
          <div class="loading-cover" />
          <div class="loading-content">
            <span class="loading-chip" />
            <span class="loading-line short" />
            <span class="loading-line medium" />
            <span class="loading-line long" />
            <div class="loading-footer">
              <span class="loading-avatar" />
              <div class="loading-author">
                <span class="loading-line author" />
                <span class="loading-line date" />
              </div>
              <span class="loading-metric" />
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="listStatus === 'success'" class="diary-list">
        <DiaryEditorialCard
          v-for="item in pageData.list"
          :key="item.id"
          :item="item"
        />
      </div>

      <DiaryCollectionState
        v-else-if="listStatus === 'empty'"
        variant="empty"
        eyebrow="内容留白"
        title="这本旅行目录暂时还没有刊登新的故事"
        description="当前暂无可展示的旅行日记。稍后再来，也许下一段旅程正准备被写下。"
        action-label="返回首页"
        secondary-label="去景点列表看看"
        secondary-to="/attractions"
        @action="goHome"
      />

      <DiaryCollectionState
        v-else
        variant="error"
        eyebrow="加载受阻"
        title="旅行日记目录暂时无法展开"
        :description="errorMessage"
        action-label="重新加载"
        secondary-label="返回首页"
        secondary-to="/"
        @action="fetchList"
      />
    </section>

    <DiaryMagazinePagination
      v-if="listStatus === 'success' && pageData.pages > 1"
      :current-page="pageData.pageNum"
      :total-pages="pageData.pages"
      :total="pageData.total"
      :page-size="pageData.pageSize"
      @change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryEditorialCard from '@/components/diaries/DiaryEditorialCard.vue';
import DiaryMagazinePagination from '@/components/diaries/DiaryMagazinePagination.vue';
import { getTravelDiaryList, type PageDiaryCard } from '@/api/diaries';

type SortValue = 'latest' | 'hot';
type ListStatus = 'loading' | 'success' | 'empty' | 'error';

const router = useRouter();
const route = useRoute();

const pageSize = 6;
const defaultSort: SortValue = 'latest';
const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热门推荐' }
];
const placeholders = Array.from({ length: pageSize }, (_, index) => index + 1);
const resultsAnchorRef = ref<HTMLElement | null>(null);

const pageData = ref<PageDiaryCard>({
  list: [],
  pageNum: 1,
  pageSize,
  total: 0,
  pages: 0
});
const listStatus = ref<ListStatus>('loading');
const errorMessage = ref('当前无法获取旅行日记目录，请稍后重试。');
const isFetching = ref(false);
const currentSort = ref<SortValue>(defaultSort);
let fetchSequence = 0;

const normalizedRoute = computed(() => {
  const routePage = Number(route.query.page || 1);
  const routeSort = String(route.query.sort || defaultSort).trim();

  return {
    page: Number.isFinite(routePage) && routePage > 0 ? routePage : 1,
    sort: routeSort === 'hot' ? 'hot' : 'latest'
  } as const;
});

const formattedTotal = computed(() => pageData.value.total.toLocaleString('zh-CN'));
const resultHeadline = computed(() => {
  if (listStatus.value === 'loading') return '旅行日记正在加载';
  if (listStatus.value === 'error') return '日记目录暂时无法读取';
  if (listStatus.value === 'empty') return '暂未收录可展示的旅行日记';

  return `当前共收录 ${formattedTotal.value} 篇旅行日记`;
});
const heroBackgroundStyle = computed(() => {
  const coverUrl = pageData.value.list[0]?.coverUrl;

  return {
    backgroundImage: coverUrl
      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0.4) 100%), url(${coverUrl})`
      : 'linear-gradient(180deg, rgba(15, 23, 42, 0.26) 0%, rgba(15, 23, 42, 0.42) 100%), radial-gradient(circle at 24% 22%, rgba(34, 211, 238, 0.3), transparent 24%), radial-gradient(circle at 76% 20%, rgba(212, 175, 55, 0.24), transparent 22%), linear-gradient(135deg, #0f172a 0%, #005bad 58%, #002c59 100%)'
  };
});

const scrollToResults = () => {
  nextTick(() => {
    const offsetTop = resultsAnchorRef.value?.getBoundingClientRect().top;

    if (typeof offsetTop !== 'number') return;

    window.scrollTo({
      top: Math.max(window.scrollY + offsetTop - 110, 0),
      behavior: 'smooth'
    });
  });
};

const updateRoute = (payload: { page?: number; sort?: SortValue }) => {
  const nextState = {
    page: payload.page ?? normalizedRoute.value.page,
    sort: payload.sort ?? normalizedRoute.value.sort
  };

  if (
    nextState.page === normalizedRoute.value.page &&
    nextState.sort === normalizedRoute.value.sort
  ) {
    return;
  }

  router.push({
    path: '/diaries',
    query: {
      ...(nextState.sort !== defaultSort ? { sort: nextState.sort } : {}),
      ...(nextState.page > 1 ? { page: String(nextState.page) } : {})
    }
  });
};

const fetchList = async () => {
  const requestId = ++fetchSequence;
  listStatus.value = 'loading';
  isFetching.value = true;
  errorMessage.value = '当前无法获取旅行日记目录，请稍后重试。';
  pageData.value = {
    list: [],
    pageNum: normalizedRoute.value.page,
    pageSize,
    total: 0,
    pages: 0
  };

  try {
    const res = await getTravelDiaryList({
      pageNum: normalizedRoute.value.page,
      pageSize,
      sort: normalizedRoute.value.sort
    });

    if (requestId !== fetchSequence) return;

    const data = res.data;

    if (data.pages > 0 && normalizedRoute.value.page > data.pages) {
      updateRoute({ page: data.pages });
      return;
    }

    if (data.pages === 0 && normalizedRoute.value.page > 1) {
      updateRoute({ page: 1 });
      return;
    }

    pageData.value = {
      list: data.list,
      pageNum: data.pageNum,
      pageSize: data.pageSize || pageSize,
      total: data.total,
      pages: data.pages
    };
    currentSort.value = normalizedRoute.value.sort;
    listStatus.value = data.list.length ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== fetchSequence) return;

    console.error('Failed to load travel diaries', error);
    pageData.value = {
      list: [],
      pageNum: normalizedRoute.value.page,
      pageSize,
      total: 0,
      pages: 0
    };
    currentSort.value = normalizedRoute.value.sort;
    listStatus.value = 'error';
    errorMessage.value = '当前网络或服务暂时不可用，旅行日记目录未能成功加载。';
  } finally {
    if (requestId === fetchSequence) {
      isFetching.value = false;
    }
  }
};

const handleSortChange = (sort: SortValue) => {
  if (sort === currentSort.value && normalizedRoute.value.page === 1) return;

  updateRoute({
    sort,
    page: 1
  });
  scrollToResults();
};

const handlePageChange = (page: number) => {
  if (page === normalizedRoute.value.page) return;

  updateRoute({ page });
  scrollToResults();
};

const goHome = () => {
  router.push('/');
};

watch(
  () => route.fullPath,
  () => {
    currentSort.value = normalizedRoute.value.sort;
    fetchList();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.diaries-page {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
  color: #0f172a;
}

.diary-hero,
.catalog-bar,
.list-shell {
  border-radius: var(--radius-panel);
}

.diary-hero {
  position: relative;
  min-height: 500px;
  padding: 64px 48px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-position: center;
  background-size: cover;
  box-shadow: var(--shadow-elevated);
}

.hero-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: min(900px, 100%);
  text-align: center;

  h1 {
    margin: 0;
    color: #ffffff;
    font-size: var(--font-size-display-md);
    line-height: 1.14;
    font-weight: var(--font-weight-display);
    text-shadow: 0 12px 34px rgba(15, 23, 42, 0.32);
  }
}

.hero-description {
  margin: 18px 0 0;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-title-sm);
  font-weight: var(--font-weight-semibold);
  line-height: 1.55;
  text-shadow: 0 10px 28px rgba(15, 23, 42, 0.28);
}

.catalog-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.catalog-summary {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: 1.6;
}

.sort-actions {
  display: inline-flex;
  gap: 0;
  flex-shrink: 0;
  padding: 6px;
  border-radius: var(--radius-chip);
  background: #f2f3fb;
  box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.06);
}

.sort-chip {
  min-width: 118px;
  min-height: 38px;
  padding: 0 22px;
  border: none;
  border-radius: var(--radius-chip);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover,
  &.active {
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);

    .sort-label {
      color: var(--color-brand-primary);
    }
  }
}

.sort-label {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.sort-status {
  flex-basis: 100%;
  margin: -8px 0 0;
  color: var(--color-accent-strong);
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.list-shell {
  display: flex;
  flex-direction: column;
}

.diary-list,
.loading-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 40px;
}

.loading-card {
  overflow: hidden;
  border-radius: var(--radius-card);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.loading-cover {
  height: 288px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-content {
  min-height: 300px;
  padding: 30px;
}

.loading-chip,
.loading-line,
.loading-metric,
.loading-avatar {
  display: block;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-chip {
  width: 92px;
  height: 28px;
}

.loading-line {
  margin-top: 18px;
  height: 12px;
}

.loading-line.short {
  width: 78%;
}

.loading-line.medium {
  width: 100%;
}

.loading-line.long {
  width: 88%;
}

.loading-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 74px;
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.86);
}

.loading-avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.loading-author {
  flex: 1;
}

.loading-metric {
  width: 74px;
  height: 18px;
}

.loading-line.author,
.loading-line.date {
  margin-top: 0;
}

.loading-line.author {
  width: 86px;
  height: 10px;
}

.loading-line.date {
  width: 68px;
  height: 8px;
  margin-top: 8px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1100px) {
  .diary-list,
  .loading-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .catalog-bar {
    align-items: flex-end;
  }
}

@media (max-width: 860px) {
  .catalog-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .sort-actions {
    width: 100%;
  }

  .sort-chip {
    flex: 1;
  }
}

@media (max-width: 767px) {
  .diaries-page {
    gap: 28px;
  }

  .diary-hero,
  .catalog-bar {
    border-radius: 24px;
  }

  .diary-hero {
    min-height: 360px;
    padding: 44px 18px;
  }

  .hero-copy h1 {
    font-size: var(--font-size-title-lg);
  }

  .hero-description {
    font-size: var(--font-size-xl);
  }

  .diary-list,
  .loading-list {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .catalog-summary,
  .sort-status {
    font-size: var(--font-size-sm);
  }

  .sort-actions {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .sort-actions::-webkit-scrollbar {
    display: none;
  }

  .sort-chip {
    min-width: 108px;
    flex: 1 0 auto;
    padding: 0 18px;
  }

  .loading-cover {
    height: 230px;
  }

  .loading-content {
    min-height: 260px;
    padding: 24px 22px 22px;
  }
}
</style>
