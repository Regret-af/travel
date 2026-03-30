<template>
  <div class="my-diaries-page">
    <AuthDrawer v-model="authDrawerOpen" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="我的日记加载中">
      <div class="loading-hero" />
      <div class="loading-toolbar" />
      <div class="loading-list">
        <div v-for="placeholder in 3" :key="placeholder" class="loading-card" />
      </div>
    </section>

    <DiaryCollectionState
      v-else-if="pageState === 'auth'"
      variant="auth"
      eyebrow="旅行者空间"
      title="登录后，才会展开属于你的日记目录"
      description="这里会集中收纳你写下的旅行日记，方便你继续回看每一篇旅途记录。"
      action-label="立即登录"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="openAuthDrawer"
    />

    <DiaryCollectionState
      v-else-if="pageState === 'error'"
      variant="error"
      eyebrow="连接受阻"
      title="我的日记目录暂时没有顺利展开"
      :description="pageError"
      action-label="重新加载"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="initializePage"
    />

    <template v-else>
      <section class="page-hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">我的日记</p>
          <h1>把已经写下的旅途，整理成自己的私人目录。</h1>
          <p class="hero-description">
            这里会收纳你写下的旅行日记，让那些沿途的风景、心情与片段继续安静地留在你的目录里。
          </p>

          <div class="hero-actions">
            <button class="hero-action hero-action-primary" type="button" @click="goToPublish">
              发布新日记
            </button>
            <button class="hero-action" type="button" @click="goToFavorites">
              查看我的收藏
            </button>
          </div>
        </div>

        <div class="hero-stats">
          <article class="hero-stat">
            <span class="hero-stat-label">当前收录</span>
            <strong>{{ pageData.total.toLocaleString('zh-CN') }}</strong>
            <p>把沿途写下的故事收进这里，方便随时回来翻看。</p>
          </article>
          <article class="hero-stat">
            <span class="hero-stat-label">目录排序</span>
            <strong>{{ currentSortLabel }}</strong>
          </article>
          <article class="hero-stat">
            <span class="hero-stat-label">当前页码</span>
            <strong>第 {{ pageData.pageNum || normalizedRoute.page }} 页</strong>
          </article>
        </div>
      </section>

      <section ref="resultsAnchorRef" class="sort-shell">
        <div class="sort-copy">
          <p class="section-eyebrow">目录排序</p>
          <h2>选择你想翻开的这一册顺序</h2>
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
            <span v-if="option.note" class="sort-note">{{ option.note }}</span>
          </button>
        </div>
      </section>

      <section class="list-shell">
        <div v-if="listStatus === 'loading'" class="loading-list">
          <div v-for="placeholder in 3" :key="placeholder" class="loading-card" />
        </div>

        <div v-else-if="listStatus === 'success'" class="card-list">
          <DiaryShelfCard
            v-for="item in pageData.list"
            :key="item.id"
            :item="item"
            :to="`/diaries/${item.id}`"
            :badge="formatStatusLabel(item.status)"
            badge-tone="slate"
            note="继续翻阅这篇已经收进你目录里的旅行记录"
          />
        </div>

        <DiaryCollectionState
          v-else-if="listStatus === 'empty'"
          variant="empty"
          eyebrow="内容留白"
          title="你的日记目录里暂时还没有公开内容"
          description="现在还没有可展示的旅行日记。等你写下第一篇故事后，这里会形成属于你的私人目录。"
          action-label="去发布日记"
          secondary-label="返回个人中心"
          secondary-to="/account"
          @action="goToPublish"
        />

        <DiaryCollectionState
          v-else
          variant="error"
          eyebrow="加载受阻"
          title="我的日记列表暂时无法读取"
          :description="listError"
          action-label="重新加载"
          secondary-label="返回个人中心"
          secondary-to="/account"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryMagazinePagination from '@/components/diaries/DiaryMagazinePagination.vue';
import DiaryShelfCard from '@/components/diaries/DiaryShelfCard.vue';
import { getMyTravelDiaries, type PageUserDiaryCard, type UserDiaryCard } from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';
type ListStatus = 'loading' | 'success' | 'empty' | 'error';
type SortValue = 'latest' | 'hot';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const resultsAnchorRef = ref<HTMLElement | null>(null);
const pageState = ref<PageState>('loading');
const listStatus = ref<ListStatus>('loading');
const listError = ref('当前无法获取我的日记列表，请稍后重试。');
const pageError = ref('当前无法验证登录信息，请稍后重新进入。');
const pageSize = 6;
const defaultSort: SortValue = 'latest';
const statusLabelMap: Record<number, string> = {
  0: '已下线',
  1: '公开中',
  2: '草稿',
  3: '审核中'
};
const sortOptions: Array<{ value: SortValue; label: string; note: string }> = [
  { value: 'latest', label: '最新发布', note: '' },
  { value: 'hot', label: '热度优先', note: '' }
];
const pageData = ref<PageUserDiaryCard>({
  list: [],
  pageNum: 1,
  pageSize,
  total: 0,
  pages: 0
});
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

const currentSortLabel = computed(
  () => sortOptions.find((option) => option.value === currentSort.value)?.label || sortOptions[0].label
);

