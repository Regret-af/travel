<template>
  <div class="notifications-page">
    <AuthDrawer v-model="authDrawerOpen" :initial-mode="authInitialMode" />

    <AuthRequiredView
      v-if="!isLoggedIn"
      title="登录后查看通知中心"
      description="评论、点赞、收藏和系统消息会集中保存在这里，登录后即可继续查看。"
      @login="openLoginDrawer"
      @register="openRegisterDrawer"
    />

    <template v-else>
      <section class="notifications-hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">消息中心</p>
          <h1>通知中心</h1>
          <p>及时掌握旅行日记的互动反馈、收藏动态和系统提醒。</p>
        </div>
        <div class="hero-summary">
          <span class="summary-label">未读通知</span>
          <strong>{{ unreadCountLabel }}</strong>
          <span>{{ unreadCount > 0 ? '条待处理' : '暂无待处理消息' }}</span>
        </div>
      </section>

      <section class="notification-panel">
        <div class="panel-toolbar">
          <div class="filter-strip" aria-label="通知类型筛选">
            <button
              v-for="filter in filters"
              :key="filter.label"
              type="button"
              class="filter-chip"
              :class="{ active: currentType === filter.value }"
              :aria-pressed="currentType === filter.value"
              @click="handleTypeChange(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>

          <button
            type="button"
            class="read-all-action"
            :disabled="!canReadAll"
            @click="handleReadAll"
          >
            <el-icon><Check /></el-icon>
            当前筛选全部已读
          </button>
        </div>

        <div v-if="listStatus === 'loading'" class="notification-list">
          <article v-for="item in placeholders" :key="item" class="notification-skeleton" />
        </div>

        <div v-else-if="listStatus === 'error'" class="state-card">
          <div class="state-icon error">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <p class="state-eyebrow">加载失败</p>
          <h2>通知暂时没有成功加载</h2>
          <p>{{ listError }}</p>
          <button type="button" class="primary-action" @click="fetchPage">重新加载</button>
        </div>

        <div v-else-if="listStatus === 'empty'" class="state-card">
          <div class="state-icon">
            <el-icon><Bell /></el-icon>
          </div>
          <p class="state-eyebrow">暂无通知</p>
          <h2>{{ emptyTitle }}</h2>
          <p>{{ emptyDescription }}</p>
        </div>

        <div v-else class="notification-list">
          <article
            v-for="item in pageData.list"
            :key="item.id"
            class="notification-item"
            :class="{ unread: !item.isRead }"
          >
            <span v-if="!item.isRead" class="unread-dot" />

            <button type="button" class="notification-main" @click="handleNotificationOpen(item)">
              <span class="avatar-shell" :class="{ system: item.type === 'SYSTEM' }">
                <img
                  v-if="item.sender?.avatarUrl"
                  :src="item.sender.avatarUrl"
                  :alt="item.sender.nickname || '通知发送者'"
                />
                <el-icon v-else>
                  <component :is="getNotificationIcon(item.type)" />
                </el-icon>
              </span>

              <span class="notification-copy">
                <span class="copy-head">
                  <strong>{{ getNotificationTitle(item) }}</strong>
                  <time>{{ formatRelativeTime(item.createdAt) }}</time>
                </span>
                <span class="copy-content">{{ item.content || '这条通知暂无详细内容。' }}</span>
                <span v-if="item.relatedDiaryId" class="copy-link">查看相关日记</span>
              </span>
            </button>

            <button
              v-if="!item.isRead"
              type="button"
              class="single-read-action"
              :disabled="pendingIds.includes(item.id)"
              aria-label="标记为已读"
              @click="handleSingleRead(item)"
            >
              <el-icon><Check /></el-icon>
            </button>
          </article>
        </div>

        <div v-if="listStatus === 'success' && pageData.total > 0" class="pagination-shell">
          <el-pagination
            background
            layout="prev, pager, next, jumper"
            :current-page="pageData.pageNum"
            :page-size="pageData.pageSize"
            :pager-count="isMobile ? 5 : 7"
            :total="pageData.total"
            @current-change="handlePageChange"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Bell,
  ChatDotRound,
  Check,
  InfoFilled,
  StarFilled,
  WarningFilled
} from '@element-plus/icons-vue';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import AuthRequiredView from '@/components/auth/AuthRequiredView.vue';
import {
  getNotificationUnreadCount,
  getNotifications,
  readAllNotifications,
  readNotification,
  type NotificationItem,
  type NotificationPage,
  type NotificationType
} from '@/api/notifications';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type ListStatus = 'loading' | 'success' | 'empty' | 'error';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const pageSize = 10;
const placeholders = Array.from({ length: 5 }, (_, index) => index + 1);
const filters: Array<{ label: string; value: NotificationType | '' }> = [
  { label: '全部', value: '' },
  { label: '点赞', value: 'LIKE' },
  { label: '评论', value: 'COMMENT' },
  { label: '收藏', value: 'FAVORITE' },
  { label: '系统通知', value: 'SYSTEM' }
];

