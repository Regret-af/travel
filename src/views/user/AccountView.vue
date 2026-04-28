<template>
  <div class="account-page">
    <AuthDrawer v-model="authDrawerOpen" :initial-mode="authInitialMode" />

    <section v-if="pageState === 'loading'" class="state-panel loading-panel" aria-label="个人主页加载中">
      <div class="loading-hero" />
      <div class="loading-grid">
        <div class="loading-card" />
        <div class="loading-card" />
        <div class="loading-card" />
      </div>
    </section>

    <AuthRequiredView
      v-else-if="pageState === 'auth'"
      @login="openLoginDrawer"
      @register="openRegisterDrawer"
    />

    <section v-else-if="pageState === 'error'" class="state-panel error-panel">
      <p class="state-eyebrow">连接中断</p>
      <h1>个人主页暂时没有顺利展开</h1>
      <p class="state-copy">{{ pageError }}</p>
      <div class="state-actions">
        <button class="primary-action" type="button" @click="initializePage">重新加载</button>
        <button class="secondary-action" type="button" @click="goHome">返回首页</button>
      </div>
    </section>

    <template v-else>
      <section class="profile-hero" :style="heroBackgroundStyle">
        <div class="hero-shade" />
        <div class="hero-inner">
          <div class="avatar-frame">
            <el-avatar :size="160" :src="profile?.avatarUrl">
              {{ avatarFallback }}
            </el-avatar>
          </div>

          <div class="hero-copy">
            <h1>{{ displayName }}</h1>
            <p class="hero-description">{{ profileSignature }}</p>
            <div class="hero-meta">
              <span v-if="joinedText" class="meta-pill">
                <el-icon><Calendar /></el-icon>
                {{ joinedText }}
              </span>
              <span class="meta-pill">
                <el-icon><Bell /></el-icon>
                {{ unreadSummary }}
              </span>
            </div>
          </div>

          <div class="hero-actions">
            <button class="primary-action" type="button" @click="openSettingsEntry">编辑资料</button>
            <button class="icon-action" type="button" aria-label="查看通知中心" @click="goToNotifications">
              <el-icon><Bell /></el-icon>
              <span v-if="unreadCount > 0" class="action-badge">{{ unreadCountLabel }}</span>
            </button>
          </div>
        </div>
      </section>

      <main class="profile-content">
        <section class="journals-section">
          <div class="section-header">
            <h2>我的日记</h2>
            <button class="text-link" type="button" @click="goToDiaries">查看全部</button>
          </div>

          <div v-if="diariesState === 'loading'" class="diary-preview-row">
            <article v-for="item in 3" :key="item" class="diary-preview-loading" />
          </div>

          <div v-else-if="recentDiaries.length" class="diary-preview-row">
            <DiaryEditorialCard
              v-for="item in recentDiaries"
              :key="item.id"
              :item="item"
              class="diary-preview-card"
            />
          </div>

          <article v-else class="empty-card">
            <h3>还没有可展示的日记</h3>
            <p>发布第一篇旅行日记后，它会出现在这里。</p>
            <button class="entry-action" type="button" @click="goToPublish">发布日记</button>
          </article>
        </section>

        <div class="lower-grid">
          <section class="favorites-section">
            <div class="section-header">
              <h2>我的收藏</h2>
              <button class="text-link" type="button" @click="goToFavorites">查看全部</button>
            </div>

            <div v-if="favoritesState === 'loading'" class="favorite-list">
              <article v-for="item in 2" :key="item" class="favorite-card favorite-card-loading" />
            </div>

            <div v-else-if="favoriteDiaries.length" class="favorite-list">
              <article
                v-for="item in favoriteDiaries"
                :key="`${item.id}-${item.invalid ? 'invalid' : 'valid'}`"
                class="favorite-card"
                :class="{ disabled: item.invalid }"
                @click="goToFavoriteDetail(item)"
              >
                <div class="favorite-cover">
                  <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" />
                  <div v-else class="cover-fallback" />
                </div>
                <div class="favorite-copy">
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.summary || '继续翻阅这篇你收藏过的旅行故事。' }}</p>
                </div>
                <el-icon class="favorite-icon"><StarFilled /></el-icon>
              </article>
            </div>

            <article v-else class="empty-card compact">
              <h3>暂时还没有收藏</h3>
              <p>去旅行日记列表里收藏想再次翻阅的内容。</p>
            </article>
          </section>

          <aside class="side-stack">
            <section class="glass-card notification-card">
              <div class="section-header compact-header">
                <h2>通知中心</h2>
                <span class="notice-count">{{ unreadSummary }}</span>
              </div>

              <div v-if="notificationsState === 'loading'" class="notice-list">
                <div v-for="item in 2" :key="item" class="notice-skeleton" />
              </div>

              <div v-else-if="notificationsState === 'error'" class="feedback-card">
                <p>通知中心暂时没有加载成功。</p>
                <button type="button" class="inline-link" @click="loadNotifications">重试加载通知</button>
              </div>

              <div v-else-if="notifications.length" class="notice-list">
                <button
                  v-for="item in notifications"
                  :key="item.id"
                  type="button"
                  class="notice-item"
                  :class="{ read: item.isRead }"
                  @click="handleNotificationClick(item)"
                >
                  <span class="notice-mark">
                    <el-icon>
                      <component :is="getNotificationIcon(item.type)" />
                    </el-icon>
                  </span>
                  <span class="notice-copy">
                    <strong>{{ item.title || getNotificationTypeLabel(item.type) }}</strong>
                    <span>{{ item.content || '点击查看这条通知的详情。' }}</span>
                    <time>{{ formatDateTime(item.createdAt, 'MM.DD HH:mm') }}</time>
                  </span>
                </button>
              </div>

              <div v-else class="feedback-card">
                <h3>暂无新通知</h3>
                <p>评论、点赞、收藏和系统消息会集中出现在这里。</p>
              </div>

              <button class="wide-action" type="button" @click="goToNotifications">查看全部通知</button>
            </section>

            <section class="settings-card">
              <div class="section-header compact-header">
                <h2>账号与设置</h2>
                <button class="text-link" type="button" @click="goToNotifications">通知设置</button>
              </div>

              <button class="setting-row" type="button" @click="goToPasswordEdit">
                <span class="setting-icon"><el-icon><Lock /></el-icon></span>
                <span>账号与安全</span>
                <el-icon><ArrowRight /></el-icon>
              </button>

              <button class="setting-row danger" type="button" @click="handleLogout">
                <span class="setting-icon"><el-icon><SwitchButton /></el-icon></span>
                <span>退出登录</span>
              </button>
            </section>
          </aside>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  Bell,
  Calendar,
  ChatDotRound,
  InfoFilled,
  Lock,
  StarFilled,
  SwitchButton
} from '@element-plus/icons-vue';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import AuthRequiredView from '@/components/auth/AuthRequiredView.vue';
import {
  getNotificationUnreadCount,
  getNotifications,
  readNotification,
  type NotificationItem
} from '@/api/notifications';
import {
  getMyFavoriteDiaries,
  getMyTravelDiaries,
  type FavoriteDiaryCard,
  type UserDiaryCard
} from '@/api/diaries';
import DiaryEditorialCard from '@/components/diaries/DiaryEditorialCard.vue';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';
type AsyncState = 'idle' | 'loading' | 'success' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const authInitialMode = ref<'login' | 'register'>('login');
const pageState = ref<PageState>('loading');
const pageError = ref('当前网络或服务暂时不可用，请稍后再试。');
const notificationsState = ref<AsyncState>('idle');
const diariesState = ref<AsyncState>('idle');
const favoritesState = ref<AsyncState>('idle');
const notifications = ref<NotificationItem[]>([]);
const recentDiaries = ref<UserDiaryCard[]>([]);
const favoriteDiaries = ref<FavoriteDiaryCard[]>([]);
const unreadCount = ref(0);
const notificationPendingIds = ref<string[]>([]);

