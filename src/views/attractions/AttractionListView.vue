<template>
  <div class="attractions-page">
    <section class="directory-hero" :style="heroBackgroundStyle">
      <div class="hero-copy">
        <p class="hero-eyebrow">景点</p>
        <h1>为行程规划筛选值得了解的景点</h1>
        <p class="hero-description">
          这里汇集了适合行程规划时慢慢翻看的景点内容，你可以按关键词、分类和浏览方式找到想了解的地方。
        </p>
      </div>
    </section>

    <section class="filters-shell">
      <form class="search-card" @submit.prevent="handleSearch">
        <div class="section-copy">
          <p class="section-eyebrow">搜索区</p>
          <h2>从一个关键词开始缩小范围</h2>
          <p>输入景点名、目的地印象或一段灵感，先从你最想找的线索开始。</p>
        </div>

        <div class="search-main">
          <el-input
            v-model="searchKeyword"
            class="search-input"
            clearable
            placeholder="搜索景点名称或关键词"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>

          <div class="search-actions">
            <el-button type="primary" round class="search-button" native-type="submit">
              搜索
            </el-button>
            <button
              v-if="hasActiveConditions"
              type="button"
              class="reset-link"
              @click="resetFilters"
            >
              清空条件
            </button>
          </div>
        </div>
      </form>

      <div class="category-card">
        <div class="section-copy">
          <p class="section-eyebrow">分类筛选</p>
          <h2>按单一分类切换浏览方向</h2>
          <p>先挑一个你更想看的方向，让这一轮浏览更集中一些。</p>
        </div>

        <div class="category-strip">
          <button
            class="category-chip"
            :class="{ active: !currentCategoryId }"
            :aria-pressed="!currentCategoryId"
            @click="handleCategoryChange('')"
          >
            全部景点
          </button>

          <template v-if="categoriesStatus === 'success'">
            <button
              v-for="category in categories"
              :key="category.id"
              class="category-chip"
              :class="{ active: currentCategoryId === category.id }"
              :aria-pressed="currentCategoryId === category.id"
              @click="handleCategoryChange(category.id)"
            >
              {{ category.name }}
            </button>
          </template>

          <template v-else-if="categoriesStatus === 'loading'">
            <span
              v-for="placeholder in categoryPlaceholders"
              :key="placeholder"
              class="category-chip skeleton"
            />
          </template>
        </div>

        <p v-if="categoriesStatus === 'error'" class="category-hint">
          分类暂时加载失败，当前仍可直接浏览全部景点并使用关键词搜索。
        </p>
        <button
          v-if="categoriesStatus === 'error'"
          type="button"
          class="category-retry"
          @click="fetchCategories"
        >
          重新加载分类
        </button>
      </div>
    </section>

    <section ref="resultsAnchorRef" class="catalog-toolbar">
      <div class="toolbar-copy">
        <h2>{{ resultHeadline }}</h2>
        <p v-if="isFetching" class="loading-indicator">正在更新列表…</p>
      </div>

      <div class="sort-group">
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

    <section class="results-shell">
      <div v-if="listStatus === 'loading'" class="catalog-grid catalog-grid-loading">
        <div
          v-for="placeholder in cardPlaceholders"
          :key="placeholder"
          class="card-frame"
          :class="cardLayoutClass(placeholder - 1)"
        >
          <div class="loading-card">
            <div class="loading-image" />
            <div class="loading-body">
              <span class="loading-line short" />
              <span class="loading-line medium" />
              <span class="loading-line long" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="listStatus === 'error'" class="state-card">
        <div class="state-mark state-mark-error" />
        <p class="state-eyebrow">目录加载失败</p>
        <h3>景点列表暂时不可用</h3>
        <p class="state-description">{{ listError }}</p>
        <el-button type="primary" round @click="fetchList">
          <el-icon><RefreshRight /></el-icon>
          重新加载
        </el-button>
      </div>

      <div v-else-if="listStatus === 'empty'" class="state-card">
        <div class="state-mark" />
        <p class="state-eyebrow">暂无结果</p>
        <h3>{{ emptyStateTitle }}</h3>
        <p class="state-description">{{ emptyStateDescription }}</p>
        <el-button type="primary" round @click="resetFilters">
          查看全部景点
        </el-button>
      </div>

      <div v-else class="catalog-grid">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="card-frame"
          :class="cardLayoutClass(index)"
        >
          <AttractionCard :item="item" :to="`/attractions/${item.id}`" />
        </div>
      </div>
    </section>

    <section v-if="listStatus === 'success' && totalPages > 1" class="pagination-shell">
      <div class="pagination-panel">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="currentPage"
          :page-size="pageSize"
          :pager-count="isMobile ? 5 : 7"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RefreshRight, Search } from '@element-plus/icons-vue';
