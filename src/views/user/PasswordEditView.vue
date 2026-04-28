<template>
  <div class="password-edit-page">
    <AuthDrawer v-model="authDrawerOpen" :initial-mode="authInitialMode" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="修改密码加载中">
      <div class="loading-hero" />
      <div class="loading-card" />
    </section>

    <AuthRequiredView
      v-else-if="pageState === 'auth'"
      title="登录后管理账户安全"
      description="登录后可以修改当前账户密码，保护你的个人资料和旅行内容。"
      @login="openLoginDrawer"
      @register="openRegisterDrawer"
    />

    <DiaryCollectionState
      v-else-if="pageState === 'error'"
      variant="error"
      eyebrow="连接受阻"
      title="修改密码页暂时没有顺利展开"
      :description="pageError"
      action-label="重新加载"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="initializePage"
    />

    <template v-else>
      <section class="page-hero">
        <div class="hero-bg" />
        <div class="hero-copy">
          <h1>账户安全</h1>
          <p>在这里管理你的登录凭证</p>
        </div>
      </section>

      <section class="security-shell">
        <div class="content-grid">
          <article class="form-card">
            <div class="section-head">
              <h2>修改登录密码</h2>
              <p>定期更换密码可以提高账户的安全性。</p>
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="password-form">
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input
                  v-model="form.currentPassword"
                  type="password"
                  show-password
                  placeholder="请输入当前密码"
                />
              </el-form-item>

              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="form.newPassword"
                  type="password"
                  show-password
                  placeholder="长度不小于 8 位"
                />
                <div class="strength-panel">
                  <div class="strength-bars" :class="passwordStrength.tone">
                    <span
                      v-for="item in 3"
                      :key="item"
                      class="strength-bar"
                      :class="{ active: item <= passwordStrength.score }"
                    />
                  </div>
                  <p :class="['strength-text', `strength-${passwordStrength.tone}`]">
                    密码强度：{{ passwordStrength.label }}
                  </p>
                </div>
              </el-form-item>

              <el-form-item label="确认新密码" prop="confirmNewPassword">
                <el-input
                  v-model="form.confirmNewPassword"
                  type="password"
                  show-password
                  placeholder="再次输入你的新密码"
                />
              </el-form-item>

              <p v-if="submitError" class="submit-error">{{ submitError }}</p>
            </el-form>
          </article>

          <article class="tips-card">
            <div class="tips-title">
              <span class="tips-icon">
                <el-icon><CircleCheckFilled /></el-icon>
              </span>
              <h3>安全建议</h3>
            </div>

            <div class="tips-block">
              <p>一个强大的密码通常包含：</p>
              <ul class="tips-list">
                <li v-for="item in passwordTips" :key="item">
                  <el-icon><CircleCheckFilled /></el-icon>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div class="protect-tip">
              <blockquote>
                “为了确保你的账户安全，我们建议你不要在多个网站上重复使用相同的密码。定期更新密码是维护个人信息安全的重要一环。”
              </blockquote>
            </div>
          </article>
        </div>

        <div class="form-footer">
          <button class="secondary-button" type="button" :disabled="submitting" @click="goToAccount">
            返回个人中心
          </button>
          <button class="submit-button" type="button" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '提交中...' : '保存修改' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { useRouter } from 'vue-router';
import { CircleCheckFilled } from '@element-plus/icons-vue';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import AuthRequiredView from '@/components/auth/AuthRequiredView.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import { updateMyPassword } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const authInitialMode = ref<'login' | 'register'>('login');
const pageState = ref<PageState>('loading');
const pageError = ref('当前无法进入修改密码页，请稍后重试。');
const formRef = ref<FormInstance>();
const submitting = ref(false);
const submitError = ref('');
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
});

const passwordTips = [
  '至少 8 个字符，建议 12 位以上',
  '包含大写字母和小写字母',
  '包含数字和特殊符号（如 @, #, $）'
];

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/;
const rules: FormRules<typeof form> = {
  currentPassword: [
    {
      required: true,
      message: '请输入当前密码',
      trigger: 'blur'
    }
  ],
  newPassword: [
    {
      validator: (_, value: string, callback) => {
        if (!value) {
          callback(new Error('请输入新密码'));
          return;
        }

        if (!passwordPattern.test(value)) {
          callback(new Error('新密码需为 8-32 位，且同时包含字母和数字'));
          return;
        }

        callback();
      },
      trigger: 'blur'
    }
  ],
  confirmNewPassword: [
    {
      validator: (_, value: string, callback) => {
        if (!value) {
          callback(new Error('请再次输入新密码'));
          return;
        }

        if (value !== form.newPassword) {
          callback(new Error('两次输入的新密码不一致'));
          return;
        }

        callback();
      },
      trigger: 'blur'
    }
  ]
};

