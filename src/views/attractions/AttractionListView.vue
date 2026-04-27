<template>
  <div class="attractions-page">
    <section class="directory-hero" :style="heroBackgroundStyle">
      <div class="hero-overlay" />
      <div class="hero-copy">
        <h1>发现不凡之美</h1>
        <p>
          为您精心挑选全球最动人的旅行目的地，专为追求极致体验的旅行者打造。
        </p>
      </div>
    </section>

    <section class="filter-panel">
      <form class="filter-grid" @submit.prevent="handleSearch">
        <label class="filter-field">
          <span class="field-icon">
            <el-icon><Location /></el-icon>
          </span>
          <span class="field-copy">
            <span class="field-label">去哪里</span>
            <el-input
              v-model="searchKeyword"
              class="field-control keyword-input"
              clearable
              placeholder="搜索景点名称或关键词"
              @keyup.enter="handleSearch"
            />
          </span>
        </label>

        <label class="filter-field">
          <span class="field-icon">
            <el-icon><CollectionTag /></el-icon>
          </span>
          <span class="field-copy">
            <span class="field-label">体验类型</span>
            <el-select
              v-model="currentCategoryId"
              class="field-control"
              placeholder="全部类型"
              @change="handleCategoryChange"
            >
              <el-option label="全部类型" value="" />
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </span>
        </label>

        <label class="filter-field">
          <span class="field-icon">
            <el-icon><Sort /></el-icon>
          </span>
          <span class="field-copy">
            <span class="field-label">浏览方式</span>
            <el-select
              v-model="currentSort"
              class="field-control"
              @change="handleSortChange"
            >
              <el-option
                v-for="option in sortOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </span>
        </label>

        <div class="filter-actions">
          <el-button type="primary" class="explore-button" native-type="submit">
            开启探索
          </el-button>
          <button
            v-if="hasActiveConditions"
            type="button"
            class="reset-button"
            @click="resetFilters"
          >
            清空条件
          </button>
        </div>
      </form>

      <p v-if="categoriesStatus === 'error'" class="category-hint">
        分类暂时加载失败，当前仍可直接浏览全部景点并使用关键词搜索。
        <button type="button" @click="fetchCategories">重新加载分类</button>
      </p>
    </section>

    <section ref="resultsAnchorRef" class="catalog-heading">
      <div>
        <p class="section-eyebrow">精选景点</p>
        <h2>{{ resultHeadline }}</h2>
        <p>探索我们为您精心挑选的旅行故事。</p>
      </div>
      <p v-if="isFetching" class="loading-indicator">正在更新列表...</p>
    </section>

    <section class="results-shell">
      <div v-if="listStatus === 'loading'" class="attraction-grid">
        <article
          v-for="placeholder in cardPlaceholders"
          :key="placeholder"
          class="loading-card"
        >
          <div class="loading-image" />
          <div class="loading-body">
            <span class="loading-chip" />
            <span class="loading-line short" />
            <span class="loading-line medium" />
            <span class="loading-line long" />
          </div>
        </article>
      </div>

      <div v-else-if="listStatus === 'error'" class="state-card">
        <p class="section-eyebrow">目录加载失败</p>
        <h3>景点列表暂时不可用</h3>
        <p>{{ listError }}</p>
        <el-button type="primary" round @click="fetchList">
          <el-icon><RefreshRight /></el-icon>
          重新加载
        </el-button>
      </div>

      <div v-else-if="listStatus === 'empty'" class="state-card">
        <p class="section-eyebrow">暂无结果</p>
        <h3>{{ emptyStateTitle }}</h3>
        <p>{{ emptyStateDescription }}</p>
        <el-button type="primary" round @click="resetFilters">
          查看全部景点
        </el-button>
      </div>

      <div v-else class="attraction-grid">
        <AttractionListCard
          v-for="item in items"
          :key="item.id"
          :item="item"
        />
      </div>
    </section>

    <section v-if="listStatus === 'success' && totalPages > 1" class="pagination-shell">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :pager-count="isMobile ? 5 : 7"
        :total="total"
        @current-change="handlePageChange"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CollectionTag, Location, RefreshRight, Sort } from '@element-plus/icons-vue';
import AttractionListCard from '@/components/attraction/AttractionListCard.vue';
import {
  getAttractionCategories,
  searchAttractions,
  type AttractionCard as AttractionCardType,
  type AttractionCategory
} from '@/api/attractions';

const router = useRouter();
const route = useRoute();

const pageSize = 9;
const defaultSort = 'latest';
const sortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热门探索' }
] as const;