import AttractionCard from '@/components/attraction/AttractionCard.vue';
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
const categoryPlaceholders = Array.from({ length: 6 }, (_, index) => index + 1);
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
  if (currentKeyword.value && currentCategoryName.value) {
    return `“${currentKeyword.value}” · ${currentCategoryName.value} 共找到 ${formattedTotal.value} 个景点`;
  }

  if (currentKeyword.value) {
    return `“${currentKeyword.value}” 共找到 ${formattedTotal.value} 个景点`;
  }

  if (currentCategoryName.value) {
    return `${currentCategoryName.value} 共收录 ${formattedTotal.value} 个景点`;
  }

  return `当前列表共收录 ${formattedTotal.value} 个景点`;
});
const heroBackgroundStyle = computed(() => {
  const coverUrl = items.value[0]?.coverUrl;

  return {
    backgroundImage: coverUrl
      ? `linear-gradient(108deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.88) 44%, rgba(255, 255, 255, 0.52) 100%), url(${coverUrl})`
      : 'radial-gradient(circle at 20% 16%, rgba(34, 211, 238, 0.16), transparent 22%), radial-gradient(circle at 82% 20%, rgba(212, 175, 55, 0.18), transparent 20%), linear-gradient(135deg, #f8fafc 0%, #ffffff 62%, #f7fbff 100%)'
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

const cardLayoutClass = (index: number) => {
  if (index === 0) return 'card-frame-lead';
  if (index === 1) return 'card-frame-tall';
  if (index === 5) return 'card-frame-wide';
  if (index === 6) return 'card-frame-side';
  if (index === 7 || index === 8) return 'card-frame-half';
  return 'card-frame-base';
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
};

const handleCategoryChange = (categoryId: string) => {
  updateRoute({
    categoryId,
    page: 1
  });
};

const handleSortChange = (sort: (typeof sortOptions)[number]['value']) => {
  updateRoute({
    sort,
    page: 1
  });
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
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.directory-hero,
.search-card,
.category-card,
.catalog-toolbar,
.results-shell,
.pagination-shell {
  border-radius: 32px;
}

.directory-hero {
  position: relative;
  min-height: 250px;
  padding: 44px;
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
    width: 320px;
    height: 320px;
    right: -72px;
    top: -110px;
    background: rgba(255, 255, 255, 0.28);
    filter: blur(10px);
  }

  &::after {
    width: 220px;
    height: 220px;
    right: 20%;
    bottom: -120px;
    background: rgba(34, 211, 238, 0.1);
    filter: blur(12px);
  }
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: min(860px, 100%);
}

.hero-eyebrow,
.section-eyebrow,
.state-eyebrow {
  margin: 0 0 10px;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-copy {
  h1 {
    margin: 0;
    max-width: 700px;
    font-size: var(--font-size-16xl);
    line-height: 1.08;
    font-weight: var(--font-weight-display);
    letter-spacing: -0.03em;
  }
}

.hero-description,
.section-copy p:last-child,
.state-description {
  margin: 16px 0 0;
  max-width: 620px;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.86;
}

.filters-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 22px;
}

.search-card,
.category-card,
.catalog-toolbar,
.results-shell,
.pagination-shell {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.search-card,
.category-card {
  padding: 28px;
}

.section-copy {
  h2 {
    margin: 0;
    font-size: var(--font-size-7xl);
    line-height: 1.18;
    font-weight: var(--font-weight-title);
    color: #111827;
  }
}

.search-main {
  margin-top: 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.08), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.95) 100%);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.search-input {
  flex: 1;

  :deep(.el-input__wrapper) {
    min-height: 54px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.95) inset;
    transition: box-shadow 0.28s ease, transform 0.28s ease;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.3) inset;
    transform: translateY(-1px);
  }
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.search-button {
  min-width: 132px;
  height: 50px;
  padding: 0 24px;
  background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  border: none;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

.reset-link {
  padding: 0;
  color: #64748b;
  font-size: var(--font-size-md);
  background: transparent;
  transition: color 0.25s ease;

  &:hover {
    color: #0f172a;
  }
}

.category-strip {
  margin-top: 22px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.category-chip,
.sort-chip {
  border: 1px solid rgba(203, 213, 225, 0.9);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
}

.category-chip {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #475569;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);

  &:hover,
  &.active {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.45);
    background: rgba(212, 175, 55, 0.12);
    color: #9a7313;
    box-shadow: 0 12px 24px rgba(212, 175, 55, 0.08);
  }

  &.skeleton {
    min-width: 92px;
    background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.8));
    background-size: 200% 100%;
    border-color: transparent;
    pointer-events: none;
    animation: shimmer 1.4s linear infinite;
  }
}

