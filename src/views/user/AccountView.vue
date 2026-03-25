<template>
  <div class="account-page">
    <AuthDrawer v-model="authDrawerOpen" />

    <section v-if="pageState === 'loading'" class="state-panel loading-panel" aria-label="用户中心加载中">
      <div class="loading-hero" />
      <div class="loading-grid">
        <div class="loading-card" />
        <div class="loading-card" />
      </div>
      <div class="loading-grid loading-grid-secondary">
        <div class="loading-card" />
        <div class="loading-card" />
      </div>
    </section>

    <section v-else-if="pageState === 'auth'" class="state-panel auth-panel">
      <p class="state-eyebrow">Traveler Space</p>
      <h1>登录后，才会看见属于你的旅行者个人空间</h1>
      <p class="state-copy">
        这里会承接你的账户资料、最近消息提醒，以及通往日记与收藏入口的轻量空间。
      </p>
      <div class="state-actions">
        <button class="primary-action" type="button" @click="openAuthDrawer">打开登录抽屉</button>
        <button class="secondary-action" type="button" @click="goHome">返回首页</button>
      </div>
    </section>

    <section v-else-if="pageState === 'error'" class="state-panel error-panel">
      <p class="state-eyebrow">Connection Interrupted</p>
      <h1>用户中心暂时没有顺利展开</h1>
      <p class="state-copy">{{ pageError }}</p>
      <div class="state-actions">
        <button class="primary-action" type="button" @click="initializePage">重新加载</button>
        <button class="secondary-action" type="button" @click="goHome">返回首页</button>
      </div>
    </section>

    <template v-else>
      <section class="account-hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">Traveler Profile</p>
          <h1>{{ displayName }}</h1>
          <p class="hero-description">
            这是一处偏安静的旅行者个人空间，只保留身份信息、轻通知和几个通往内容世界的入口。
          </p>

          <div class="hero-meta">
            <span class="meta-pill meta-pill-highlight">{{ statusText }}</span>
            <span class="meta-pill">{{ joinedText }}</span>
            <span class="meta-pill">{{ unreadSummary }}</span>
          </div>

          <div class="hero-actions">
            <button class="hero-action hero-action-primary" type="button" @click="scrollToNotifications">
              查看轻通知
            </button>
            <button class="hero-action" type="button" @click="handleLogout">退出登录</button>
          </div>
        </div>

        <div class="hero-identity">
          <div class="avatar-shell">
            <el-avatar :size="112" :src="profile?.avatarUrl">
              {{ avatarFallback }}
            </el-avatar>
          </div>
          <div class="identity-card">
            <span class="identity-label">当前账户</span>
            <strong>{{ profile?.email || '未提供邮箱' }}</strong>
            <p>@{{ profile?.username || 'traveler' }}</p>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <article class="panel-card info-panel">
          <div class="panel-header">
            <div>
              <p class="panel-eyebrow">Account Basics</p>
              <h2>账户基础信息区</h2>
            </div>
          </div>

          <div class="info-grid">
            <div v-for="item in infoItems" :key="item.label" class="info-item">
              <span class="info-label">{{ item.label }}</span>
              <strong class="info-value">{{ item.value }}</strong>
            </div>
          </div>

          <div class="role-row">
            <span class="role-label">角色标签</span>
            <div class="role-list">
              <span v-for="role in roleTags" :key="role" class="role-pill">{{ role }}</span>
            </div>
          </div>
        </article>

        <article ref="notificationsRef" class="panel-card notifications-panel">
          <div class="panel-header">
            <div>
              <p class="panel-eyebrow">Soft Notices</p>
              <h2>轻通知区 / 消息入口</h2>
            </div>
            <span class="notice-badge">{{ unreadCount }} 条未读</span>
          </div>

          <div v-if="notificationsState === 'loading'" class="notice-skeleton">
            <div v-for="placeholder in 3" :key="placeholder" class="notice-skeleton-item" />
          </div>

          <div v-else-if="notificationsState === 'error'" class="notice-feedback notice-feedback-error">
            <p>最近提醒暂时没有加载成功。</p>
            <button type="button" class="inline-link" @click="loadNotifications">重试通知请求</button>
          </div>

          <div v-else-if="notifications.length === 0" class="notice-feedback notice-feedback-empty">
            <p class="notice-empty-title">空状态</p>
            <h3>现在还没有新的旅途消息</h3>
            <p>你的评论、点赞、收藏和系统提醒，后续都会以轻量方式停留在这里。</p>
          </div>

          <div v-else class="notice-list">
            <button
              v-for="item in notifications"
              :key="item.id"
              type="button"
              class="notice-item"
              :class="{ 'notice-item-read': item.isRead }"
              @click="handleNotificationClick(item)"
            >
              <el-avatar :size="42" :src="item.sender?.avatarUrl">
                {{ getSenderFallback(item.sender?.nickname) }}
              </el-avatar>
              <div class="notice-copy">
                <div class="notice-line">
                  <span class="notice-type">{{ getNotificationTypeLabel(item.type) }}</span>
                  <time>{{ formatDateTime(item.createdAt, 'MM.DD HH:mm') }}</time>
                </div>
                <h3>{{ item.title || '新的旅行提醒' }}</h3>
                <p>{{ item.content || '点击查看这条消息的详情。' }}</p>
                <span class="notice-sender">
                  {{ item.sender?.nickname || '旅途消息' }}
                  <span v-if="!item.isRead" class="unread-dot" />
                </span>
              </div>
            </button>
          </div>
        </article>
      </section>

      <section class="entry-grid">
        <article class="entry-card entry-card-diary">
          <p class="entry-eyebrow">My Diaries</p>
          <h2>我的日记入口</h2>
          <p>
            当前只保留通往日记世界的轻入口，不展开个人管理列表。你可以继续回到公共日记页，沿着故事继续阅读或记录灵感。
          </p>
          <button class="entry-action" type="button" @click="goToDiaries">前往旅行日记</button>
        </article>

        <article class="entry-card entry-card-favorite">
          <p class="entry-eyebrow">My Favorites</p>
          <h2>我的收藏入口</h2>
          <p>
            收藏管理能力还没有在当前接口阶段开放，这里只保留一处温和入口，方便你继续回到内容广场寻找想再次停留的片段。
          </p>
          <button class="entry-action" type="button" @click="goToDiaryDiscovery">继续探索日记</button>
        </article>
      </section>

      <section class="action-grid">
        <article class="action-card">
          <p class="entry-eyebrow">Settings</p>
          <h2>设置入口</h2>
          <p>当前阶段不展开复杂设置中心，只保留入口提示，后续若接口补齐再继续延展。</p>
          <button class="entry-action entry-action-muted" type="button" @click="openSettingsEntry">查看说明</button>
        </article>

        <article class="action-card action-card-logout">
          <p class="entry-eyebrow">Sign Out</p>
          <h2>退出登录入口</h2>
          <p>如果你想结束这次访问，可以直接清晰地从这里退出当前账号。</p>
          <button class="logout-action" type="button" @click="handleLogout">退出登录</button>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import {
  getNotificationUnreadCount,
  getNotifications,
  readNotification,
  type NotificationItem
} from '@/api/notifications';
import { useAuthStore } from '@/stores/auth';