const profile = computed(() => authStore.user);
const displayName = computed(() => profile.value?.nickname?.trim() || profile.value?.username?.trim() || '旅行者');
const avatarFallback = computed(() => displayName.value.slice(0, 1).toUpperCase());
const profileSignature = computed(() => {
  if (profile.value?.email) {
    return '探寻未知的风景，记录真实的感动';
  }

  return '把沿途风景与真实心绪，整理成自己的旅行主页。';
});
const unreadSummary = computed(() =>
  unreadCount.value > 0 ? `未读通知 ${unreadCount.value} 条` : '暂无未读通知'
);
const unreadCountLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));
const joinedText = computed(() => {
  const createdAt = profile.value?.createdAt?.trim();
  return createdAt ? `加入于 ${formatDateTime(createdAt, 'YYYY年M月')}` : '';
});
const heroBackgroundStyle = computed(() => {
  const coverUrl = recentDiaries.value[0]?.coverUrl || favoriteDiaries.value[0]?.coverUrl;

  return {
    backgroundImage: coverUrl
      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.1) 0%, rgba(247, 249, 251, 0.86) 88%, #f7f9fb 100%), url(${coverUrl})`
      : 'radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.16), transparent 22%), radial-gradient(circle at 82% 18%, rgba(212, 175, 55, 0.18), transparent 20%), linear-gradient(135deg, #eef6ff 0%, #f8fafc 52%, #f7f9fb 100%)'
  };
});

