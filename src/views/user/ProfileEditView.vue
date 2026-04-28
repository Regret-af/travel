<template>
  <div class="profile-edit-page">
    <AuthDrawer v-model="authDrawerOpen" :initial-mode="authInitialMode" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="资料编辑加载中">
      <div class="loading-hero" />
      <div class="loading-grid">
        <div class="loading-card" />
        <div class="loading-card" />
      </div>
    </section>

    <AuthRequiredView
      v-else-if="pageState === 'auth'"
      title="登录后编辑个人资料"
      description="更新头像、昵称和个人简介，让你的旅行主页更完整。"
      @login="openLoginDrawer"
      @register="openRegisterDrawer"
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
        <div class="hero-bg" />
        <div class="hero-copy">
          <h1>编辑个人资料</h1>
          <p>在这里定制你的旅行者名片</p>
        </div>
      </section>

      <section class="edit-shell">
        <div class="form-column">
          <article class="form-card glass-card">
            <div class="section-head">
              <h2>基本信息</h2>
              <p>这些信息将向其他旅行者公开展示</p>
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

              <el-form-item label="个人简介" prop="bio">
                <el-input
                  v-model="form.bio"
                  type="textarea"
                  :rows="6"
                  maxlength="255"
                  show-word-limit
                  resize="none"
                  placeholder="分享你的旅行故事、最爱的目的地或是探险宣言..."
                />
              </el-form-item>

              <p v-if="submitError" class="submit-error">{{ submitError }}</p>
            </el-form>
          </article>
        </div>

        <div class="avatar-column">
          <div class="section-head">
            <h2>头像设置</h2>
            <p>清晰的头像有助于让旅伴快速认识你</p>
          </div>

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
                shape="circle"
                title="更换头像"
                description="头像会出现在个人主页、日记作者信息和通知列表中。"
                button-text="更换头像"
                placeholder-title="选择头像"
                placeholder-description="建议使用清晰、主体明确的图片"
                tip="支持 JPG、PNG 或 GIF 格式，建议尺寸 800x800px。"
                @uploaded="handleAvatarUploaded"
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="form-footer">
          <p>所有修改将在确认保存后立即生效</p>
          <div class="form-actions">
            <button class="secondary-button" type="button" :disabled="submitting" @click="goToAccount">
              返回
            </button>
            <button class="submit-button" type="button" :disabled="submitting" @click="handleSubmit">
              <el-icon><Check /></el-icon>
              {{ submitting ? '保存中...' : '保存所有修改' }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { useRouter } from 'vue-router';
import { Check } from '@element-plus/icons-vue';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import AuthRequiredView from '@/components/auth/AuthRequiredView.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import ImageUploadCard from '@/components/user/ImageUploadCard.vue';
import { updateMyProfile } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const authInitialMode = ref<'login' | 'register'>('login');
const pageState = ref<PageState>('loading');
const pageError = ref('当前无法进入资料编辑页，请稍后重试。');
const submitError = ref('');
const submitting = ref(false);
const formRef = ref<FormInstance>();
const uploadFormRef = ref<FormInstance>();
const form = reactive({
  nickname: '',
  avatarUrl: '',
  bio: ''
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
  ],
  bio: [
    {
      max: 255,
      message: '个人简介最多 255 个字符',
      trigger: ['blur', 'change']
    }
  ]
};

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

const syncProfile = () => {
  form.nickname = authStore.user?.nickname || '';
  form.avatarUrl = authStore.user?.avatarUrl || '';
  form.bio = authStore.user?.bio || '';
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
      avatarUrl: form.avatarUrl.trim(),
      bio: form.bio.trim() || undefined
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
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  color: #0f172a;
}

.page-hero,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.page-hero {
  position: relative;
  height: 320px;
  margin: -88px -24px 0;
  padding: 120px 24px 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0;
  background: rgba(239, 246, 255, 0.6);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(0, 91, 173, 0.12), transparent 46%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.74), rgba(239, 246, 255, 0.78)),
    url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80') center / cover;
  opacity: 0.6;
  mix-blend-mode: multiply;
}

.hero-copy {
  position: relative;
  z-index: 1;
  text-align: center;

  h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-display-sm);
    line-height: 1.12;
    font-weight: var(--font-weight-display);
    letter-spacing: -0.03em;
  }

  p {
    margin: 14px 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-5xl);
    line-height: 1.4;
    font-weight: var(--font-weight-semibold);
  }
}