type PageState = 'loading' | 'auth' | 'ready' | 'error';
type NotificationsState = 'idle' | 'loading' | 'success' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const notificationsRef = ref<HTMLElement | null>(null);
const pageState = ref<PageState>('loading');
const pageError = ref('当前网络或服务暂时不可用，请稍后再试。');
const notificationsState = ref<NotificationsState>('idle');
const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);
const notificationPendingIds = ref<string[]>([]);

const profile = computed(() => authStore.user);
const displayName = computed(() => profile.value?.nickname || profile.value?.username || '旅行者');
const avatarFallback = computed(() => displayName.value.slice(0, 1).toUpperCase());
const unreadSummary = computed(() =>
  unreadCount.value > 0 ? `未读提醒 ${unreadCount.value} 条` : '暂时没有未读提醒'
);
const joinedText = computed(() => `加入时间 ${formatDateTime(profile.value?.createdAt, 'YYYY.MM.DD')}`);
const statusText = computed(() => getStatusLabel(profile.value?.status));
const roleTags = computed(() => {
  const roles = profile.value?.roles?.filter(Boolean) || [];

  return roles.length ? roles.slice(0, 2).map(formatRoleLabel) : ['旅行者'];
});
const infoItems = computed(() => [
  { label: '昵称', value: displayName.value },
  { label: '邮箱', value: profile.value?.email || '未提供' },
  { label: '用户名', value: profile.value?.username ? `@${profile.value.username}` : '未提供' },
  { label: '加入时间', value: formatDateTime(profile.value?.createdAt, 'YYYY.MM.DD') }
]);

