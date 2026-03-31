<template>
  <div class="profile-edit-page">
    <AuthDrawer v-model="authDrawerOpen" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="资料编辑加载中">
      <div class="loading-hero" />
      <div class="loading-grid">
        <div class="loading-card" />
        <div class="loading-card" />
      </div>
    </section>

    <DiaryCollectionState
      v-else-if="pageState === 'auth'"
      variant="auth"
      eyebrow="账户资料"
      title="登录后，才能编辑属于你的公开资料"
      description="登录后即可更新昵称和头像，让你的公开形象保持在你想呈现的状态。"
      action-label="立即登录"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="openAuthDrawer"
    />

    <DiaryCollectionState
      v-else-if="pageState === 'error'"
      variant="error"
      eyebrow="连接受阻"
      title="资料编辑页暂时没有顺利展开"
      :description="pageError"
      action-label="重新加载"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="initializePage"
    />

    <template v-else>
      <section class="page-hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">资料编辑</p>
          <h1>让别人看到你的第一眼，更像现在的你。</h1>
          <p class="hero-description">
            在这里更新昵称和头像，让你的公开资料看起来更贴近现在的你。
          </p>
        </div>

      </section>

      <section class="content-grid">
        <div class="main-column">
          <article class="preview-card">
            <p class="section-eyebrow">资料预览</p>
            <div class="identity-row">
              <el-avatar :size="76" :src="form.avatarUrl">
                {{ avatarFallback }}
              </el-avatar>
              <div>
                <h3>{{ previewNickname }}</h3>
                <p>头像与昵称会用于你的公开展示形象。</p>
              </div>
            </div>
          </article>

          <article class="form-card">
            <div class="section-head">
              <div>
                <p class="section-eyebrow">公开资料</p>
                <h2>更新这张属于你的名片</h2>
              </div>
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="profile-form">
              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="form.nickname"
                  maxlength="40"
                  show-word-limit
                  placeholder="输入想展示在页面上的昵称"
                />
              </el-form-item>

              <div class="form-footer">
                <p v-if="submitError" class="submit-error">{{ submitError }}</p>
                <div class="form-actions">
                  <button class="submit-button" type="button" :disabled="submitting" @click="handleSubmit">
                    {{ submitting ? '保存中...' : '保存资料' }}
                  </button>
                  <button class="secondary-button" type="button" :disabled="submitting" @click="goToAccount">
                    返回个人中心
                  </button>
                </div>
              </div>
            </el-form>
          </article>
        </div>

        <div class="side-column side-column-upload">
          <el-form
            ref="uploadFormRef"
            :model="form"
            :rules="rules"
            hide-required-asterisk
            class="upload-form"
          >
            <el-form-item prop="avatarUrl" class="avatar-upload-item">
              <ImageUploadCard
                v-model="form.avatarUrl"
                biz-type="avatar"
                shape="square"
                title="换一张新的头像"
                description="头像会出现在个人中心、日记作者信息和通知列表中。"
                button-text="上传头像"
                placeholder-title="选择头像图片"
                placeholder-description="建议使用清晰、主体明确的图片"
                tip="上传成功后会自动更新头像"
                @uploaded="handleAvatarUploaded"
              />
            </el-form-item>
          </el-form>
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
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import ImageUploadCard from '@/components/user/ImageUploadCard.vue';
import { updateMyProfile } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const pageState = ref<PageState>('loading');
const pageError = ref('当前无法进入资料编辑页，请稍后重试。');
const submitError = ref('');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const uploadFormRef = ref<FormInstance>();
const form = reactive({
  nickname: '',
  avatarUrl: ''
});

const rules: FormRules<typeof form> = {
  nickname: [
    {
      validator: (_, value: string, callback) => {
        if (!value?.trim()) {
          callback(new Error('请输入昵称'));
          return;
        }

        callback();
      },
      trigger: 'blur'
    }
  ],
  avatarUrl: [
    {
      validator: (_, value: string, callback) => {
        if (!value?.trim()) {
          callback(new Error('请先上传头像'));
          return;
        }

        callback();
      },
      trigger: ['change', 'blur']
    }
  ]
};

