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
      description="这里集中展示你收藏过的旅行日记，并保留失效收藏的独立视觉状态。"
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
        <div class="hero-copy">
          <p class="hero-eyebrow">我的收藏</p>
          <h1>把想再次翻阅的旅途，留在自己的私藏目录里。</h1>
          <p class="hero-description">
            收藏页不做批量管理和收藏夹扩展，只保留分页浏览。如果某篇内容已经失效，它仍会留在目录里，并以独立状态呈现。
          </p>
        </div>

        <div class="hero-stats">
          <article class="hero-stat">
            <span class="hero-stat-label">当前收藏</span>
            <strong>{{ pageData.total.toLocaleString('zh-CN') }}</strong>
            <p>按收藏顺序分页展示你保存过的内容。</p>
          </article>
          <article class="hero-stat">
            <span class="hero-stat-label">本页失效</span>
            <strong>{{ invalidCount }}</strong>
            <p>失效收藏不会消失，而是保留独立视觉状态。</p>
          </article>
          <article class="hero-stat">
            <span class="hero-stat-label">当前页码</span>
            <strong>第 {{ pageData.pageNum || currentPage }} 页</strong>
            <p>目录体验保持轻量，不引入无限滚动。</p>
          </article>
        </div>
      </section>

      <section class="list-shell">
        <div v-if="listStatus === 'loading'" class="loading-list">
          <div v-for="placeholder in 3" :key="placeholder" class="loading-card" />
        </div>

        <div v-else-if="listStatus === 'success'" class="card-list">
          <DiaryShelfCard
            v-for="item in pageData.list"
            :key="`${item.id}-${item.invalid ? 'invalid' : 'valid'}`"
            :item="item"
            :to="item.invalid ? '' : `/diaries/${item.id}`"
            :invalid="item.invalid"
            :badge="item.invalid ? '内容失效' : '已收藏'"
            :badge-tone="item.invalid ? 'danger' : 'gold'"
            :note="item.invalid ? '内容暂时不可继续打开' : '继续翻阅这篇你收藏过的旅行故事'"
          />
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
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryMagazinePagination from '@/components/diaries/DiaryMagazinePagination.vue';
import DiaryShelfCard from '@/components/diaries/DiaryShelfCard.vue';
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
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.page-hero,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.page-hero {
  overflow: hidden;
  padding: 42px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 26px;
  background:
    radial-gradient(circle at 14% 18%, rgba(34, 211, 238, 0.14), transparent 22%),
    radial-gradient(circle at 88% 16%, rgba(212, 175, 55, 0.14), transparent 20%),
    linear-gradient(140deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.96) 50%, rgba(245, 247, 250, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.hero-eyebrow {
  margin: 0 0 12px;
  color: #c79b1d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 0;
  color: #111827;
  font-size: 50px;
  line-height: 1.04;
  font-weight: 760;
  letter-spacing: -0.04em;
}

.hero-description {
  margin: 18px 0 0;
  max-width: 640px;
  color: #475569;
  font-size: 15px;
  line-height: 1.86;
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
    font-size: 28px;
    line-height: 1.06;
    font-weight: 760;
  }

  p {
    margin: 10px 0 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.75;
  }
}

.hero-stat-label {
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.card-list,
.loading-list,
.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.loading-hero,
.loading-card {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 280px;
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
  .my-favorites-page {
    gap: 22px;
  }

  .page-hero,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .page-hero {
    padding: 24px 18px;
  }

  .hero-copy h1 {
    font-size: 34px;
  }
}
</style>