function formatRoleLabel(role: string) {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusLabel(status?: number) {
  if (status === 1) return '账户状态正常';
  if (status === 0) return '账户待启用';
  if (typeof status === 'number') return `账户状态 ${status}`;
  return '旅程档案已开启';
}

function formatDateTime(value?: string, mode: 'YYYY.MM.DD' | 'MM.DD HH:mm' = 'YYYY.MM.DD') {
  if (!value) {
    return mode === 'MM.DD HH:mm' ? '刚刚' : '时间待补充';
  }

  const normalized = value.replace(/-/g, '/');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return mode === 'MM.DD HH:mm'
      ? value.slice(5, 16).replace(' ', ' ')
      : value.slice(0, 10).replace(/-/g, '.');
  }

  const pad = (num: number) => String(num).padStart(2, '0');

  if (mode === 'MM.DD HH:mm') {
    return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function getNotificationTypeLabel(type?: string) {
  if (type === 'COMMENT') return '评论提醒';
  if (type === 'LIKE') return '点赞提醒';
  if (type === 'FAVORITE') return '收藏提醒';
  if (type === 'SYSTEM') return '系统提醒';
  return '旅行提醒';
}

function getSenderFallback(name?: string) {
  return (name || '旅').slice(0, 1).toUpperCase();
}

function openAuthDrawer() {
  authDrawerOpen.value = true;
}

function goHome() {
  router.push('/');
}

function goToDiaries() {
  router.push('/diaries');
}

function goToDiaryDiscovery() {
  router.push({
    path: '/diaries',
    query: {
      sort: 'hot'
    }
  });
}

function openSettingsEntry() {
  ElMessage.info('当前阶段仅保留设置入口展示，复杂设置能力将在后续接口补齐后开放。');
}

function scrollToNotifications() {
  nextTick(() => {
    notificationsRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
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
        pageSize: 4
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
    await loadNotifications();
  } catch (error) {
    console.error('Failed to initialize account page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = '用户资料暂时没有成功返回，建议稍后重试，或重新打开登录抽屉确认当前会话。';
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

    ElMessage.error('这条消息暂时没有标记成功，请稍后再试。');
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
      unreadCount.value = 0;
      pageState.value = 'auth';
    }
  }
);

onMounted(() => {
  initializePage();
});
</script>

<style scoped lang="scss">
.account-page {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.account-hero,
.panel-card,
.entry-card,
.action-card,
.state-panel,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.account-hero,
.panel-card,
.entry-card,
.action-card,
.state-panel {
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.account-hero {
  position: relative;
  overflow: hidden;
  padding: 42px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 28px;
  background:
    radial-gradient(circle at 14% 18%, rgba(34, 211, 238, 0.16), transparent 22%),
    radial-gradient(circle at 88% 16%, rgba(212, 175, 55, 0.18), transparent 20%),
    linear-gradient(140deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.96) 50%, rgba(245, 247, 250, 0.98) 100%);

  &::after {
    content: '';
    position: absolute;
    inset: auto -100px -120px auto;
    width: 280px;
    height: 280px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.48);
    filter: blur(12px);
  }
}

.hero-copy,
.hero-identity {
  position: relative;
  z-index: 1;
}

.hero-eyebrow,
.panel-eyebrow,
.entry-eyebrow,
.state-eyebrow {
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
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 56px;
    line-height: 1.02;
    letter-spacing: -0.04em;
    font-weight: 700;
    color: #111827;
  }
}

.hero-description,
.state-copy,
.entry-card p,
.action-card p,
.notice-feedback p {
  color: #475569;
  line-height: 1.85;
}

.hero-description {
  margin: 18px 0 0;
  max-width: 620px;
  font-size: 15px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.meta-pill,
.role-pill,
.notice-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #475569;
  font-size: 13px;
}

.meta-pill-highlight {
  background: rgba(212, 175, 55, 0.12);
  border-color: rgba(212, 175, 55, 0.26);
  color: #9a7313;
}

.hero-actions,
.state-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.hero-action,
.primary-action,
.secondary-action,
.entry-action,
.logout-action {
  min-height: 48px;
  padding: 0 20px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: rgba(255, 255, 255, 0.88);
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    background 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  }
}

.hero-action-primary,
.primary-action,
.entry-action,
.logout-action {
  border-color: rgba(212, 175, 55, 0.24);
  background: #111827;
  color: #f8fafc;

  &:hover {
    border-color: rgba(212, 175, 55, 0.5);
    background: #9a7313;
    color: #111827;
  }
}

.entry-action-muted {
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
}

.hero-identity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.avatar-shell {
  padding: 18px;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);

  :deep(.el-avatar) {
    border: 3px solid rgba(212, 175, 55, 0.32);
    background: linear-gradient(135deg, #22d3ee, #6366f1);
    color: #ffffff;
    font-size: 34px;
    font-weight: 700;
  }
}

.identity-card {
  width: min(100%, 320px);
  padding: 22px 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);

  strong {
    display: block;
    margin-top: 10px;
    color: #111827;
    font-size: 20px;
    line-height: 1.3;
  }

  p {
    margin: 8px 0 0;
    color: #64748b;
    font-size: 14px;
  }
}

