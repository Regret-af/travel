<template>
  <section class="auth-required">
    <div class="guest-bg" />
    <div class="guest-overlay" />
    <div class="guest-panel">
      <div class="guest-icon">
        <el-icon><UserFilled /></el-icon>
      </div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <div class="guest-actions">
        <button class="primary-action" type="button" @click="$emit('login')">立即登录</button>
        <button class="secondary-action" type="button" @click="$emit('register')">注册账户</button>
      </div>
      <span class="guest-note">登录即表示你同意平台服务协议和隐私政策</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { UserFilled } from '@element-plus/icons-vue';

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: '开启你的私人旅行杂志',
    description: '登录以记录每一次不期而遇，收藏那些拨动心弦的瞬间，与世界分享你的探索之旅。'
  }
);

defineEmits<{
  (event: 'login'): void;
  (event: 'register'): void;
}>();
</script>

<style scoped lang="scss">
.auth-required {
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

.primary-action,
.secondary-action {
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

.guest-note {
  display: block;
  margin-top: 24px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

@media (max-width: 767px) {
  .auth-required {
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

  .primary-action,
  .secondary-action {
    width: 100%;
  }
}
</style>