function formatDateTime(value?: string, mode: 'YYYY.MM.DD' | 'MM.DD HH:mm' | 'YYYY年M月' = 'YYYY.MM.DD') {
  if (!value) return '时间未知';

  const normalized = value.replace(/-/g, '/');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    if (mode === 'MM.DD HH:mm') return value.slice(5, 16);
    if (mode === 'YYYY年M月') return value.slice(0, 7).replace('-', '年') + '月';
    return value.slice(0, 10).replace(/-/g, '.');
  }

  const pad = (num: number) => String(num).padStart(2, '0');

  if (mode === 'MM.DD HH:mm') {
    return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  if (mode === 'YYYY年M月') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function getNotificationTypeLabel(type?: string) {
  if (type === 'COMMENT') return '评论通知';
  if (type === 'LIKE') return '点赞通知';
  if (type === 'FAVORITE') return '收藏通知';
  if (type === 'SYSTEM') return '系统通知';
  return '旅行通知';
}

function getNotificationIcon(type?: string) {
  if (type === 'COMMENT') return ChatDotRound;
  if (type === 'SYSTEM') return InfoFilled;
  return StarFilled;
}

function openAuthDrawer() {
  authInitialMode.value = 'login';
  authDrawerOpen.value = true;
}

function openLoginDrawer() {
  authInitialMode.value = 'login';
  authDrawerOpen.value = true;
}

function openRegisterDrawer() {
  authInitialMode.value = 'register';
  authDrawerOpen.value = true;
}

function goHome() {
  router.push('/');
}

function goToDiaries() {
  router.push('/account/diaries');
}

function goToPublish() {
  router.push('/account/diaries/new');
}

function goToFavorites() {
  router.push('/account/favorites');
}

function goToFavoriteDetail(item: FavoriteDiaryCard) {
  if (item.invalid) return;
  router.push(`/diaries/${item.id}`);
}

function openSettingsEntry() {
  router.push('/account/profile');
}

function goToPasswordEdit() {
  router.push('/account/password');
}

function goToNotifications() {
  router.push('/notifications');
}

async function loadNotifications() {
  if (!authStore.token) {
    notifications.value = [];
    unreadCount.value = 0;
    notificationsState.value = 'idle';
    return;
  }

  notificationsState.value = 'loading';

  try {
    const [unreadRes, notificationsRes] = await Promise.all([
      getNotificationUnreadCount(),
      getNotifications({
        pageNum: 1,
        pageSize: 2
      })
    ]);

    unreadCount.value = unreadRes.data?.unreadCount ?? 0;
    notifications.value = notificationsRes.data.list;
    notificationsState.value = 'success';
  } catch (error) {
    console.error('Failed to load account notifications', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      openAuthDrawer();
      return;
    }

    notifications.value = [];
    unreadCount.value = 0;
    notificationsState.value = 'error';
  }
}

async function loadDiaryPreview() {
  if (!authStore.token) {
    recentDiaries.value = [];
    diariesState.value = 'idle';
    return;
  }

  diariesState.value = 'loading';

  try {
    const res = await getMyTravelDiaries({
      pageNum: 1,
      pageSize: 3,
      sort: 'latest'
    });

    recentDiaries.value = res.data.list;
    diariesState.value = 'success';
  } catch (error) {
    console.error('Failed to load account diary preview', error);
    recentDiaries.value = [];
    diariesState.value = 'error';
  }
}

async function loadFavoritePreview() {
  if (!authStore.token) {
    favoriteDiaries.value = [];
    favoritesState.value = 'idle';
    return;
  }

  favoritesState.value = 'loading';

  try {
    const res = await getMyFavoriteDiaries({
      pageNum: 1,
      pageSize: 2
    });

    favoriteDiaries.value = res.data.list;
    favoritesState.value = 'success';
  } catch (error) {
    console.error('Failed to load account favorite preview', error);
    favoriteDiaries.value = [];
    favoritesState.value = 'error';
  }
}

async function initializePage() {
  if (!authStore.token) {
    pageState.value = 'auth';
    return;
  }

  pageState.value = 'loading';
  pageError.value = '当前网络或服务暂时不可用，请稍后再试。';

  try {
    const user = await authStore.fetchMe();

    if (!authStore.token || !user) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'ready';
    await Promise.all([
      loadNotifications(),
      loadDiaryPreview(),
      loadFavoritePreview()
    ]);
  } catch (error) {
    console.error('Failed to initialize account page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = getApiErrorMessage(error, '当前无法获取个人资料，请稍后重试，或重新登录后再试。');
  }
}

async function handleNotificationClick(item: NotificationItem) {
  if (
    !item.id ||
    item.isRead ||
    notificationPendingIds.value.includes(item.id)
  ) {
    if (item.relatedDiaryId) {
      router.push(`/diaries/${item.relatedDiaryId}`);
    }
    return;
  }

  notificationPendingIds.value = [...notificationPendingIds.value, item.id];

  try {
    const res = await readNotification(item.id);
    notifications.value = notifications.value.map((current) =>
      current.id === item.id
        ? {
            ...current,
            isRead: res.data.isRead
          }
        : current
    );
    unreadCount.value = Math.max(unreadCount.value - 1, 0);
  } catch (error) {
    console.error('Failed to read notification', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      openAuthDrawer();
      return;
    }
  } finally {
    notificationPendingIds.value = notificationPendingIds.value.filter((id) => id !== item.id);
  }

  if (item.relatedDiaryId) {
    router.push(`/diaries/${item.relatedDiaryId}`);
  }
}

function handleLogout() {
  authStore.logout();
  notifications.value = [];
  recentDiaries.value = [];
  favoriteDiaries.value = [];
  unreadCount.value = 0;
  pageState.value = 'auth';
  router.push('/account');
  openAuthDrawer();
}

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token && token !== previousToken) {
      initializePage();
      return;
    }

    if (!token) {
      notifications.value = [];
      recentDiaries.value = [];
      favoriteDiaries.value = [];
      unreadCount.value = 0;
      pageState.value = 'auth';
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.account-page {
  width: min(100%, 1400px);
  margin: 0 auto;
  color: var(--color-text-primary);
}

.guest-hero {
  position: relative;
  min-height: calc(100svh - 88px);
  margin: -88px -24px 0;
  padding: 128px 32px 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.guest-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.12)),
    url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85') center / cover;
  transform: scale(1.04);
}

