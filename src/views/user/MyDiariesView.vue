<template>
  <div class="my-diaries-page">
    <AuthDrawer v-model="authDrawerOpen" :initial-mode="authInitialMode" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="我的日记加载中">
      <div class="loading-hero" />
      <div class="loading-list">
        <article v-for="placeholder in pageSize" :key="placeholder" class="loading-card">
          <div class="loading-cover" />
          <div class="loading-content">
            <span class="loading-line short" />
            <span class="loading-line medium" />
            <span class="loading-line long" />
            <div class="loading-footer">
              <span class="loading-avatar" />
              <span class="loading-line author" />
            </div>
          </div>
        </article>
      </div>
    </section>

    <AuthRequiredView
      v-else-if="pageState === 'auth'"
      title="登录后管理你的旅行日记"
      description="查看已发布的日记，继续整理和回顾你的旅行记录。"
      @login="openLoginDrawer"
      @register="openRegisterDrawer"
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
        <div class="hero-overlay">
          <div class="hero-copy">
            <h1>我的私藏目录</h1>
            <p class="hero-description">
              这里收纳你写下的旅行日记，让那些沿途的风景、心情与片段继续安静地留在你的目录里。
            </p>

            <div class="hero-actions">
              <button class="hero-action hero-action-primary" type="button" @click="goToPublish">
                <el-icon><Plus /></el-icon>
                发布新日记
              </button>
              <button class="hero-link" type="button" @click="goToFavorites">
                查看我的收藏
              </button>
            </div>
          </div>
        </div>
      </section>

      <section ref="resultsAnchorRef" class="catalog-bar">
        <p class="catalog-summary">{{ diarySummary }}</p>
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
        <div v-if="listStatus === 'loading'" class="loading-list">
          <article v-for="placeholder in pageSize" :key="placeholder" class="loading-card">
            <div class="loading-cover" />
            <div class="loading-content">
              <span class="loading-line short" />
              <span class="loading-line medium" />
              <span class="loading-line long" />
              <div class="loading-footer">
                <span class="loading-avatar" />
                <span class="loading-line author" />
              </div>
            </div>
          </article>
        </div>

        <div v-else-if="listStatus === 'success'" class="diary-grid">
          <div
            v-for="item in pageData.list"
            :key="item.id"
            class="managed-diary-card"
          >
            <DiaryEditorialCard :item="item" />
            <div class="diary-manage-actions" aria-label="日记管理操作">
              <button type="button" class="manage-button" @click.stop="goToEdit(item.id)">
                <el-icon><EditPen /></el-icon>
                编辑
              </button>
              <button
                type="button"
                class="manage-button manage-button-danger"
                :disabled="deletePendingIds.includes(item.id)"
                @click.stop="handleDeleteDiary(item)"
              >
                <el-icon><Delete /></el-icon>
                {{ deletePendingIds.includes(item.id) ? '删除中' : '删除' }}
              </button>
            </div>
          </div>
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
import { Delete, EditPen, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import 'element-plus/theme-chalk/el-message-box.css';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import AuthRequiredView from '@/components/auth/AuthRequiredView.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryEditorialCard from '@/components/diaries/DiaryEditorialCard.vue';
import DiaryMagazinePagination from '@/components/diaries/DiaryMagazinePagination.vue';
import { deleteTravelDiary, getMyTravelDiaries, type PageUserDiaryCard, type UserDiaryCard } from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';
type ListStatus = 'loading' | 'success' | 'empty' | 'error';
type SortValue = 'latest' | 'hot';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const authInitialMode = ref<'login' | 'register'>('login');
const resultsAnchorRef = ref<HTMLElement | null>(null);
const pageState = ref<PageState>('loading');
const listStatus = ref<ListStatus>('loading');
const listError = ref('当前无法获取我的日记列表，请稍后重试。');
const pageError = ref('当前无法验证登录信息，请稍后重新进入。');
const isFetching = ref(false);
const deletePendingIds = ref<string[]>([]);
const pageSize = 6;
const defaultSort: SortValue = 'latest';
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

const formattedTotal = computed(() => pageData.value.total.toLocaleString('zh-CN'));
const diarySummary = computed(() => {
  if (listStatus.value === 'loading') return '我的日记正在加载';
  if (listStatus.value === 'error') return '我的日记目录暂时无法读取';
  if (listStatus.value === 'empty') return '暂未发布可展示的旅行日记';

  return `当前共收录 ${formattedTotal.value} 篇旅行日记`;
});

const openLoginDrawer = () => {
  authInitialMode.value = 'login';
  authDrawerOpen.value = true;
};

const openRegisterDrawer = () => {
  authInitialMode.value = 'register';
  authDrawerOpen.value = true;
};

const goToPublish = () => {
  router.push('/account/diaries/new');
};

const goToEdit = (id: string) => {
  router.push(`/account/diaries/${id}/edit`);
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
  isFetching.value = true;
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
  } finally {
    if (requestId === fetchSequence) {
      isFetching.value = false;
    }
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

const handleDeleteDiary = async (item: UserDiaryCard) => {
  if (deletePendingIds.value.includes(item.id)) return;

  try {
    await ElMessageBox.confirm(
      `删除后无法恢复，确定要删除《${item.title}》吗？`,
      '删除旅行日记',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );
  } catch {
    return;
  }

  deletePendingIds.value = [...deletePendingIds.value, item.id];

  try {
    await deleteTravelDiary(item.id);
    ElMessage.success('旅行日记已删除');
    await fetchList();
  } catch (error) {
    console.error('Failed to delete diary', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      openLoginDrawer();
      return;
    }

    ElMessage.error(getApiErrorMessage(error, '删除失败，请稍后重试。'));
  } finally {
    deletePendingIds.value = deletePendingIds.value.filter((id) => id !== item.id);
  }
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
  width: min(100%, 1400px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
  color: var(--color-text-primary);
}

.page-hero,
.loading-hero,
.loading-card {
  border-radius: var(--radius-panel);
}

.page-hero {
  position: relative;
  min-height: 480px;
  margin: 24px 8px 0;
  overflow: hidden;
  background:
    url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85') center / cover;
  box-shadow: var(--shadow-elevated);

  &:hover .hero-overlay::before {
    transform: scale(1.04);
  }
}

.hero-overlay {
  position: relative;
  min-height: inherit;
  padding: 64px 48px;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.64) 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: transform 0.7s ease;
  }
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 720px;

  h1 {
    margin: 16px 0 0;
    color: #ffffff;
    font-size: var(--font-size-display-md);
    line-height: 1.12;
    font-weight: var(--font-weight-display);
    letter-spacing: -0.03em;
  }
}

.hero-description {
  margin: 18px 0 0;
  max-width: 680px;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-body-lg);
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 32px;
}

