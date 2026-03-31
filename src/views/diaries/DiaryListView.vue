<template>
  <div class="diaries-page">
    <section class="diary-hero" :style="heroBackgroundStyle">
      <div class="hero-copy">
        <p class="hero-eyebrow">旅行日记</p>
        <h1>把沿途风景与真实心绪，翻成一册适合慢慢阅读的故事目录</h1>
        <p class="hero-description">
          这里收录公开发布的旅行日记，以更安静的节奏呈现沿途片段、人物感受与旅程余韵。
        </p>
      </div>
    </section>

    <section ref="resultsAnchorRef" class="sort-shell">
      <div class="sort-copy">
        <h2>{{ resultHeadline }}</h2>
        <p v-if="isFetching" class="sort-status">目录正在更新中</p>
      </div>

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
            <div class="loading-metrics">
              <span v-for="metric in 4" :key="metric" class="loading-metric" />
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="listStatus === 'success'" class="diary-list">
        <DiaryEditorialCard
          v-for="(item, index) in pageData.list"
          :key="item.id"
          :item="item"
          :index="index"
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

const pageSize = 5;
const defaultSort: SortValue = 'latest';
const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热门阅读' }
];
const placeholders = Array.from({ length: 3 }, (_, index) => index + 1);
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
  if (listStatus.value === 'error') return '旅行日记目录暂时无法读取';
  if (listStatus.value === 'empty') return '暂未收录可展示的旅行日记';

  return `当前共收录 ${formattedTotal.value} 篇旅行日记`;
});
const heroBackgroundStyle = computed(() => {
  const coverUrl = pageData.value.list[0]?.coverUrl;

  return {
    backgroundImage: coverUrl
      ? `linear-gradient(108deg, rgba(255, 255, 255, 0.97) 0%, rgba(255, 255, 255, 0.9) 44%, rgba(255, 255, 255, 0.55) 100%), url(${coverUrl})`
      : 'radial-gradient(circle at 16% 18%, rgba(34, 211, 238, 0.16), transparent 20%), radial-gradient(circle at 84% 24%, rgba(212, 175, 55, 0.18), transparent 18%), linear-gradient(135deg, #f8fafc 0%, #ffffff 64%, #f6f9fc 100%)'
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
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.diary-hero,
.sort-shell,
.list-shell {
  border-radius: 32px;
}

.diary-hero {
  position: relative;
  min-height: 262px;
  padding: 34px 44px 38px;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  background-position: center;
  background-size: cover;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.08);

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
  }

  &::before {
    width: 300px;
    height: 300px;
    right: -70px;
    top: -120px;
    background: rgba(255, 255, 255, 0.26);
    filter: blur(14px);
  }

  &::after {
    width: 220px;
    height: 220px;
    left: 52%;
    bottom: -120px;
    background: rgba(212, 175, 55, 0.12);
    filter: blur(18px);
  }
}

.hero-copy,
.sort-copy {
  position: relative;
  z-index: 1;
}

.hero-eyebrow,
.section-eyebrow {
  margin: 0 0 12px;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-copy {
  max-width: min(900px, 100%);

  h1 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-17xl);
    line-height: 1.04;
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.035em;
  }
}

.hero-description {
  margin: 18px 0 0;
  max-width: 760px;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.86;
}

.sort-shell {
  padding: 28px 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.sort-copy {
  h2 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-8xl);
    line-height: 1.14;
    font-weight: var(--font-weight-title);
  }
}

.sort-status {
  margin: 10px 0 0;
  color: #9a7313;
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.sort-actions {
  display: inline-flex;
  gap: 12px;
  flex-shrink: 0;
}

.sort-chip {
  min-width: 158px;
  padding: 14px 18px;
  border-radius: 24px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease;

  &:hover,
  &.active {
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.42);
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 14px 28px rgba(212, 175, 55, 0.08);
  }
}

.sort-label {
  display: block;
  color: #111827;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.list-shell {
  display: flex;
  flex-direction: column;
}

.diary-list,
.loading-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.loading-card {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.82fr);
  align-items: center;
}

.loading-card:nth-child(even) {
  grid-template-columns: minmax(340px, 0.82fr) minmax(0, 1.08fr);

  .loading-cover {
    order: 2;
  }

  .loading-content {
    margin-left: 0;
    margin-right: -92px;
  }
}

.loading-cover {
  min-height: 400px;
  border-radius: 36px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-content {
  position: relative;
  z-index: 1;
  margin-left: -92px;
  padding: 32px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(226, 232, 240, 0.84);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.08);
}

.loading-chip,
.loading-line,
.loading-metric {
  display: block;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-chip {
  width: 126px;
  height: 36px;
}

.loading-line {
  margin-top: 18px;
  height: 14px;
}

.loading-line.short {
  width: 58%;
}

.loading-line.medium {
  width: 78%;
}

.loading-line.long {
  width: 88%;
}

.loading-metrics {
  display: flex;
  gap: 14px;
  margin-top: 28px;
}

.loading-metric {
  width: 78px;
  height: 38px;
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
  .sort-shell {
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

@media (max-width: 1024px) {
  .loading-card,
  .loading-card:nth-child(even) {
    grid-template-columns: 1fr;

    .loading-cover {
      order: 1;
    }

    .loading-content {
      margin: -52px 18px 0;
      order: 2;
    }
  }

  .loading-cover {
    min-height: 340px;
  }
}

@media (max-width: 767px) {
  .diaries-page {
    gap: 22px;
  }

  .diary-hero,
  .sort-shell {
    border-radius: 24px;
  }

  .diary-hero {
    min-height: 0;
    padding: 24px 18px 26px;
  }

  .hero-copy h1 {
    font-size: var(--font-size-10xl);
  }

  .hero-description,
  .sort-status {
    font-size: var(--font-size-md);
    line-height: 1.8;
  }

  .sort-shell {
    padding: 20px 18px;
  }

  .sort-copy h2 {
    font-size: var(--font-size-6xl);
  }

  .sort-actions {
    flex-direction: column;
  }

  .loading-list {
    gap: 22px;
  }

  .loading-card,
  .loading-card:nth-child(even) {
    .loading-content {
      margin: -30px 12px 0;
      padding: 22px 20px;
      border-radius: 24px;
    }
  }

  .loading-cover {
    min-height: 240px;
    border-radius: 26px;
  }

  .loading-line.short {
    width: 72%;
  }

  .loading-line.medium,
  .loading-line.long {
    width: 100%;
  }

  .loading-metrics {
    flex-wrap: wrap;
  }
}
</style>