.category-hint {
  margin: 16px 0 0;
  color: #64748b;
  font-size: var(--font-size-md);
  line-height: 1.7;
}

.category-retry {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border: 1px solid rgba(203, 213, 225, 0.9);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(34, 211, 238, 0.3);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  }
}

.catalog-toolbar {
  padding: 26px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.toolbar-copy {
  flex: 1;

  h2 {
    margin: 0;
    font-size: var(--font-size-8xl);
    line-height: 1.2;
    font-weight: var(--font-weight-title);
    color: #111827;
  }
}

.loading-indicator {
  margin: 10px 0 0;
  color: #9a7313;
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.sort-group {
  display: inline-flex;
  gap: 10px;
  flex-shrink: 0;
}

.sort-chip {
  min-width: 136px;
  padding: 13px 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  &:hover,
  &.active {
    transform: translateY(-2px);
    border-color: rgba(34, 211, 238, 0.36);
    background: rgba(248, 250, 252, 0.98);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  }
}

.sort-label {
  display: block;
  color: #111827;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.results-shell {
  padding: 26px;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 74px;
  gap: 20px;
}

.card-frame {
  min-height: 0;

  :deep(.attraction-card) {
    height: 100%;
  }
}

.card-frame-lead {
  grid-column: span 7;
  grid-row: span 6;
}

.card-frame-tall {
  grid-column: span 5;
  grid-row: span 6;
}

.card-frame-base {
  grid-column: span 4;
  grid-row: span 4;
}

.card-frame-wide {
  grid-column: span 8;
  grid-row: span 5;
}

.card-frame-side {
  grid-column: span 4;
  grid-row: span 5;
}

.card-frame-half {
  grid-column: span 6;
  grid-row: span 4;
}

.loading-card {
  height: 100%;
  overflow: hidden;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
}

.loading-image {
  height: 68%;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.75), rgba(241, 245, 249, 0.92), rgba(226, 232, 240, 0.75));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;
}

.loading-body {
  padding: 18px;
}

.loading-line {
  display: block;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.75), rgba(241, 245, 249, 0.92), rgba(226, 232, 240, 0.75));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;

  & + & {
    margin-top: 10px;
  }

  &.short {
    width: 38%;
  }

  &.medium {
    width: 62%;
  }

  &.long {
    width: 82%;
  }
}