const openAuthDrawer = () => {
  authDrawerOpen.value = true;
};

const goToPublish = () => {
  router.push('/account/diaries/new');
};

const goToFavorites = () => {
  router.push('/account/favorites');
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
    path: '/account/diaries',
    query: {
      ...(nextState.sort !== defaultSort ? { sort: nextState.sort } : {}),
      ...(nextState.page > 1 ? { page: String(nextState.page) } : {})
    }
  });
};

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

const fetchList = async () => {
  if (!authStore.token) {
    pageState.value = 'auth';
    return;
  }

  const requestId = ++fetchSequence;
  listStatus.value = 'loading';
  listError.value = '当前无法获取我的日记列表，请稍后重试。';

  try {
    const res = await getMyTravelDiaries({
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

    console.error('Failed to load my diaries', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    listStatus.value = 'error';
    listError.value = getApiErrorMessage(error, '当前无法读取我的日记目录，请稍后重试。');
  }
};

const initializePage = async () => {
  if (!authStore.token) {
    pageState.value = 'auth';
    return;
  }

  pageState.value = 'loading';
  pageError.value = '当前无法验证登录信息，请稍后重新进入。';

  try {
    const user = await authStore.fetchMe();

    if (!authStore.token || !user) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'ready';
    currentSort.value = normalizedRoute.value.sort;
    await fetchList();
  } catch (error) {
    console.error('Failed to initialize my diaries page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = getApiErrorMessage(error, '当前无法进入我的日记页面，请稍后重试。');
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

const formatStatusLabel = (status?: UserDiaryCard['status']) => {
  if (typeof status !== 'number') return '';
  return statusLabelMap[status] || '状态待定';
};

watch(
  () => route.fullPath,
  () => {
    if (pageState.value !== 'ready') return;

    currentSort.value = normalizedRoute.value.sort;
    fetchList();
  }
);

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token && token !== previousToken) {
      initializePage();
      return;
    }

    if (!token) {
      pageState.value = 'auth';
      pageData.value = {
        list: [],
        pageNum: 1,
        pageSize,
        total: 0,
        pages: 0
      };
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.my-diaries-page {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.page-hero,
.sort-shell,
.loading-hero,
.loading-toolbar,
.loading-card {
  border-radius: 32px;
}

.page-hero {
  position: relative;
  overflow: hidden;
  padding: 42px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 26px;
  background:
    radial-gradient(circle at 14% 18%, rgba(34, 211, 238, 0.14), transparent 22%),
    radial-gradient(circle at 88% 16%, rgba(212, 175, 55, 0.16), transparent 20%),
    linear-gradient(140deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.96) 50%, rgba(245, 247, 250, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.hero-eyebrow,
.section-eyebrow {
  margin: 0 0 12px;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-17xl);
  line-height: 1.04;
  font-weight: var(--font-weight-title);
  letter-spacing: -0.04em;
}

.hero-description {
  margin: 18px 0 0;
  max-width: 640px;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.86;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.hero-action {
  min-height: 48px;
  padding: 0 20px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: rgba(255, 255, 255, 0.88);
  color: #334155;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  }
}

.hero-action-primary {
  border-color: rgba(212, 175, 55, 0.24);
  background: #111827;
  color: #f8fafc;

  &:hover {
    border-color: rgba(212, 175, 55, 0.48);
    background: #9a7313;
    color: #111827;
  }
}

.hero-stats {
  display: grid;
  gap: 14px;
}

.hero-stat {
  padding: 22px 20px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.04);

  strong {
    display: block;
    margin-top: 10px;
    color: #111827;
    font-size: var(--font-size-7xl);
    line-height: 1.06;
    font-weight: var(--font-weight-title);
  }

  p {
    margin: 10px 0 0;
    color: #64748b;
    font-size: var(--font-size-md);
    line-height: 1.75;
  }
}

.hero-stat-label {
  color: #64748b;
  font-size: var(--font-size-xs);
  letter-spacing: 0.04em;
}

.sort-shell {
  padding: 28px 30px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.sort-copy h2 {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-8xl);
  line-height: 1.14;
  font-weight: var(--font-weight-title);
}

.sort-actions {
  display: inline-flex;
  gap: 12px;
}

.sort-chip {
  min-width: 168px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.88);
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

.sort-label,
.sort-note {
  display: block;
}

.sort-label {
  color: #111827;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.sort-note {
  margin-top: 6px;
  color: #64748b;
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.card-list,
.loading-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.loading-shell,
.loading-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-toolbar,
.loading-card {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 280px;
}

.loading-toolbar {
  min-height: 116px;
}

.loading-card {
  min-height: 300px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1024px) {
  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .my-diaries-page {
    gap: 22px;
  }

  .page-hero,
  .sort-shell,
  .loading-hero,
  .loading-toolbar,
  .loading-card {
    border-radius: 24px;
  }

  .page-hero,
  .sort-shell {
    padding: 24px 18px;
  }

  .hero-copy h1,
  .sort-copy h2 {
    font-size: var(--font-size-10xl);
  }

  .hero-actions,
  .sort-actions {
    flex-direction: column;
  }

  .hero-action,
  .sort-chip {
    width: 100%;
  }
}
</style>
