<template>
  <div class="my-favorites-page">
    <AuthDrawer v-model="authDrawerOpen" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="我的收藏加载中">
      <div class="loading-hero" />
      <div class="loading-list">
        <div v-for="placeholder in 3" :key="placeholder" class="loading-card" />
      </div>
    </section>

    <DiaryCollectionState
      v-else-if="pageState === 'auth'"
      variant="auth"
      eyebrow="旅行者空间"
      title="登录后，才会看到你保存下来的日记清单"
      description="这里集中展示你收藏过的旅行日记，方便你随时回来继续翻阅。"
      action-label="立即登录"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="openAuthDrawer"
    />

    <DiaryCollectionState
      v-else-if="pageState === 'error'"
      variant="error"
      eyebrow="连接受阻"
      title="我的收藏页暂时没有顺利展开"
      :description="pageError"
      action-label="重新加载"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="initializePage"
    />

    <template v-else>
      <section class="page-hero">
        <div class="hero-overlay">
          <div class="hero-copy">
            <h1>我的收藏</h1>
            <p class="hero-description">这里收纳你保存下来的旅行日记</p>
          </div>
        </div>
      </section>

      <section class="content-shell">
        <div class="content-toolbar">
          <div>
            <h2>全部收藏</h2>
            <p class="catalog-summary">{{ favoriteSummary }}</p>
            <p v-if="invalidCount > 0" class="invalid-summary">
              其中 {{ invalidCount }} 篇暂不可访问，已在列表中标记。
            </p>
          </div>

          <button class="sort-button" type="button" aria-label="当前排序方式">
            <span>排序方式：最近收藏</span>
            <el-icon><ArrowDown /></el-icon>
          </button>
        </div>

        <div v-if="listStatus === 'loading'" class="loading-list">
          <div v-for="placeholder in pageSize" :key="placeholder" class="loading-card" />
        </div>

        <div v-else-if="listStatus === 'success'" class="favorites-grid">
          <article
            v-for="item in pageData.list"
            :key="`${item.id}-${item.invalid ? 'invalid' : 'valid'}`"
            class="favorite-card-frame"
            :class="{ invalid: item.invalid }"
            @click.capture="handleInvalidCardClick($event, item.invalid)"
          >
            <span class="favorite-mark">已收藏</span>
            <span v-if="item.invalid" class="invalid-mask">暂不可访问</span>
            <DiaryEditorialCard :item="item" />
          </article>
        </div>

        <DiaryCollectionState
          v-else-if="listStatus === 'empty'"
          variant="empty"
          eyebrow="目录留白"
          title="你还没有收藏任何旅行日记"
          description="现在还没有可展示的收藏内容。去日记列表里继续翻阅，遇到想留下的故事，再把它带回这里。"
          action-label="去看旅行日记"
          secondary-label="返回个人中心"
          secondary-to="/account"
          @action="goToDiaryList"
        />

        <DiaryCollectionState
          v-else
          variant="error"
          eyebrow="加载受阻"
          title="我的收藏列表暂时无法读取"
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryEditorialCard from '@/components/diaries/DiaryEditorialCard.vue';
import DiaryMagazinePagination from '@/components/diaries/DiaryMagazinePagination.vue';
import { getMyFavoriteDiaries, type PageFavoriteDiaryCard } from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';
type ListStatus = 'loading' | 'success' | 'empty' | 'error';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const pageState = ref<PageState>('loading');
const listStatus = ref<ListStatus>('loading');
const pageError = ref('当前无法验证登录信息，请稍后重新进入。');
const listError = ref('当前无法获取我的收藏列表，请稍后重试。');
const pageSize = 6;
const pageData = ref<PageFavoriteDiaryCard>({
  list: [],
  pageNum: 1,
  pageSize,
  total: 0,
  pages: 0
});
let fetchSequence = 0;

const currentPage = computed(() => {
  const routePage = Number(route.query.page || 1);
  return Number.isFinite(routePage) && routePage > 0 ? routePage : 1;
});

const invalidCount = computed(() => pageData.value.list.filter((item) => item.invalid).length);
const formattedTotal = computed(() => pageData.value.total.toLocaleString('zh-CN'));
const favoriteSummary = computed(() => {
  if (listStatus.value === 'loading') return '收藏目录正在加载';
  if (listStatus.value === 'error') return '收藏目录暂时无法读取';
  if (listStatus.value === 'empty') return '暂未收藏可展示的旅行日记';

  return `当前共收藏 ${formattedTotal.value} 篇旅行日记`;
});
const openAuthDrawer = () => {
  authDrawerOpen.value = true;
};

const goToDiaryList = () => {
  router.push('/diaries');
};