const items = ref<AttractionCardType[]>([]);
const categories = ref<AttractionCategory[]>([]);
const listStatus = ref<'loading' | 'success' | 'empty' | 'error'>('loading');
const categoriesStatus = ref<'loading' | 'success' | 'error'>('loading');
const listError = ref('');
const searchKeyword = ref('');
const currentKeyword = ref('');
const currentCategoryId = ref('');
const currentSort = ref<(typeof sortOptions)[number]['value']>(defaultSort);
const currentPage = ref(1);
const total = ref(0);
const totalPages = ref(0);
const isFetching = ref(false);
const isMobile = ref(false);
const resultsAnchorRef = ref<HTMLElement | null>(null);
const cardPlaceholders = Array.from({ length: pageSize }, (_, index) => index + 1);
let fetchSequence = 0;

const normalizedRoute = computed(() => {
  const routePage = Number(route.query.page || 1);
  const routeSort = String(route.query.sort || defaultSort).trim();

  return {
    keyword: String(route.query.keyword || '').trim(),
    categoryId: String(route.query.categoryId || '').trim(),
    sort: sortOptions.some((option) => option.value === routeSort) ? routeSort : defaultSort,
    page: Number.isFinite(routePage) && routePage > 0 ? routePage : 1
  };
});

const currentCategoryName = computed(
  () => categories.value.find((category) => category.id === currentCategoryId.value)?.name || ''
);
const formattedTotal = computed(() => total.value.toLocaleString('zh-CN'));
const hasActiveConditions = computed(
  () => Boolean(currentKeyword.value || currentCategoryId.value || currentSort.value !== defaultSort)
);
const resultHeadline = computed(() => {
  if (listStatus.value === 'loading') return '景点目录正在加载';
  if (listStatus.value === 'error') return '景点目录暂时无法读取';
  if (listStatus.value === 'empty') return '暂未找到匹配景点';

  if (currentKeyword.value && currentCategoryName.value) {
    return `“${currentKeyword.value}” · ${currentCategoryName.value} 共找到 ${formattedTotal.value} 个景点`;
  }

  if (currentKeyword.value) {
    return `“${currentKeyword.value}” 共找到 ${formattedTotal.value} 个景点`;
  }

  if (currentCategoryName.value) {
    return `${currentCategoryName.value} 共收录 ${formattedTotal.value} 个景点`;
  }

  return `当前共收录 ${formattedTotal.value} 个精选景点`;
});
const heroBackgroundStyle = computed(() => {
  const coverUrl = items.value[0]?.coverUrl;

  return {
    backgroundImage: coverUrl
      ? `url(${coverUrl})`
      : 'linear-gradient(135deg, #0f172a 0%, #005bad 52%, #5ea2ff 100%)'
  };
});
const emptyStateTitle = computed(() =>
  hasActiveConditions.value ? '未找到匹配的景点' : '景点列表暂时还没有内容'
);
const emptyStateDescription = computed(() =>
  hasActiveConditions.value
    ? '可以尝试缩短关键词、切换分类，或恢复到默认排序后重新浏览。'
    : '当前页暂无可展示的景点，你可以稍后再来查看。'
);

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const scrollToResults = () => {
  nextTick(() => {
    const targetTop = resultsAnchorRef.value?.getBoundingClientRect().top;

    if (typeof targetTop !== 'number') return;

    window.scrollTo({
      top: Math.max(window.scrollY + targetTop - 108, 0),
      behavior: 'smooth'
    });
  });
};

const fetchList = async () => {
  const requestId = ++fetchSequence;
  isFetching.value = true;
  listError.value = '';
  listStatus.value = 'loading';
  total.value = 0;
  totalPages.value = 0;

  try {
    const res = await searchAttractions({
      keyword: currentKeyword.value || undefined,
      categoryId: currentCategoryId.value || undefined,
      pageNum: currentPage.value,
      pageSize,
      sort: currentSort.value
    });

    if (requestId !== fetchSequence) return;

    const pageData = res.data;

    if (pageData.pages > 0 && currentPage.value > pageData.pages) {
      updateRoute({ page: pageData.pages });
      return;
    }

    if (pageData.pages === 0 && currentPage.value > 1) {
      updateRoute({ page: 1 });
      return;
    }

    items.value = pageData.list;
    total.value = pageData.total;
    totalPages.value = pageData.pages;
    listStatus.value = pageData.list.length ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== fetchSequence) return;

    console.error('Failed to load attractions', error);
    items.value = [];
    total.value = 0;
    totalPages.value = 0;
    listStatus.value = 'error';
    listError.value = '当前无法获取景点列表，请稍后重试。';
  } finally {
    if (requestId === fetchSequence) {
      isFetching.value = false;
    }
  }
};