.guest-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 255, 255, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(247, 249, 251, 0.04) 0%, rgba(247, 249, 251, 0.3) 74%, #f7f9fb 100%);
}

.guest-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 720px);
  padding: 56px 64px;
  border-radius: var(--radius-panel);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.44);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(20px);
  text-align: center;

  h1 {
    margin: 0;
    color: #002c59;
    font-size: var(--font-size-display-md);
    line-height: 1.12;
    font-weight: var(--font-weight-display);
    letter-spacing: -0.03em;
  }

  p {
    max-width: 500px;
    margin: 18px auto 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-body-lg);
    line-height: 1.9;
  }
}

.guest-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-chip);
  background: rgba(0, 68, 131, 0.1);
  color: #004483;
  font-size: var(--font-size-16xl);
}

.guest-actions {
  margin-top: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.guest-note {
  display: block;
  margin-top: 24px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

.profile-hero {
  position: relative;
  min-height: 500px;
  margin: -88px -24px 0;
  padding: 148px 32px 48px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background-position: center;
  background-size: cover;
}

.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.16) 0%, rgba(247, 249, 251, 0.22) 52%, #f7f9fb 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: min(100%, 1400px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 28px;
}

.avatar-frame {
  width: 176px;
  height: 176px;
  padding: 8px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18);

  :deep(.el-avatar) {
    width: 100% !important;
    height: 100% !important;
    border-radius: 26px;
    background: linear-gradient(135deg, var(--color-brand-cool), var(--color-brand-iris));
    color: #ffffff;
    font-size: var(--font-size-16xl);
    font-weight: var(--font-weight-bold);
  }
}