const updateRoute = (page: number) => {
  if (page === currentPage.value) return;

  router.push({
    path: '/account/favorites',
    query: {
      ...(page > 1 ? { page: String(page) } : {})
    }
  });
};

const fetchList = async () => {
  if (!authStore.token) {
    pageState.value = 'auth';
    return;
  }

  const requestId = ++fetchSequence;
  listStatus.value = 'loading';
  listError.value = '当前无法获取我的收藏列表，请稍后重试。';

  try {
    const res = await getMyFavoriteDiaries({
      pageNum: currentPage.value,
      pageSize
    });

    if (requestId !== fetchSequence) return;

    const data = res.data;

    if (data.pages > 0 && currentPage.value > data.pages) {
      updateRoute(data.pages);
      return;
    }

    if (data.pages === 0 && currentPage.value > 1) {
      updateRoute(1);
      return;
    }

    pageData.value = {
      list: data.list,
      pageNum: data.pageNum,
      pageSize: data.pageSize || pageSize,
      total: data.total,
      pages: data.pages
    };
    listStatus.value = data.list.length ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== fetchSequence) return;

    console.error('Failed to load my favorites', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    listStatus.value = 'error';
    listError.value = getApiErrorMessage(error, '当前无法读取我的收藏目录，请稍后重试。');
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
    await fetchList();
  } catch (error) {
    console.error('Failed to initialize favorites page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = getApiErrorMessage(error, '当前无法进入我的收藏页面，请稍后重试。');
  }
};

const handlePageChange = (page: number) => {
  updateRoute(page);
};

const handleInvalidCardClick = (event: MouseEvent, invalid?: boolean) => {
  if (!invalid) return;
  event.preventDefault();
  event.stopPropagation();
};

watch(
  () => route.fullPath,
  () => {
    if (pageState.value === 'ready') {
      fetchList();
    }
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
.my-favorites-page {
  width: min(100%, 1400px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary);
}

.page-hero {
  position: relative;
  min-height: 400px;
  margin: -88px -24px 0;
  overflow: hidden;
  background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85');
  background-position: center;
  background-size: cover;
}

.hero-overlay {
  min-height: inherit;
  padding: 116px 32px 64px;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.34) 100%);
}

.hero-copy {
  width: min(100%, 1400px);
  margin: 0 auto;
}

.hero-copy h1 {
  margin: 0;
  color: #ffffff;
  font-size: var(--font-size-hero);
  line-height: 1.2;
  font-weight: var(--font-weight-display);
}

.hero-description {
  margin: 10px 0 0;
  max-width: 640px;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-5xl);
  line-height: 1.4;
  font-weight: var(--font-weight-semibold);
}

.content-shell {
  padding: 48px 32px 24px;
}

.content-toolbar {
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-title-lg);
    line-height: 1.3;
    font-weight: var(--font-weight-title);
  }

}

.catalog-summary {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: 1.6;
}

.invalid-summary {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.sort-button {
  min-height: 48px;
  padding: 0 22px;
  border-radius: var(--radius-chip);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: #ffffff;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.favorites-grid,
.loading-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
}

.favorite-card-frame {
  position: relative;
  min-width: 0;
  min-height: 100%;

  :deep(.diary-card) {
    height: 100%;
  }

  &.invalid {
    opacity: 0.72;
  }
}

.favorite-mark,
.invalid-mask {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-chip);
  backdrop-filter: blur(12px);
}

.favorite-mark {
  top: 16px;
  right: 16px;
  min-height: 38px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.82);
  color: #005bad;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.invalid-mask {
  inset: 16px 16px auto auto;
  min-height: 38px;
  padding: 0 14px;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.favorite-card-frame.invalid .favorite-mark {
  display: none;
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-card {
  border-radius: var(--radius-card);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 320px;
  border-radius: var(--radius-panel);
}

.loading-card {
  min-height: 590px;
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
  .favorites-grid,
  .loading-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .page-hero {
    min-height: 320px;
    margin: -88px -24px 0;
  }

  .hero-overlay {
    padding: 104px 18px 42px;
  }

  .hero-copy h1 {
    font-size: var(--font-size-11xl);
  }

  .hero-description {
    font-size: var(--font-size-xl);
  }

  .content-shell {
    padding: 34px 0 16px;
  }

  .content-toolbar {
    align-items: stretch;
    flex-direction: column;
    margin-bottom: 28px;

    h2 {
      font-size: var(--font-size-8xl);
    }
  }

  .sort-button {
    width: 100%;
    justify-content: center;
  }

  .favorites-grid,
  .loading-list {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .loading-card {
    min-height: 500px;
  }
}
</style>