const authDrawerOpen = ref(false);
const authInitialMode = ref<'login' | 'register'>('login');
const listStatus = ref<ListStatus>('loading');
const listError = ref('当前无法获取通知列表，请稍后重试。');
const unreadCount = ref(0);
const pendingIds = ref<string[]>([]);
const readAllPending = ref(false);
const isMobile = ref(false);
const pageData = ref<NotificationPage>({
  list: [],
  pageNum: 1,
  pageSize,
  total: 0,
  pages: 0
});
let fetchSequence = 0;

const isLoggedIn = computed(() => Boolean(authStore.token));
const normalizedRoute = computed(() => {
  const routePage = Number(route.query.page || 1);
  const routeType = String(route.query.type || '').trim();

  return {
    page: Number.isFinite(routePage) && routePage > 0 ? routePage : 1,
    type: filters.some((filter) => filter.value === routeType) ? (routeType as NotificationType | '') : ''
  };
});
const currentType = computed(() => normalizedRoute.value.type);
const unreadCountLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));
const canReadAll = computed(
  () => !readAllPending.value && pageData.value.list.some((item) => !item.isRead)
);
const emptyTitle = computed(() =>
  currentType.value ? `${getFilterLabel(currentType.value)}暂时没有消息` : '通知中心暂时没有新内容'
);
const emptyDescription = computed(() =>
  currentType.value
    ? '切换到其他类型，或稍后再查看新的互动提醒。'
    : '评论、点赞、收藏和系统消息会在这里集中展示。'
);

function openLoginDrawer() {
  authInitialMode.value = 'login';
  authDrawerOpen.value = true;
}

function openRegisterDrawer() {
  authInitialMode.value = 'register';
  authDrawerOpen.value = true;
}

function getFilterLabel(type?: NotificationType | '') {
  return filters.find((filter) => filter.value === type)?.label || '通知';
}

function getNotificationIcon(type?: string) {
  if (type === 'COMMENT') return ChatDotRound;
  if (type === 'SYSTEM') return InfoFilled;
  return StarFilled;
}

function getNotificationTypeLabel(type?: string) {
  if (type === 'COMMENT') return '评论通知';
  if (type === 'LIKE') return '点赞通知';
  if (type === 'FAVORITE') return '收藏通知';
  if (type === 'SYSTEM') return '系统通知';
  return '通知';
}

function getNotificationTitle(item: NotificationItem) {
  const senderName = item.sender?.nickname?.trim();

  if (item.title?.trim()) {
    return senderName && item.type !== 'SYSTEM' ? `${senderName} · ${item.title}` : item.title;
  }

  return senderName && item.type !== 'SYSTEM'
    ? `${senderName} · ${getNotificationTypeLabel(item.type)}`
    : getNotificationTypeLabel(item.type);
}

function formatRelativeTime(value?: string) {
  if (!value) return '时间未知';

  const normalized = value.replace('T', ' ').replace(/-/g, '/');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff >= 0 && diff < minute) return '刚刚';
  if (diff >= 0 && diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff >= 0 && diff < day) return `${Math.floor(diff / hour)}小时前`;

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function updateIsMobile() {
  isMobile.value = window.innerWidth < 768;
}

function updateRoute(payload: { page?: number; type?: NotificationType | '' }) {
  const nextPage = payload.page ?? normalizedRoute.value.page;
  const nextType = payload.type ?? normalizedRoute.value.type;

  if (nextPage === normalizedRoute.value.page && nextType === normalizedRoute.value.type) {
    return;
  }

  router.push({
    path: '/notifications',
    query: {
      ...(nextType ? { type: nextType } : {}),
      ...(nextPage > 1 ? { page: String(nextPage) } : {})
    }
  });
}

async function fetchUnreadCount() {
  const res = await getNotificationUnreadCount();
  unreadCount.value = res.data?.unreadCount ?? 0;
}

