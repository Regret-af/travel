<template>
  <div class="password-edit-page">
    <AuthDrawer v-model="authDrawerOpen" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="修改密码加载中">
      <div class="loading-hero" />
      <div class="loading-card" />
    </section>

    <DiaryCollectionState
      v-else-if="pageState === 'auth'"
      variant="auth"
      eyebrow="账户安全"
      title="登录后，才能修改当前账户密码"
      description="这里只处理当前密码、新密码和确认新密码，不扩展忘记密码、短信验证或双因素流程。"
      action-label="立即登录"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="openAuthDrawer"
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
        <div class="hero-copy">
          <p class="hero-eyebrow">修改密码</p>
          <h1>更新这把钥匙，让账户安全保持在你掌控之中。</h1>
          <p class="hero-description">
            提交时只会发送 `currentPassword` 和 `newPassword`。确认密码仅用于前端校验，不会提交给后端。
          </p>
        </div>
      </section>

      <section class="content-grid">
        <article class="form-card">
          <div class="section-head">
            <div>
              <p class="section-eyebrow">安全设置</p>
              <h2>重新设定当前登录密码</h2>
            </div>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="password-form">
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input
                v-model="form.currentPassword"
                type="password"
                show-password
                placeholder="输入当前登录密码"
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="form.newPassword"
                type="password"
                show-password
                placeholder="8-32 位，且同时包含字母和数字"
              />
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmNewPassword">
              <el-input
                v-model="form.confirmNewPassword"
                type="password"
                show-password
                placeholder="再次输入新密码进行确认"
              />
            </el-form-item>

            <div class="form-footer">
              <p v-if="submitError" class="submit-error">{{ submitError }}</p>
              <div class="form-actions">
                <button class="submit-button" type="button" :disabled="submitting" @click="handleSubmit">
                  {{ submitting ? '提交中...' : '更新密码' }}
                </button>
                <button class="secondary-button" type="button" :disabled="submitting" @click="goToAccount">
                  返回个人中心
                </button>
              </div>
            </div>
          </el-form>
        </article>

        <article class="tips-card">
          <p class="section-eyebrow">规则提示</p>
          <h3>当前页的校验边界</h3>
          <ul class="tips-list">
            <li>必须填写当前密码。</li>
            <li>新密码长度需要在 8 到 32 位之间。</li>
            <li>新密码必须同时包含字母和数字。</li>
            <li>确认新密码仅做前端一致性校验，不提交给后端。</li>
          </ul>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { useRouter } from 'vue-router';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import { updateMyPassword } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
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

const openAuthDrawer = () => {
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
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.page-hero,
.form-card,
.tips-card,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.page-hero,
.form-card,
.tips-card {
  padding: 34px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.hero-eyebrow,
.section-eyebrow {
  margin: 0 0 12px;
  color: #c79b1d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-copy h1,
.section-head h2 {
  margin: 0;
  color: #111827;
  font-size: 42px;
  line-height: 1.08;
  font-weight: 760;
  letter-spacing: -0.035em;
}

.hero-description,
.tips-list {
  margin: 16px 0 0;
  max-width: 660px;
  color: #475569;
  font-size: 15px;
  line-height: 1.86;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
  gap: 24px;
}

.password-form :deep(.el-form-item__label) {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.password-form :deep(.el-input__wrapper) {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.95) inset !important;
}

.form-footer {
  margin-top: 26px;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.submit-button,
.secondary-button {
  min-height: 48px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.submit-button {
  border: 1px solid rgba(212, 175, 55, 0.24);
  background: #111827;
  color: #f8fafc;
}

.secondary-button {
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
}

.submit-error {
  margin: 0 0 14px;
  color: #b91c1c;
  font-size: 14px;
}

.tips-card h3 {
  margin: 0;
  color: #111827;
  font-size: 28px;
  line-height: 1.16;
  font-weight: 760;
}

.tips-list {
  padding-left: 18px;
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-card {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 220px;
}

.loading-card {
  min-height: 360px;
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
  }
}

@media (max-width: 767px) {
  .password-edit-page {
    gap: 22px;
  }

  .page-hero,
  .form-card,
  .tips-card,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .page-hero,
  .form-card,
  .tips-card {
    padding: 24px 18px;
  }

  .hero-copy h1,
  .section-head h2 {
    font-size: 34px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