.identity-label,
.info-label,
.role-label,
.notice-type,
.notice-sender,
.notice-line time {
  color: #64748b;
  font-size: 12px;
}

.content-grid,
.entry-grid,
.action-grid,
.loading-grid {
  display: grid;
  gap: 24px;
}

.content-grid,
.loading-grid {
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
}

.entry-grid,
.action-grid,
.loading-grid-secondary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card,
.entry-card,
.action-card,
.state-panel {
  padding: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 30px;
    line-height: 1.15;
    font-weight: 760;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.info-item {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.84);
}

.info-value {
  display: block;
  margin-top: 10px;
  color: #111827;
  font-size: 18px;
  line-height: 1.5;
}

.role-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notice-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  width: 100%;
  padding: 16px;
  border-radius: 24px;
  border: 1px solid rgba(212, 175, 55, 0.16);
  background: rgba(212, 175, 55, 0.08);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(212, 175, 55, 0.32);
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.07);
  }

  :deep(.el-avatar) {
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.22), rgba(99, 102, 241, 0.22));
    color: #111827;
    font-weight: 700;
  }
}

.notice-item-read {
  background: rgba(255, 255, 255, 0.84);
  border-color: rgba(226, 232, 240, 0.84);
}

.notice-copy {
  min-width: 0;
}

.notice-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notice-type {
  color: #9a7313;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.notice-copy h3 {
  margin: 8px 0 0;
  color: #111827;
  font-size: 18px;
  line-height: 1.4;
}

.notice-copy p {
  margin: 8px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.75;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-sender {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #d4af37;
}

.notice-feedback {
  padding: 28px 24px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(226, 232, 240, 0.84);

  h3 {
    margin: 10px 0 0;
    color: #111827;
    font-size: 26px;
    line-height: 1.2;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.notice-empty-title {
  color: #9a7313 !important;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
}

.inline-link {
  margin-top: 12px;
  border: none;
  padding: 0;
  background: transparent;
  color: #9a7313;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.entry-card,
.action-card {
  position: relative;
  overflow: hidden;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 32px;
    line-height: 1.12;
    font-weight: 760;
  }

  p {
    margin: 16px 0 0;
    font-size: 14px;
  }
}

.entry-card::after,
.action-card::after {
  content: '';
  position: absolute;
  right: -40px;
  bottom: -50px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  opacity: 0.5;
  pointer-events: none;
}

.entry-card-diary::after {
  background: radial-gradient(circle, rgba(34, 211, 238, 0.18) 0%, transparent 70%);
}

.entry-card-favorite::after {
  background: radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%);
}

.action-card::after {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
}

.action-card-logout {
  border-color: rgba(248, 113, 113, 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 242, 242, 0.72) 100%);
}

.logout-action {
  background: #111827;
}

.state-panel {
  min-height: 420px;
  padding: 54px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.14), transparent 20%),
    radial-gradient(circle at 82% 18%, rgba(212, 175, 55, 0.16), transparent 18%),
    linear-gradient(140deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%);

  h1 {
    margin: 0;
    max-width: 720px;
    color: #111827;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 52px;
    line-height: 1.04;
    letter-spacing: -0.04em;
    font-weight: 700;
  }
}

.state-copy {
  max-width: 620px;
  margin: 18px 0 0;
  font-size: 15px;
}

.loading-panel {
  gap: 24px;
}

.loading-hero,
.loading-card,
.notice-skeleton-item {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 320px;
}

.loading-card {
  min-height: 260px;
}

.notice-skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notice-skeleton-item {
  min-height: 108px;
  border-radius: 24px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1080px) {
  .account-hero,
  .content-grid,
  .entry-grid,
  .action-grid,
  .loading-grid,
  .loading-grid-secondary {
    grid-template-columns: 1fr;
  }

  .hero-identity {
    align-items: flex-start;
  }

  .identity-card {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .account-page {
    gap: 22px;
  }

  .account-hero,
  .panel-card,
  .entry-card,
  .action-card,
  .state-panel,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .account-hero,
  .panel-card,
  .entry-card,
  .action-card,
  .state-panel {
    padding: 24px 18px;
  }

  .hero-copy h1,
  .state-panel h1 {
    font-size: 36px;
    line-height: 1.08;
  }

  .panel-header,
  .notice-line {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-header h2,
  .entry-card h2,
  .action-card h2 {
    font-size: 26px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions,
  .state-actions {
    flex-direction: column;
  }

  .hero-action,
  .primary-action,
  .secondary-action,
  .entry-action,
  .logout-action {
    width: 100%;
    justify-content: center;
  }

  .notice-item {
    grid-template-columns: 1fr;
  }

  .loading-hero {
    min-height: 220px;
  }

  .loading-card {
    min-height: 180px;
  }
}
</style>