const previewNickname = computed(() => form.nickname.trim() || '旅行者');
const avatarFallback = computed(() => previewNickname.value.slice(0, 1).toUpperCase());

const openAuthDrawer = () => {
  authDrawerOpen.value = true;
};

const goToAccount = () => {
  router.push('/account');
};

const syncProfile = () => {
  form.nickname = authStore.user?.nickname || '';
  form.avatarUrl = authStore.user?.avatarUrl || '';
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

    syncProfile();
    pageState.value = 'ready';
  } catch (error) {
    console.error('Failed to initialize profile edit page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = getApiErrorMessage(error, '当前无法进入资料编辑页，请稍后重试。');
  }
};

const handleAvatarUploaded = () => {
  submitError.value = '';
  formRef.value?.clearValidate('avatarUrl');
  uploadFormRef.value?.validateField('avatarUrl').catch(() => undefined);
};

const handleSubmit = async () => {
  if (!formRef.value || !uploadFormRef.value || submitting.value) return;

  submitError.value = '';

  const [profileValid, avatarValid] = await Promise.all([
    formRef.value.validate().then(() => true).catch(() => false),
    uploadFormRef.value.validate().then(() => true).catch(() => false)
  ]);
  const valid = profileValid && avatarValid;

  if (!valid) {
    ElMessage.warning('请先完成必填项后再保存。');
    return;
  }

  submitting.value = true;

  try {
    await updateMyProfile({
      nickname: form.nickname.trim(),
      avatarUrl: form.avatarUrl.trim()
    });

    await authStore.fetchMe();
    syncProfile();
    ElMessage.success('资料已更新');
  } catch (error) {
    console.error('Failed to update profile', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      openAuthDrawer();
      return;
    }

    submitError.value = getApiErrorMessage(error, '资料保存失败，请稍后重试。');
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
.profile-edit-page {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.page-hero,
.form-card,
.preview-card,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.page-hero {
  padding: 42px;
  display: grid;
  gap: 24px;
  background:
    radial-gradient(circle at 16% 20%, rgba(34, 211, 238, 0.14), transparent 22%),
    radial-gradient(circle at 84% 16%, rgba(212, 175, 55, 0.16), transparent 20%),
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
  font-size: var(--font-size-16xl);
  line-height: 1.05;
  font-weight: var(--font-weight-title);
  letter-spacing: -0.035em;
}

.hero-description {
  margin: 18px 0 0;
  max-width: 660px;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.86;
}

.content-grid,
.loading-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: 24px;
}

.form-card,
.preview-card {
  padding: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.section-head h2 {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-8xl);
  line-height: 1.14;
  font-weight: var(--font-weight-title);
}

.profile-form :deep(.el-form-item__label) {
  color: #334155;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.profile-form :deep(.el-input__wrapper) {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.95) inset !important;
}

.upload-form {
  display: contents;
}

.avatar-upload-item {
  margin: 0;
}

.avatar-upload-item :deep(.el-form-item__content) {
  display: block;
}

.avatar-upload-item :deep(.el-form-item__error) {
  padding-top: 10px;
}

.form-footer {
  margin-top: 24px;
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
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
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
  font-size: var(--font-size-md);
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.identity-row {
  display: flex;
  align-items: center;
  gap: 16px;

  h3 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-5xl);
    line-height: 1.18;
    font-weight: var(--font-weight-title);
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: var(--font-size-md);
  }
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
  min-height: 240px;
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
  .content-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .profile-edit-page {
    gap: 22px;
  }

  .page-hero,
  .form-card,
  .preview-card,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .page-hero,
  .form-card,
  .preview-card {
    padding: 24px 18px;
  }

  .hero-copy h1,
  .section-head h2 {
    font-size: var(--font-size-10xl);
  }

  .form-actions {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