const fetchCategories = async () => {
  categoriesStatus.value = 'loading';

  try {
    const res = await getAttractionCategories({ skipErrorToast: true });
    categories.value = [...(res.data || [])].sort((a, b) => {
      const currentOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const nextOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return currentOrder - nextOrder;
    });
    categoriesStatus.value = 'success';
  } catch (error) {
    console.error('Failed to load attraction categories', error);
    categories.value = [];
    categoriesStatus.value = 'error';
  }
};

const updateRoute = (payload: {
  keyword?: string;
  categoryId?: string;
  sort?: (typeof sortOptions)[number]['value'];
  page?: number;
}) => {
  const nextState = {
    keyword: payload.keyword ?? currentKeyword.value,
    categoryId: payload.categoryId ?? currentCategoryId.value,
    sort: payload.sort ?? currentSort.value,
    page: payload.page ?? currentPage.value
  };

  if (
    normalizedRoute.value.keyword === nextState.keyword &&
    normalizedRoute.value.categoryId === nextState.categoryId &&
    normalizedRoute.value.sort === nextState.sort &&
    normalizedRoute.value.page === nextState.page
  ) {
    return;
  }

  router.push({
    path: '/attractions',
    query: {
      ...(nextState.keyword ? { keyword: nextState.keyword } : {}),
      ...(nextState.categoryId ? { categoryId: nextState.categoryId } : {}),
      ...(nextState.sort !== defaultSort ? { sort: nextState.sort } : {}),
      ...(nextState.page > 1 ? { page: String(nextState.page) } : {})
    }
  });
};

const syncFromRoute = () => {
  currentKeyword.value = normalizedRoute.value.keyword;
  currentCategoryId.value = normalizedRoute.value.categoryId;
  currentSort.value = normalizedRoute.value.sort as (typeof sortOptions)[number]['value'];
  currentPage.value = normalizedRoute.value.page;
  searchKeyword.value = normalizedRoute.value.keyword;
  fetchList();
};

const handleSearch = () => {
  updateRoute({
    keyword: searchKeyword.value.trim(),
    page: 1
  });
  scrollToResults();
};

const handleCategoryChange = (categoryId: string) => {
  updateRoute({
    categoryId,
    page: 1
  });
  scrollToResults();
};

const handleSortChange = (sort: (typeof sortOptions)[number]['value']) => {
  updateRoute({
    sort,
    page: 1
  });
  scrollToResults();
};

const handlePageChange = (page: number) => {
  updateRoute({ page });
  scrollToResults();
};

const resetFilters = () => {
  searchKeyword.value = '';
  updateRoute({
    keyword: '',
    categoryId: '',
    sort: defaultSort,
    page: 1
  });
  scrollToResults();
};

watch(
  () => route.fullPath,
  () => {
    syncFromRoute();
  },
  { immediate: true }
);

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);
  fetchCategories();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
});
</script>

<style scoped lang="scss">
.attractions-page {
  width: min(100%, 1400px);
  margin: 0 auto;
  color: var(--color-text-primary);
}

.directory-hero {
  position: relative;
  min-height: 665px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--radius-panel);
  background-position: center;
  background-size: cover;
  isolation: isolate;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.38) 0%, rgba(15, 23, 42, 0.12) 48%, rgba(247, 249, 251, 0.94) 100%),
    linear-gradient(90deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.08));
}

.hero-copy {
  width: min(760px, calc(100% - 48px));
  text-align: center;
  color: #ffffff;
}

.hero-copy h1 {
  margin: 24px 0 18px;
  font-size: var(--font-size-hero);
  line-height: 1.08;
  font-weight: var(--font-weight-display);
  letter-spacing: 0;
  text-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
}

.hero-copy p {
  max-width: 680px;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-2xl);
  line-height: 1.8;
  text-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
}

.filter-panel {
  position: relative;
  z-index: 2;
  margin: -96px 32px 0;
  padding: 24px;
  border-radius: var(--radius-panel);
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.2fr) minmax(220px, 0.8fr) minmax(220px, 0.8fr) auto;
  gap: 18px;
  align-items: stretch;
}

.filter-field {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 14px 18px;
  border-radius: 22px;
  border: 1px solid rgba(226, 232, 240, 0.74);
  background: rgba(255, 255, 255, 0.58);
}

.field-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-chip);
  color: #005bad;
  background: rgba(94, 162, 255, 0.12);
}