.edit-shell,
.loading-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 64px;
}

.edit-shell {
  position: relative;
  z-index: 2;
  margin-top: -80px;
  padding: 0 32px 80px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.13);
  backdrop-filter: blur(12px);
}

.form-card,
.avatar-column {
  padding: 48px 0;
}

.glass-card {
  min-width: 0;
}

.section-head {
  margin-bottom: 32px;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-5xl);
    line-height: 1.35;
    font-weight: var(--font-weight-title);
  }

  p {
    margin: 8px 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: 1.6;
  }
}

.profile-form :deep(.el-form-item__label) {
  padding: 0 0 10px 8px;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.profile-form :deep(.el-input__wrapper) {
  min-height: 56px;
  border-radius: 22px;
  background: #eff1f2;
  box-shadow: 0 0 0 1px transparent inset !important;
  transition: box-shadow 0.24s ease;
}

.profile-form :deep(.el-input__wrapper.is-focus),
.profile-form :deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px #004483 inset,
    var(--shadow-ring-accent) !important;
}

.profile-form :deep(.el-input__inner) {
  padding: 0 8px;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.profile-form :deep(.el-textarea__inner) {
  min-height: 168px !important;
  padding: 18px 22px;
  border: none;
  border-radius: 22px;
  background: #eff1f2;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
  box-shadow: 0 0 0 1px transparent inset !important;
  transition: box-shadow 0.24s ease;
}

.profile-form :deep(.el-input__count),
.profile-form :deep(.el-textarea .el-input__count) {
  background: transparent;
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
  grid-column: 1 / -1;
  margin-top: -16px;
  padding-top: 40px;
  border-top: 1px solid rgba(226, 232, 240, 0.72);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  justify-content: flex-end;
}

.submit-button,
.secondary-button {
  min-height: 56px;
  padding: 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.66;
  }
}

.submit-button {
  border: 1px solid transparent;
  background: #005bad;
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(0, 91, 173, 0.18);
}

.secondary-button {
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-muted);
}

.submit-error {
  margin: 18px 0 0;
  color: #b91c1c;
  font-size: var(--font-size-md);
}

.avatar-column {
  min-width: 0;
}

.avatar-upload-item :deep(.upload-card) {
  padding: 40px;
  border-radius: 24px;
  background: var(--color-surface-container-low, #f2f3fb);
  border-color: transparent;
  box-shadow: none;
}

.avatar-upload-item :deep(.upload-copy h3) {
  font-size: var(--font-size-xl);
}

.avatar-upload-item :deep(.upload-description) {
  max-width: 260px;
  margin-left: auto;
  margin-right: auto;
}

.avatar-upload-item :deep(.upload-action) {
  background: #ffffff;
  color: #004483;
  border-color: rgba(0, 68, 131, 0.2);
  box-shadow: none;

  &:hover:not(:disabled) {
    background: #005bad;
    color: #ffffff;
  }
}

.avatar-upload-item :deep(.upload-tip) {
  display: block;
  width: 100%;
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
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
  .edit-shell,
  .loading-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .avatar-column {
    padding-top: 0;
  }
}

@media (max-width: 767px) {
  .profile-edit-page {
    gap: 22px;
  }

  .page-hero,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .page-hero {
    height: 260px;
    margin: -88px -24px 0;
    padding: 108px 18px 56px;
  }

  .hero-copy h1 {
    font-size: var(--font-size-11xl);
  }

  .hero-copy p {
    font-size: var(--font-size-xl);
  }

  .edit-shell {
    margin-top: -54px;
    padding: 0 18px 48px;
    border-radius: 24px;
    gap: 0;
  }

  .form-card,
  .avatar-column {
    padding: 28px 0;
  }

  .section-head h2 {
    font-size: var(--font-size-4xl);
  }

  .form-actions {
    flex-direction: column;
  }

  .form-footer {
    margin-top: 0;
    align-items: stretch;
    flex-direction: column;

    p {
      text-align: center;
    }
  }

  .submit-button,
  .secondary-button {
    width: 100%;
  }

  .avatar-upload-item :deep(.upload-card) {
    padding: 28px 18px;
  }
}
</style>