.hero-copy {
  min-width: 0;
  padding-bottom: 8px;

  h1 {
    margin: 0;
    color: #191c21;
    font-size: var(--font-size-display-md);
    line-height: 1.04;
    font-weight: var(--font-weight-display);
    letter-spacing: -0.03em;
  }
}

.state-eyebrow {
  margin: 0 0 10px;
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-description,
.state-copy,
.empty-card p,
.feedback-card p,
.favorite-copy p,
.notice-copy span {
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.hero-description {
  margin: 10px 0 0;
  max-width: 680px;
  font-size: var(--font-size-body-lg);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 16px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-chip);
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  backdrop-filter: blur(12px);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 10px;
}

.primary-action,
.secondary-action,
.entry-action,
.wide-action {
  min-height: 46px;
  padding: 0 24px;
  border-radius: var(--radius-chip);
  border: 1px solid transparent;
  background: #004483;
  color: #ffffff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 14px 30px rgba(0, 68, 131, 0.18);
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;

  &:hover {
    transform: translateY(-1px);
    background: #005bad;
    box-shadow: 0 18px 36px rgba(0, 68, 131, 0.22);
  }
}

.secondary-action {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-primary);
  border-color: var(--color-border-soft);
  box-shadow: none;
}

.icon-action {
  position: relative;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-chip);
  background: rgba(255, 255, 255, 0.86);
  color: #004483;
  border: 1px solid var(--color-border-soft);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.action-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radius-chip);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ba1a1a;
  color: #ffffff;
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
  border: 2px solid #ffffff;
}

.profile-content {
  padding: 56px 0 0;
  display: flex;
  flex-direction: column;
  gap: 56px;
}

.section-header {
  margin-bottom: 24px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;

  h2 {
    margin: 0;
    color: #191c21;
    font-size: var(--font-size-title-lg);
    line-height: 1.16;
    font-weight: var(--font-weight-title);
  }
}

.compact-header {
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: var(--font-size-8xl);
  }
}

.text-link,
.inline-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #004483;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.diary-preview-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
}

.diary-preview-card {
  min-height: 100%;
}

.lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(330px, 0.9fr);
  gap: 36px;
}

.favorite-list,
.side-stack,
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.favorite-card,
.glass-card,
.settings-card,
.empty-card {
  border-radius: var(--radius-card);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  box-shadow: 0 14px 36px rgba(44, 47, 48, 0.06);
}

.favorite-card {
  padding: 16px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease;

  &:hover {
    transform: translateY(-2px);
    background: #ffffff;
  }

  &.disabled {
    cursor: default;
    opacity: 0.72;
  }
}

.favorite-cover {
  width: 96px;
  height: 96px;
  overflow: hidden;
  border-radius: 16px;
  background: #e7e8ef;

  img,
  .cover-fallback {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-fallback {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(15, 23, 42, 0.16)),
    linear-gradient(135deg, #d5e3ff 0%, #f7f9fb 58%, #ffdf98 100%);
}

.favorite-copy {
  min-width: 0;

  h3 {
    margin: 0 0 6px;
    color: #191c21;
    font-size: var(--font-size-xl);
    line-height: 1.35;
    font-weight: var(--font-weight-title);
  }

  p {
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.favorite-icon {
  color: #004483;
}

.notification-card,
.settings-card,
.empty-card {
  padding: 24px;
}

.notice-count {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.notice-item {
  width: 100%;
  padding: 0 0 16px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  border: none;
  border-bottom: 1px solid var(--color-border-soft);
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  &.read {
    opacity: 0.72;
  }
}

.notice-mark,
.setting-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-chip);
  background: rgba(94, 162, 255, 0.12);
  color: #004483;
}

.notice-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: #191c21;
    font-size: var(--font-size-md);
    line-height: 1.4;
  }

  span {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--font-size-sm);
  }

  time {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
}

.wide-action {
  width: 100%;
  margin-top: 20px;
  background: #f8fafc;
  color: #004483;
  border-color: var(--color-border-soft);
  box-shadow: none;

  &:hover {
    background: #ffffff;
  }
}

.setting-row {
  width: 100%;
  min-height: 76px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-soft);
  background: rgba(255, 255, 255, 0.88);
  color: #191c21;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  text-align: left;
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease;

  & + & {
    margin-top: 12px;
  }

  &:hover {
    transform: translateX(4px);
    background: #ffffff;
  }

  &.danger {
    grid-template-columns: auto minmax(0, 1fr);
    color: #ba1a1a;
    background: rgba(186, 26, 26, 0.05);
    border-color: rgba(186, 26, 26, 0.1);

    .setting-icon {
      color: #ba1a1a;
      background: rgba(186, 26, 26, 0.08);
    }
  }
}