.field-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
}

.field-control {
  width: 100%;
}

.field-control :deep(.el-input__wrapper),
.field-control :deep(.el-select__wrapper) {
  min-height: 30px;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none !important;
}

.field-control :deep(.el-input__inner),
.field-control :deep(.el-select__placeholder),
.field-control :deep(.el-select__selected-item) {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.explore-button {
  min-width: 132px;
  height: 72px;
  padding: 0 28px;
  border: none;
  border-radius: 22px;
  background: #005bad;
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-control);
}

.reset-button {
  white-space: nowrap;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  background: transparent;
}

.category-hint {
  margin: 16px 4px 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  button {
    margin-left: 8px;
    color: #005bad;
    font-weight: var(--font-weight-bold);
    background: transparent;
  }
}

.catalog-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 92px 32px 52px;
}

.section-eyebrow {
  margin: 0 0 10px;
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.catalog-heading h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-title-lg);
  line-height: 1.16;
  font-weight: var(--font-weight-title);
  letter-spacing: 0;
}

.catalog-heading p:not(.section-eyebrow):not(.loading-indicator) {
  max-width: 680px;
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-lg);
  line-height: 1.85;
}

.loading-indicator {
  flex-shrink: 0;
  margin: 0;
  color: var(--color-accent-strong);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.results-shell {
  padding: 0 32px;
}

.attraction-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
}

.loading-card {
  overflow: hidden;
  min-height: 360px;
  border-radius: 24px;
  background: var(--color-surface-soft);
  border: 1px solid rgba(226, 232, 240, 0.72);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.05);
}

.loading-image {
  aspect-ratio: 4 / 3;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.78), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.78));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;
}

.loading-body {
  padding: 28px;
}

.loading-chip,
.loading-line {
  display: block;
  border-radius: var(--radius-chip);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.78), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.78));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;
}

.loading-chip {
  width: 104px;
  height: 30px;
  margin-bottom: 18px;
}

.loading-line {
  height: 12px;
  margin-top: 12px;
}

.loading-line.short {
  width: 48%;
}

.loading-line.medium {
  width: 72%;
}

.loading-line.long {
  width: 88%;
}

.state-card {
  min-height: 420px;
  padding: 56px 24px;
  border-radius: var(--radius-panel);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98));
  border: 1px solid rgba(226, 232, 240, 0.78);
  text-align: center;
  box-shadow: var(--shadow-panel);
}

.state-card h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-9xl);
  line-height: 1.18;
}

.state-card p:not(.section-eyebrow) {
  max-width: 560px;
  margin: 16px auto 0;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.state-card :deep(.el-button) {
  margin-top: 28px;
}

.pagination-shell {
  display: flex;
  justify-content: center;
  padding: 56px 32px 8px;
}

:deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: center;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  min-width: 42px;
  height: 42px;
  border-radius: 16px !important;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-secondary);
  box-shadow: none !important;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .el-pager li:hover),
:deep(.el-pagination .el-pager li.is-active) {
  background: #005bad;
  color: #ffffff;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1180px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: span 2;
  }

  .explore-button {
    flex: 1;
  }

  .attraction-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .attractions-page {
    width: 100%;
  }

  .directory-hero {
    min-height: 520px;
    border-radius: var(--radius-card);
  }

  .hero-copy {
    width: calc(100% - 36px);
  }

  .hero-copy h1 {
    font-size: var(--font-size-12xl);
  }

  .hero-copy p {
    font-size: var(--font-size-lg);
  }

  .filter-panel {
    margin: -76px 12px 0;
    padding: 16px;
    border-radius: var(--radius-card);
  }

  .filter-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-actions {
    grid-column: span 1;
    flex-direction: column;
    align-items: stretch;
  }

  .explore-button {
    width: 100%;
    height: 56px;
  }

  .reset-button {
    min-height: 38px;
  }

  .catalog-heading {
    flex-direction: column;
    align-items: stretch;
    padding: 64px 18px 34px;
  }

  .catalog-heading h2 {
    font-size: var(--font-size-8xl);
  }

  .catalog-heading p:not(.section-eyebrow):not(.loading-indicator) {
    font-size: var(--font-size-base);
  }

  .results-shell {
    padding: 0 18px;
  }

  .attraction-grid {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .state-card {
    min-height: 360px;
    border-radius: var(--radius-card);
  }

  .state-card h3 {
    font-size: var(--font-size-7xl);
  }

  .pagination-shell {
    padding: 40px 18px 0;
  }
}
</style>
