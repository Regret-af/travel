<template>
  <div class="diaries-page">
    <section class="diary-hero" :style="heroBackgroundStyle">
      <div class="hero-copy">
        <p class="hero-eyebrow">Travel Diaries</p>
        <h1>把沿途风景与真实心绪，翻成一册适合慢慢阅读的故事目录</h1>
        <p class="hero-description">
          这里收录公开发布的旅行日记，以更安静的节奏呈现沿途片段、人物感受与旅程余韵。
        </p>
      </div>

      <div class="hero-note">
        <span class="hero-note-label">本页导览</span>
        <p>仅按“最新发布”与“热门阅读”切换目录顺序，让阅读保持克制，也让故事本身留在前景。</p>
      </div>
    </section>

    <section ref="resultsAnchorRef" class="sort-shell">
      <div class="sort-copy">
        <p class="section-eyebrow">目录排序</p>
        <h2>选择这一册的翻阅方式</h2>
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
          <span class="sort-note">{{ option.note }}</span>
        </button>
      </div>
    </section>

    <section class="results-shell">
      <div class="results-copy">
        <p class="section-eyebrow">结果统计</p>
        <h2>{{ resultHeadline }}</h2>
        <p class="results-description">
          {{ pageProgressText }}
          <span v-if="isFetching" class="loading-copy">目录正在更新中</span>
        </p>
      </div>

      <div class="results-summary">
        <article class="summary-card summary-card-total">
          <span class="result-label">已收录故事</span>
          <strong>{{ formattedTotal }}</strong>
          <p>公开发布的旅行日记目录正在这里缓慢展开。</p>
        </article>

        <article class="summary-card summary-card-progress">
          <span class="result-label">当前翻阅</span>
          <strong>第 {{ displayPageNum }} 页</strong>
          <p>共 {{ displayPages }} 页，保持单册目录式的阅读节奏。</p>
        </article>
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
        description="接口已成功返回，但当前没有可展示的旅行日记。稍后再来，也许下一段旅程正准备被写下。"
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
const sortOptions: Array<{ value: SortValue; label: string; note: string }> = [
  { value: 'latest', label: '最新发布', note: '按发布时间翻阅沿途记录' },
  { value: 'hot', label: '热门阅读', note: '按热度顺序查看被更多人读到的故事' }
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
const displayPageNum = computed(() => pageData.value.pageNum || normalizedRoute.value.page);
const displayPages = computed(() => pageData.value.pages || 1);
const resultHeadline = computed(() => {
  if (listStatus.value === 'loading') return '旅行目录正在更新';
  if (listStatus.value === 'error') return '目录暂时无法读取';
  if (listStatus.value === 'empty') return '暂未收录可展示的旅行日记';

  return `当前共收录 ${formattedTotal.value} 篇旅行日记`;
});
const pageProgressText = computed(() => {
  if (listStatus.value === 'loading') {
    return `正在切换到第 ${normalizedRoute.value.page} 页的目录内容。`;
  }

  if (listStatus.value === 'error') {
    return `原计划展开第 ${displayPageNum.value} 页内容，但当前请求未能成功返回。`;
  }

  if (listStatus.value === 'empty') {
    return `当前目录停留在第 ${displayPageNum.value} 页，共 ${displayPages.value} 页。`;
  }

  return `当前翻阅第 ${displayPageNum.value} 页，共 ${displayPages.value} 页。`;
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
.results-shell,
.list-shell {
  border-radius: 32px;
}

.diary-hero {
  position: relative;
  min-height: 340px;
  padding: 46px 44px;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.7fr);
  gap: 24px;
  align-items: end;
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
.hero-note {
  position: relative;
  z-index: 1;
}

.hero-eyebrow,
.section-eyebrow {
  margin: 0 0 12px;
  color: #c79b1d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.hero-copy {
  h1 {
    margin: 0;
    max-width: 760px;
    color: #111827;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 50px;
    line-height: 1.04;
    font-weight: 700;
    letter-spacing: -0.035em;
  }
}

.hero-description,
.results-description {
  margin: 18px 0 0;
  max-width: 620px;
  color: #475569;
  font-size: 15px;
  line-height: 1.86;
}

.hero-note {
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);

  p {
    margin: 12px 0 0;
    color: #475569;
    font-size: 15px;
    line-height: 1.8;
  }
}

.hero-note-label,
.result-label {
  display: inline-flex;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sort-shell,
.results-shell {
  padding: 28px 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.sort-shell {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.sort-copy,
.results-copy {
  h2 {
    margin: 0;
    color: #111827;
    font-size: 30px;
    line-height: 1.14;
    font-weight: 760;
  }
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
  text-align: left;
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

.sort-label,
.sort-note {
  display: block;
}

.sort-label {
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.sort-note {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.results-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.88fr);
  gap: 26px;
  align-items: end;
}

.loading-copy {
  margin-left: 8px;
  color: #9a7313;
}

.results-summary {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 14px;
}

.summary-card {
  padding: 22px 20px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.04);

  strong {
    display: block;
    margin-top: 10px;
    color: #111827;
    font-size: 30px;
    line-height: 1.04;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 700;
  }

  p {
    margin: 12px 0 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.75;
  }
}

.summary-card-progress {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(249, 250, 251, 0.96) 100%);
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
  .diary-hero,
  .results-shell,
  .sort-shell {
    grid-template-columns: 1fr;
  }

  .sort-shell {
    align-items: stretch;
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
  .sort-shell,
  .results-shell {
    border-radius: 24px;
  }

  .diary-hero {
    min-height: 0;
    padding: 28px 18px;
  }

  .hero-copy h1 {
    font-size: 34px;
  }

  .hero-description,
  .results-description,
  .hero-note p {
    font-size: 14px;
    line-height: 1.8;
  }

  .hero-note,
  .sort-shell,
  .results-shell {
    padding: 20px 18px;
  }

  .sort-copy h2,
  .results-copy h2 {
    font-size: 26px;
  }

  .sort-actions {
    flex-direction: column;
  }

  .results-summary {
    grid-template-columns: 1fr;
  }

  .summary-card {
    padding: 16px;
    border-radius: 20px;

    strong {
      font-size: 24px;
    }
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