const passwordStrength = computed(() => {
  const value = form.newPassword;

  if (!value) {
    return { score: 0, label: '待输入', tone: 'muted' };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return { score: 1, label: '弱', tone: 'weak' };
  if (score === 2) return { score: 2, label: '中', tone: 'medium' };
  return { score: 3, label: '强', tone: 'strong' };
});

const openAuthDrawer = () => {
  authInitialMode.value = 'login';
  authDrawerOpen.value = true;
};

const openLoginDrawer = () => {
  authInitialMode.value = 'login';
  authDrawerOpen.value = true;
};

const openRegisterDrawer = () => {
  authInitialMode.value = 'register';
  authDrawerOpen.value = true;
};

const goToAccount = () => {
  router.push('/account');
};

const initializePage = async () => {
  if (!authStore.token) {
    pageState.value = 'auth';
    return;
  }

  pageState.value = 'loading';

  try {
    const user = await authStore.fetchMe();

    if (!authStore.token || !user) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'ready';
  } catch (error) {
    console.error('Failed to initialize password page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = getApiErrorMessage(error, '当前无法进入修改密码页，请稍后重试。');
  }
};

const resetForm = () => {
  form.currentPassword = '';
  form.newPassword = '';
  form.confirmNewPassword = '';
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  if (!formRef.value || submitting.value) return;

  submitError.value = '';

  const valid = await formRef.value
    .validate()
    .then(() => true)
    .catch(() => false);

  if (!valid) {
    ElMessage.warning('请先完成表单校验后再提交。');
    return;
  }

  submitting.value = true;

  try {
    await updateMyPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    });

    resetForm();
    ElMessage.success('密码已更新');
  } catch (error) {
    console.error('Failed to update password', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      openAuthDrawer();
      return;
    }

    submitError.value = getApiErrorMessage(error, '密码修改失败，请稍后重试。');
  } finally {
    submitting.value = false;
  }
};

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token && token !== previousToken) {
      initializePage();
      return;
    }

    if (!token) {
      pageState.value = 'auth';
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.password-edit-page {
  width: min(100%, 1400px);
  margin: 0 auto;
  color: var(--color-text-primary);
}

.page-hero {
  position: relative;
  min-height: 450px;
  margin: -88px -24px 0;
  padding: 120px 32px 96px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.42) 48%, rgba(255, 255, 255, 0.08) 100%),
    url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85') center / cover;
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: min(100%, 1400px);
  margin: 0 auto;

  h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-display-md);
    line-height: 1.2;
    font-weight: var(--font-weight-display);
  }

  p {
    margin: 16px 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-5xl);
    line-height: 1.4;
    font-weight: var(--font-weight-semibold);
  }
}

.security-shell {
  position: relative;
  z-index: 2;
  margin: -96px 32px 80px;
  padding: 56px 64px 48px;
  border-radius: var(--radius-panel);
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(12px);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(340px, 5fr);
  gap: 64px;
}

.section-head {
  margin-bottom: 34px;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-title-lg);
    line-height: 1.3;
    font-weight: var(--font-weight-title);
  }

  p {
    margin: 10px 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
  }
}

.password-form :deep(.el-form-item) {
  margin-bottom: 30px;
}

.password-form :deep(.el-form-item__label) {
  padding: 0 0 9px 8px;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.password-form :deep(.el-input__wrapper) {
  min-height: 56px;
  border-radius: 22px;
  background: #eff1f2;
  box-shadow: none !important;
  transition: box-shadow 0.24s ease, background 0.24s ease;
}

.password-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(0, 91, 173, 0.16) !important;
  background: #ffffff;
}

.password-form :deep(.el-input__inner) {
  padding: 0 8px;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.strength-panel {
  width: 100%;
  padding: 8px 8px 0;
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.strength-bar {
  height: 4px;
  border-radius: 999px;
  background: #ecedf5;

  &.active {
    background: #ba1a1a;
  }
}

.strength-bars.medium .strength-bar.active {
  background: #c79b1d;
}

.strength-bars.strong .strength-bar.active {
  background: #22c55e;
}

.strength-text {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.4;
}

.strength-muted {
  color: var(--color-text-muted);
}

.strength-weak {
  color: #ba1a1a;
}

.strength-medium {
  color: #9a7313;
}

.strength-strong {
  color: #15803d;
}

.tips-card {
  min-height: 100%;
  padding: 48px;
  border-radius: 24px;
  background: rgba(242, 243, 251, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 38px;

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-5xl);
    line-height: 1.35;
    font-weight: var(--font-weight-title);
  }
}

.tips-icon {
  color: #9a7313;
  font-size: var(--font-size-6xl);
}

.tips-block {
  flex: 1;
}

.tips-block p,
.protect-tip p {
  margin: 0 0 18px;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.tips-list {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
    line-height: 1.75;

    .el-icon {
      margin-top: 5px;
      flex-shrink: 0;
      color: #22c55e;
    }
  }
}

.protect-tip {
  margin-top: 40px;
  padding-top: 40px;
  border-top: 1px solid rgba(226, 232, 240, 0.9);

  blockquote {
    margin: 0;
    padding: 28px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.52);
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    font-style: italic;
    line-height: 1.75;
  }
}

.form-footer {
  margin-top: 48px;
  padding-top: 40px;
  border-top: 1px solid rgba(226, 232, 240, 0.72);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.submit-button,
.secondary-button {
  min-height: 56px;
  padding: 0 40px;
  border-radius: 999px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.66;
  }
}

.submit-button {
  border: none;
  background: #005bad;
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(0, 91, 173, 0.2);
}

.secondary-button {
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-secondary);
}

.submit-error {
  margin: -10px 0 0;
  color: #b91c1c;
  font-size: var(--font-size-md);
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-card {
  border-radius: var(--radius-panel);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 260px;
}

.loading-card {
  min-height: 420px;
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
  .content-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
}

@media (max-width: 767px) {
  .page-hero {
    min-height: 320px;
    margin: -88px -24px 0;
    padding: 108px 18px 64px;
  }

  .hero-copy h1 {
    font-size: var(--font-size-11xl);
  }

  .hero-copy p {
    font-size: var(--font-size-xl);
  }

  .security-shell {
    margin: -64px 0 48px;
    padding: 28px 18px 32px;
    border-radius: var(--radius-card);
  }

  .section-head h2 {
    font-size: var(--font-size-8xl);
  }

  .tips-card {
    padding: 24px 18px;
  }

  .form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .submit-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