.state-card {
  min-height: 460px;
  padding: 44px 24px;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.1), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.98) 100%);

  h3 {
    margin: 0;
    font-size: var(--font-size-10xl);
    line-height: 1.14;
    color: #111827;
  }

  .state-description {
    max-width: 520px;
  }

  :deep(.el-button) {
    margin-top: 24px;
    min-width: 150px;
  }
}

.state-mark {
  width: 84px;
  height: 84px;
  margin-bottom: 18px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 35%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(212, 175, 55, 0.24) 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);

  &.state-mark-error {
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 35%),
      linear-gradient(135deg, rgba(248, 113, 113, 0.26) 0%, rgba(251, 191, 36, 0.22) 100%);
  }
}

.pagination-shell {
  padding: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-panel {
  min-width: 340px;
  padding: 20px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(226, 232, 240, 0.85);
}

:deep(.el-pagination) {
  justify-content: center;
  flex-wrap: wrap;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  min-width: 40px;
  height: 40px;
  border-radius: 14px !important;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  box-shadow: none !important;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    background 0.25s ease;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .el-pager li:hover),
:deep(.el-pagination .el-pager li.is-active) {
  transform: translateY(-1px);
  border-color: rgba(212, 175, 55, 0.45);
  background: rgba(212, 175, 55, 0.12);
  color: #9a7313;
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
  .directory-hero,
  .filters-shell {
    grid-template-columns: 1fr;
  }

  .catalog-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .sort-group {
    width: 100%;
  }

  .sort-chip {
    flex: 1;
  }

  .pagination-panel {
    min-width: 0;
  }
}

@media (max-width: 1024px) {
  .catalog-grid {
    grid-auto-rows: 78px;
  }

  .card-frame-lead,
  .card-frame-tall,
  .card-frame-base,
  .card-frame-wide,
  .card-frame-side,
  .card-frame-half {
    grid-column: span 6;
  }

  .card-frame-lead,
  .card-frame-tall,
  .card-frame-wide,
  .card-frame-side {
    grid-row: span 5;
  }

  .card-frame-base,
  .card-frame-half {
    grid-row: span 4;
  }
}

@media (max-width: 767px) {
  .attractions-page {
    gap: 22px;
  }

  .directory-hero,
  .search-card,
  .category-card,
  .catalog-toolbar,
  .results-shell,
  .pagination-shell {
    border-radius: 24px;
  }

  .directory-hero {
    min-height: 0;
    padding: 26px 18px;
    gap: 20px;
  }

  .hero-copy h1,
  .toolbar-copy h2,
  .section-copy h2 {
    font-size: var(--font-size-7xl);
  }

  .hero-description,
  .section-copy p:last-child,
  .state-description {
    font-size: var(--font-size-md);
  }

  .search-card,
  .category-card,
  .catalog-toolbar,
  .results-shell,
  .pagination-shell {
    padding: 20px 18px;
  }

  .search-main {
    flex-direction: column;
    align-items: stretch;
    padding: 14px;
    border-radius: 22px;
  }

  .search-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-button {
    flex: 1;
  }

  .category-strip {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .category-strip::-webkit-scrollbar {
    display: none;
  }

  .category-chip {
    flex-shrink: 0;
  }

  .catalog-toolbar {
    align-items: stretch;
  }

  .sort-group {
    flex-direction: column;
  }

  .sort-chip {
    width: 100%;
  }

  .catalog-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }

  .card-frame-lead,
  .card-frame-tall,
  .card-frame-base,
  .card-frame-wide,
  .card-frame-side,
  .card-frame-half {
    grid-column: span 1;
    grid-row: span 1;
    min-height: 360px;
  }

  .loading-card {
    border-radius: 20px;
  }

  .state-card {
    min-height: 380px;
    padding: 34px 18px;

    h3 {
      font-size: var(--font-size-7xl);
    }
  }

}
</style>