async function fetchPage() {
  if (!authStore.token) {
    pageData.value = {
      list: [],
      pageNum: 1,
      pageSize,
      total: 0,
      pages: 0
    };
    unreadCount.value = 0;
    return;
  }

  const requestId = ++fetchSequence;
  listStatus.value = 'loading';
  listError.value = '当前无法获取通知列表，请稍后重试。';

  try {
    const [unreadRes, notificationsRes] = await Promise.all([
      getNotificationUnreadCount(),
      getNotifications({
        pageNum: normalizedRoute.value.page,
        pageSize,
        type: normalizedRoute.value.type || undefined
      })
    ]);

    if (requestId !== fetchSequence) return;

    const nextPageData = notificationsRes.data;

    if (nextPageData.pages > 0 && normalizedRoute.value.page > nextPageData.pages) {
      updateRoute({ page: nextPageData.pages });
      return;
    }

    unreadCount.value = unreadRes.data?.unreadCount ?? 0;
    pageData.value = nextPageData;
    listStatus.value = nextPageData.list.length ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== fetchSequence) return;

    listStatus.value = 'error';
    listError.value = getApiErrorMessage(error, '当前无法获取通知列表，请稍后重试。');
  }
}

function handleTypeChange(type: NotificationType | '') {
  updateRoute({ type, page: 1 });
}

function handlePageChange(page: number) {
  updateRoute({ page });
}

async function handleSingleRead(item: NotificationItem) {
  if (item.isRead || pendingIds.value.includes(item.id)) return;

  pendingIds.value = [...pendingIds.value, item.id];

  try {
    const res = await readNotification(item.id);
    pageData.value = {
      ...pageData.value,
      list: pageData.value.list.map((current) =>
        current.id === item.id
          ? {
              ...current,
              isRead: res.data.isRead,
              readTime: res.data.readTime
            }
          : current
      )
    };
    unreadCount.value = Math.max(unreadCount.value - 1, 0);
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '标记已读失败，请稍后重试。'));
  } finally {
    pendingIds.value = pendingIds.value.filter((id) => id !== item.id);
  }
}

async function handleReadAll() {
  if (!canReadAll.value) return;

  readAllPending.value = true;

  try {
    const res = await readAllNotifications({
      type: normalizedRoute.value.type || undefined
    });
    const readTime = res.data?.readTime;
    pageData.value = {
      ...pageData.value,
      list: pageData.value.list.map((item) => ({
        ...item,
        isRead: true,
        readTime: item.readTime || readTime
      }))
    };
    await fetchUnreadCount();
    ElMessage.success('当前筛选下的通知已标记为已读');
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '全部标记已读失败，请稍后重试。'));
  } finally {
    readAllPending.value = false;
  }
}

async function handleNotificationOpen(item: NotificationItem) {
  if (!item.isRead) {
    await handleSingleRead(item);
  }

  if (item.relatedDiaryId) {
    router.push({
      path: `/diaries/${item.relatedDiaryId}`,
      query: {
        ...(item.relatedCommentId ? { commentId: item.relatedCommentId } : {})
      }
    });
  }
}

watch(
  () => route.fullPath,
  () => {
    if (authStore.token) {
      fetchPage();
    }
  },
  { immediate: true }
);

watch(
  () => authStore.token,
  (token) => {
    if (token) {
      fetchPage();
      return;
    }

    pageData.value = {
      list: [],
      pageNum: 1,
      pageSize,
      total: 0,
      pages: 0
    };
    unreadCount.value = 0;
  }
);

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
});
</script>

<style scoped lang="scss">
.notifications-page {
  width: min(100%, 1400px);
  margin: 0 auto;
  color: var(--color-text-primary);
}

.notifications-hero {
  min-height: 300px;
  padding: 42px;
  border-radius: var(--radius-panel);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  overflow: hidden;
  background:
    linear-gradient(108deg, rgba(0, 68, 131, 0.9) 0%, rgba(0, 91, 173, 0.72) 46%, rgba(15, 23, 42, 0.48) 100%),
    url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85') center / cover;
  box-shadow: var(--shadow-panel);
}

.hero-copy {
  max-width: 760px;

  h1 {
    margin: 0;
    color: #ffffff;
    font-size: var(--font-size-hero);
    line-height: 1.02;
    font-weight: var(--font-weight-display);
    letter-spacing: -0.03em;
  }

  p:last-child {
    margin: 14px 0 0;
    max-width: 560px;
    color: rgba(255, 255, 255, 0.82);
    font-size: var(--font-size-body-lg);
    line-height: 1.8;
  }
}