.hero-action {
  min-height: 56px;
  padding: 0 30px;
  border-radius: var(--radius-chip);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.hero-action-primary {
  background: #005bad;
  color: #ffffff;
  box-shadow: 0 18px 36px rgba(0, 91, 173, 0.22);

  &:hover {
    background: #004483;
  }
}

.hero-link {
  padding: 0 0 4px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.42);
  background: transparent;
  color: #ffffff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.82);
    border-color: rgba(255, 255, 255, 0.72);
  }
}

.catalog-bar {
  margin: 16px 8px 0;
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
  transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;

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
  margin: 0 8px;
}

.diary-grid,
.loading-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.managed-diary-card {
  position: relative;
  min-width: 0;

  :deep(.diary-card) {
    height: 100%;
  }
}

.diary-manage-actions {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: var(--radius-chip);
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(14px);
}

.manage-button {
  min-height: 34px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-chip);
  background: transparent;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 91, 173, 0.1);
    color: #005bad;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }
}

.manage-button-danger {
  &:hover:not(:disabled) {
    background: rgba(186, 26, 26, 0.08);
    color: #ba1a1a;
  }
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.loading-hero,
.loading-card {
  overflow: hidden;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
}

.loading-hero {
  min-height: 480px;
  margin: 24px 8px 0;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-card {
  border-radius: var(--radius-card);
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

.loading-line,
.loading-avatar {
  display: block;
  border-radius: var(--radius-chip);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-line {
  height: 12px;
  margin-top: 18px;
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
  margin-top: 82px;
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.86);
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.loading-line.author {
  width: 96px;
  height: 10px;
  margin-top: 0;
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
  .diary-grid,
  .loading-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  .my-diaries-page {
    gap: 28px;
  }

  .page-hero,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .page-hero,
  .loading-hero {
    min-height: 360px;
    margin: 0;
  }

  .hero-overlay {
    padding: 36px 22px;
  }

  .hero-copy h1 {
    font-size: var(--font-size-title-lg);
  }

  .hero-description {
    font-size: var(--font-size-base);
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }

  .hero-action {
    width: 100%;
  }

  .catalog-bar,
  .list-shell {
    margin-left: 0;
    margin-right: 0;
  }

  .catalog-summary,
  .sort-status {
    font-size: var(--font-size-sm);
  }

  .diary-grid,
  .loading-list {
    grid-template-columns: 1fr;
  }

  .loading-cover {
    height: 230px;
  }

  .loading-content {
    min-height: 260px;
    padding: 24px 22px;
  }
}
</style>