.empty-card {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  &.compact {
    min-height: 150px;
  }

  h3 {
    margin: 0;
    color: #191c21;
    font-size: var(--font-size-6xl);
    line-height: 1.2;
  }

  p {
    margin: 12px 0 0;
  }

  .entry-action {
    margin-top: 20px;
  }
}

.feedback-card {
  padding: 18px;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.88);

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: #191c21;
    font-size: var(--font-size-xl);
  }
}

.state-panel {
  min-height: 420px;
  padding: 54px 42px;
  border-radius: var(--radius-panel);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.14), transparent 20%),
    radial-gradient(circle at 82% 18%, rgba(212, 175, 55, 0.16), transparent 18%),
    linear-gradient(140deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-panel);

  h1 {
    margin: 0;
    max-width: 760px;
    color: #191c21;
    font-size: var(--font-size-18xl);
    line-height: 1.04;
    letter-spacing: -0.04em;
    font-weight: var(--font-weight-bold);
  }
}

.state-copy {
  max-width: 620px;
  margin: 18px 0 0;
  font-size: var(--font-size-base);
}

.state-actions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.loading-panel {
  gap: 24px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.loading-hero,
.loading-card,
.diary-preview-loading,
.favorite-card-loading,
.notice-skeleton {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 260px;
  border-radius: var(--radius-panel);
}

.loading-card {
  min-height: 260px;
  border-radius: var(--radius-card);
}

.diary-preview-loading {
  min-height: 430px;
  border-radius: var(--radius-card);
}

.favorite-card-loading {
  min-height: 130px;
}

.notice-skeleton {
  min-height: 78px;
  border-radius: 20px;
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
  .hero-inner,
  .lower-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .diary-preview-row,
  .loading-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .guest-hero {
    min-height: calc(100svh - 60px);
    padding: 110px 18px 34px;
  }

  .guest-panel {
    padding: 34px 22px;
    border-radius: var(--radius-card);

    h1 {
      font-size: var(--font-size-11xl);
      letter-spacing: -0.02em;
    }

    p {
      font-size: var(--font-size-base);
    }
  }

  .guest-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .profile-hero {
    min-height: 0;
    margin: -88px -24px 0;
    padding: 124px 18px 30px;
  }

  .hero-inner {
    gap: 18px;
  }

  .avatar-frame {
    width: 132px;
    height: 132px;
    border-radius: 26px;

    :deep(.el-avatar) {
      border-radius: 20px;
      font-size: var(--font-size-10xl);
    }
  }

  .hero-copy h1,
  .state-panel h1 {
    font-size: var(--font-size-11xl);
    letter-spacing: -0.02em;
  }

  .hero-description {
    font-size: var(--font-size-base);
  }

  .hero-actions,
  .section-header,
  .state-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
  }

  .profile-content {
    padding-top: 36px;
    gap: 40px;
  }

  .section-header h2 {
    font-size: var(--font-size-8xl);
  }

  .diary-preview-row,
  .loading-grid {
    grid-template-columns: 1fr;
  }

  .lower-grid {
    gap: 28px;
  }

  .favorite-card {
    grid-template-columns: 82px minmax(0, 1fr);

    .favorite-icon {
      display: none;
    }
  }

  .favorite-cover {
    width: 82px;
    height: 82px;
  }

  .notification-card,
  .settings-card,
  .empty-card,
  .state-panel {
    padding: 22px 18px;
    border-radius: var(--radius-card);
  }
}
</style>