.hero-eyebrow,
.state-eyebrow {
  margin: 0 0 10px;
  color: #ffdf98;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-summary {
  min-width: 190px;
  padding: 22px 24px;
  border-radius: var(--radius-card);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.56);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(16px);

  span,
  strong {
    display: block;
  }

  .summary-label {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  strong {
    margin-top: 4px;
    color: #004483;
    font-size: var(--font-size-16xl);
    line-height: 1;
  }

  span:last-child {
    margin-top: 6px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.notification-panel {
  margin-top: -34px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--radius-panel);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(14px);
}

.panel-toolbar {
  padding: 24px 28px;
  border-bottom: 1px solid var(--color-border-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.filter-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-chip,
.read-all-action,
.single-read-action,
.primary-action {
  border: none;
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease, color 0.24s ease, box-shadow 0.24s ease;
}

.filter-chip {
  flex-shrink: 0;
  min-height: 42px;
  padding: 0 20px;
  border-radius: var(--radius-chip);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);

  &:hover,
  &.active {
    background: #004483;
    color: #ffffff;
    box-shadow: 0 12px 24px rgba(0, 68, 131, 0.16);
  }
}

.read-all-action {
  min-height: 42px;
  padding: 0 16px;
  border-radius: var(--radius-chip);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 68, 131, 0.08);
  color: #004483;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: rgba(0, 68, 131, 0.12);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  position: relative;
  min-height: 112px;
  padding: 26px 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  transition: background 0.24s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(248, 250, 252, 0.82);
  }

  &.unread {
    background: rgba(94, 162, 255, 0.1);

    &:hover {
      background: rgba(94, 162, 255, 0.14);
    }
  }
}

.unread-dot {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-chip);
  background: #004483;
  transform: translateY(-50%);
}

.notification-main {
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  text-align: left;
  cursor: pointer;
}

.avatar-shell {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-chip);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 68, 131, 0.1);
  color: #004483;
  font-size: var(--font-size-8xl);
  flex-shrink: 0;

  &.system {
    background: #004483;
    color: #ffffff;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.notification-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copy-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;

  strong {
    min-width: 0;
    color: #111827;
    font-size: var(--font-size-base);
    line-height: 1.5;
    font-weight: var(--font-weight-bold);
  }

  time {
    flex-shrink: 0;
    color: var(--color-text-subtle);
    font-size: var(--font-size-xs);
    line-height: 1.6;
  }
}

.copy-content {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.75;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.copy-link {
  color: #004483;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.single-read-action {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-chip);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  color: #004483;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #ffffff;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.54;
  }
}

.pagination-shell {
  padding: 28px;
  border-top: 1px solid var(--color-border-soft);
  display: flex;
  justify-content: center;
}

.state-card {
  min-height: 420px;
  padding: 54px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(94, 162, 255, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));

  h2 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-10xl);
    line-height: 1.14;
  }

  p:last-of-type {
    max-width: 520px;
    margin: 12px 0 0;
    color: var(--color-text-secondary);
    line-height: 1.8;
  }
}

.state-eyebrow {
  color: var(--color-accent);
}

.state-icon {
  width: 78px;
  height: 78px;
  margin-bottom: 18px;
  border-radius: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 68, 131, 0.1);
  color: #004483;
  font-size: var(--font-size-11xl);

  &.error {
    background: rgba(186, 26, 26, 0.08);
    color: #ba1a1a;
  }
}

.primary-action {
  min-height: 44px;
  margin-top: 24px;
  padding: 0 22px;
  border-radius: var(--radius-chip);
  background: #004483;
  color: #ffffff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-control);

  &:hover {
    transform: translateY(-1px);
    background: #005bad;
    box-shadow: var(--shadow-control-hover);
  }
}

.notification-skeleton {
  min-height: 112px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.58), rgba(248, 250, 252, 0.92), rgba(226, 232, 240, 0.58));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;

  &:last-child {
    border-bottom: none;
  }
}

:deep(.el-pagination) {
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  min-width: 40px;
  height: 40px;
  border-radius: 14px !important;
  box-shadow: none !important;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 900px) {
  .notifications-hero,
  .panel-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-summary {
    width: 100%;
  }

  .read-all-action {
    justify-content: center;
  }
}

@media (max-width: 767px) {
  .notifications-hero {
    min-height: 260px;
    padding: 30px 20px 44px;
    border-radius: var(--radius-card);

    .hero-copy h1 {
      font-size: var(--font-size-15xl);
    }
  }

  .notification-panel {
    margin-top: -24px;
    border-radius: var(--radius-card);
  }

  .panel-toolbar,
  .notification-item,
  .pagination-shell {
    padding-left: 18px;
    padding-right: 18px;
  }

  .notification-item {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .notification-main {
    align-items: flex-start;
  }

  .copy-head {
    flex-direction: column;
    gap: 4px;
  }

  .single-read-action {
    width: 100%;
  }

  .state-card {
    min-height: 360px;
    padding: 42px 18px;

    h2 {
      font-size: var(--font-size-7xl);
    }
  }
}
</style>
