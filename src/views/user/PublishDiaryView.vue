<template>
  <div class="publish-page">
    <AuthDrawer v-model="authDrawerOpen" :initial-mode="authInitialMode" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="发布页加载中">
      <div class="loading-hero" />
      <div class="loading-grid">
        <div class="loading-card loading-card-large" />
        <div class="loading-card" />
      </div>
    </section>

    <AuthRequiredView
      v-else-if="pageState === 'auth'"
      title="登录后发布旅行日记"
      description="登录后可以撰写、保存并发布你的旅途故事。"
      @login="openLoginDrawer"
      @register="openRegisterDrawer"
    />

    <DiaryCollectionState
      v-else-if="pageState === 'error'"
      variant="error"
      eyebrow="连接受阻"
      title="创作页暂时没有顺利展开"
      :description="pageError"
      action-label="重新加载"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="initializePage"
    />

    <template v-else>
      <section class="publish-hero">
        <div class="hero-copy">
          <p class="hero-eyebrow">旅行日记</p>
          <h1>记录你的旅行足迹</h1>
          <p class="hero-description">
            将路上的风景与真切心绪，翻成一册适合慢慢阅读的故事目录。
          </p>
        </div>
      </section>

      <section class="compose-layout">
        <div class="editor-column">
          <article class="editor-panel glass-panel">
            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="diary-form">
              <el-form-item prop="title" class="title-item">
                <el-input
                  v-model="form.title"
                  maxlength="100"
                  placeholder="在此输入游记标题..."
                />
              </el-form-item>

              <el-form-item label="游记摘要" prop="summary" class="summary-item">
                <el-input
                  v-model="form.summary"
                  type="textarea"
                  maxlength="255"
                  show-word-limit
                  :autosize="{ minRows: 3, maxRows: 5 }"
                  placeholder="写一段简洁优美的引言，吸引读者走进你的故事..."
                />
              </el-form-item>

              <el-form-item label="正文内容" prop="content" class="content-item">
                <div class="content-editor">
                  <div class="editor-toolbar" aria-label="正文快捷工具">
                    <button type="button" title="加粗" @click="wrapContent('**', '**')">
                      <strong>B</strong>
                    </button>
                    <button type="button" title="斜体" @click="wrapContent('*', '*')">
                      <em>I</em>
                    </button>
                    <button type="button" title="插入列表" @click="insertContent('\\n- ')">
                      <span>列表</span>
                    </button>
                    <span class="toolbar-divider" />
                    <button type="button" title="提示上传封面" @click="focusCoverTip">
                      <el-icon><Picture /></el-icon>
                    </button>
                    <button type="button" title="插入地点" @click="insertContent('\\n地点：')">
                      <el-icon><Location /></el-icon>
                    </button>
                  </div>

                  <el-input
                    ref="contentInputRef"
                    v-model="form.content"
                    type="textarea"
                    maxlength="10000"
                    show-word-limit
                    :autosize="{ minRows: 18, maxRows: 26 }"
                    placeholder="开始编织你的旅程..."
                  />
                </div>
              </el-form-item>
            </el-form>
          </article>

          <div class="compose-actions">
            <button class="submit-button" type="button" :disabled="submitting" @click="handleSubmit">
              {{ submitting ? '发布中...' : '立即发布' }}
            </button>
            <button class="secondary-button" type="button" :disabled="submitting" @click="goToMyDiaries">
              <el-icon><Back /></el-icon>
              返回我的日记
            </button>
          </div>

          <p v-if="submitError" class="submit-error">{{ submitError }}</p>
        </div>

        <aside class="settings-column">
          <article ref="coverPanelRef" class="cover-panel glass-panel">
            <div class="panel-head">
              <h2>封面照片</h2>
            </div>
            <ImageUploadCard
              v-model="form.coverUrl"
              biz-type="diary_image"
              title="上传精美封面"
              description="封面会出现在日记列表和详情页顶部，发布前必须上传。"
              button-text="上传封面"
              placeholder-title="选择封面图"
              placeholder-description="建议使用横向或竖向风景图"
              tip="封面为必填项"
              shape="square"
              @uploaded="handleCoverUploaded"
            />
          </article>

          <article class="settings-panel glass-panel">
            <h2>发布设置</h2>
            <div class="settings-form">
              <div class="setting-field">
                <label for="diary-content-type">内容分类</label>
                <div class="select-shell">
                  <select
                    id="diary-content-type"
                    v-model.number="form.contentType"
                    :disabled="categoriesStatus === 'loading'"
                  >
                    <option :value="0" disabled>
                      {{ categoriesStatus === 'loading' ? '分类加载中...' : '请选择日记分类' }}
                    </option>
                    <option
                      v-for="option in categoryOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <el-icon><ArrowDown /></el-icon>
                </div>
                <p v-if="categoriesStatus === 'error'" class="setting-error">
                  分类加载失败，
                  <button type="button" @click="loadCategoryOptions">重新加载</button>
                </p>
              </div>

              <div class="setting-field">
                <span class="setting-label">可见权限</span>
                <div class="visibility-grid">
                  <label
                    v-for="option in visibilityOptions"
                    :key="option.value"
                    class="visibility-option"
                    :class="{ active: form.visibility === option.value }"
                  >
                    <input v-model.number="form.visibility" type="radio" :value="option.value" />
                    <el-icon>
                      <component :is="option.icon" />
                    </el-icon>
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>

              <div class="check-item" :class="{ done: isReadyToPublish }">
                <el-icon><Check /></el-icon>
                <div>
                  <span>发布检查</span>
                  <p>{{ publishCheckText }}</p>
                </div>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowDown, Back, Check, Location, Lock, Picture, View } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules, type InputInstance } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import AuthRequiredView from '@/components/auth/AuthRequiredView.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import ImageUploadCard from '@/components/user/ImageUploadCard.vue';
import { createTravelDiary, getDiaryCategoryOptions, type DiaryCategoryOption } from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';
type CategoryStatus = 'idle' | 'loading' | 'success' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const authInitialMode = ref<'login' | 'register'>('login');
const formRef = ref<FormInstance>();
const contentInputRef = ref<InputInstance>();
const coverPanelRef = ref<HTMLElement | null>(null);
const pageState = ref<PageState>('loading');
const categoriesStatus = ref<CategoryStatus>('idle');
const categoryOptions = ref<DiaryCategoryOption[]>([]);
const pageError = ref('当前无法进入发布页面，请稍后重试。');
const submitting = ref(false);
const submitError = ref('');
const form = reactive({
  title: '',
  summary: '',
  coverUrl: '',
  contentType: 0,
  visibility: 1,
  content: ''
});
const visibilityOptions = [
  { value: 1, label: '公开', icon: View },
  { value: 0, label: '私有', icon: Lock }
];

const rules: FormRules<typeof form> = {
  title: [
    {
      validator: (_, value: string, callback) => {
        if (!value?.trim()) {
          callback(new Error('请输入日记标题'));
          return;
        }

        callback();
      },
      trigger: 'blur'
    }
  ],
  content: [
    {
      validator: (_, value: string, callback) => {
        if (!value?.trim()) {
          callback(new Error('请输入正文内容'));
          return;
        }

        callback();
      },
      trigger: 'blur'
    }
  ],
  contentType: [
    {
      validator: (_, value: number, callback) => {
        if (!Number.isFinite(value) || value <= 0) {
          callback(new Error('请选择日记分类'));
          return;
        }

        callback();
      },
      trigger: 'change'
    }
  ]
};

const isReadyToPublish = computed(
  () =>
    Boolean(form.title.trim()) &&
    Boolean(form.content.trim()) &&
    Boolean(form.coverUrl.trim()) &&
    form.contentType > 0
);
const publishCheckText = computed(() => {
  if (!form.title.trim()) return '还需要填写标题';
  if (!form.content.trim()) return '还需要填写正文';
  if (!form.coverUrl.trim()) return '还需要上传封面';
  if (form.contentType <= 0) return '还需要选择内容分类';
  return '必填项已完成，可以发布';
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

const goToMyDiaries = () => {
  router.push('/account/diaries');
};

const loadCategoryOptions = async () => {
  categoriesStatus.value = 'loading';

  try {
    const res = await getDiaryCategoryOptions({ skipErrorToast: true });
    categoryOptions.value = res.data.filter((item) => Number.isFinite(item.value));

    const firstOption = categoryOptions.value[0];

    if (!form.contentType && categoryOptions.value.length === 1 && firstOption) {
      form.contentType = firstOption.value;
    }

    categoriesStatus.value = 'success';
  } catch (error) {
    console.error('Failed to load diary category options', error);
    categoryOptions.value = [];
    categoriesStatus.value = 'error';
  }
};

const initializePage = async () => {
  if (!authStore.token) {
    pageState.value = 'auth';
    return;
  }

  pageState.value = 'loading';
  pageError.value = '当前无法进入发布页面，请稍后重试。';

  try {
    const user = await authStore.fetchMe();

    if (!authStore.token || !user) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'ready';
    loadCategoryOptions();
  } catch (error) {
    console.error('Failed to initialize publish page', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      return;
    }

    pageState.value = 'error';
    pageError.value = getApiErrorMessage(error, '当前无法进入创作页，请稍后重试。');
  }
};

const handleCoverUploaded = () => {
  submitError.value = '';
};

const focusCoverTip = () => {
  coverPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const insertContent = (snippet: string) => {
  form.content = `${form.content}${snippet}`;
  nextTick(() => contentInputRef.value?.focus());
};

const wrapContent = (prefix: string, suffix: string) => {
  const value = form.content;
  form.content = value ? `${prefix}${value}${suffix}` : `${prefix}文字${suffix}`;
  nextTick(() => contentInputRef.value?.focus());
};

const handleSubmit = async () => {
  if (!formRef.value || submitting.value) return;

  submitError.value = '';

  const valid = await formRef.value
    .validate()
    .then(() => true)
    .catch(() => false);

  if (!valid) {
    ElMessage.warning('请先完成必填项后再发布。');
    return;
  }

  if (form.contentType <= 0) {
    ElMessage.warning('请选择日记分类后再发布。');
    return;
  }

  if (!form.coverUrl.trim()) {
    ElMessage.warning('请上传日记封面后再发布。');
    focusCoverTip();
    return;
  }

  if (!authStore.token) {
    pageState.value = 'auth';
    openAuthDrawer();
    return;
  }

  submitting.value = true;

  try {
    const res = await createTravelDiary({
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      coverUrl: form.coverUrl.trim() || undefined,
      contentType: form.contentType,
      visibility: form.visibility,
      content: form.content.trim()
    });

    ElMessage.success('旅行日记已发布');
    router.push(`/diaries/${res.data.id}`);
  } catch (error) {
    console.error('Failed to publish diary', error);

    if (!authStore.token) {
      pageState.value = 'auth';
      openAuthDrawer();
      return;
    }

    submitError.value = getApiErrorMessage(error, '发布失败，请稍后重试。');
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
.publish-page {
  width: min(100%, 1400px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
  color: var(--color-text-primary);
}

.publish-hero {
  padding-top: 24px;
}

.hero-copy {
  max-width: 780px;
}

.hero-eyebrow {
  margin: 0 0 12px;
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-display-md);
  line-height: 1.12;
  font-weight: var(--font-weight-display);
  letter-spacing: -0.03em;
}

.hero-description {
  margin: 18px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-title-sm);
  line-height: 1.45;
  font-weight: var(--font-weight-semibold);
}

.compose-layout,
.loading-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 48px;
  align-items: start;
}

.editor-column,
.settings-column {
  min-width: 0;
}

.settings-column {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.glass-panel {
  border-radius: var(--radius-panel);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(12px);
}

.editor-panel {
  padding: 48px;
}

.diary-form :deep(.el-form-item) {
  margin-bottom: 38px;
}

.diary-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.diary-form :deep(.el-form-item__label) {
  margin-bottom: 12px;
  color: var(--color-text-subtle);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.content-item :deep(.el-form-item__content) {
  display: block;
  width: 100%;
}

.title-item {
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
}

.title-item :deep(.el-input__wrapper) {
  padding: 0;
  background: transparent;
  box-shadow: none !important;
}

.title-item :deep(.el-input__inner) {
  height: auto;
  color: var(--color-text-primary);
  font-size: var(--font-size-title-lg);
  line-height: 1.18;
  font-weight: var(--font-weight-bold);
}

.title-item :deep(.el-input__inner::placeholder) {
  color: #cbd5e1;
}

.summary-item :deep(.el-textarea__inner) {
  min-height: 126px !important;
  padding: 22px 24px;
  border-radius: var(--radius-control);
  background: rgba(239, 241, 242, 0.5);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-lg);
  line-height: var(--line-height-relaxed);
  box-shadow: none !important;
}

.content-editor {
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-control);
  background: #ffffff;
  border: 1px solid var(--color-border-soft);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.95);
}

.editor-toolbar button {
  min-width: 28px;
  height: 28px;
  padding: 0 4px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-subtle);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;

  &:hover {
    color: #005bad;
    background: rgba(0, 91, 173, 0.08);
  }
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background: rgba(226, 232, 240, 0.92);
}

.content-item :deep(.el-textarea__inner) {
  width: 100%;
  min-height: 500px !important;
  padding: 28px 30px;
  border-radius: 0;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-body-lg);
  line-height: var(--line-height-relaxed);
  box-shadow: none !important;
}

.content-item :deep(.el-textarea) {
  display: block;
  width: 100%;
}

.summary-item :deep(.el-textarea__inner:focus),
.content-item :deep(.el-textarea__inner:focus) {
  box-shadow: var(--shadow-ring-accent) !important;
}

.compose-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 28px;
}

.submit-button,
.secondary-button {
  min-height: 56px;
  border-radius: var(--radius-chip);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.submit-button {
  min-width: 154px;
  padding: 0 38px;
  border: none;
  background: #005bad;
  color: #ffffff;
  box-shadow: 0 18px 34px rgba(0, 91, 173, 0.2);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #004483;
    box-shadow: 0 22px 40px rgba(0, 91, 173, 0.24);
  }
}

.secondary-button {
  padding: 0 28px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text-secondary);

  &:hover:not(:disabled) {
    background: #ffffff;
    border-color: rgba(0, 91, 173, 0.22);
    color: #005bad;
  }
}

.submit-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.submit-error {
  margin: 14px 0 0;
  color: #b91c1c;
  font-size: var(--font-size-md);
  line-height: 1.7;
}

.cover-panel,
.settings-panel {
  padding: 28px;
}

.panel-head h2,
.settings-panel h2 {
  margin: 0 0 22px;
  color: var(--color-text-primary);
  font-size: var(--font-size-title-sm);
  line-height: 1.25;
  font-weight: var(--font-weight-semibold);
}

.cover-panel :deep(.upload-card) {
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.cover-panel :deep(.preview-shell) {
  aspect-ratio: 4 / 5;
  border-radius: 28px;
  border: 2px dashed rgba(203, 213, 225, 0.95);
}

.cover-panel :deep(.upload-copy) {
  margin-top: 18px;
}

.cover-panel :deep(.upload-copy h3) {
  font-size: var(--font-size-lg);
}

.cover-panel :deep(.upload-description) {
  display: none;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.setting-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-field label,
.setting-label {
  color: var(--color-text-subtle);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.select-shell {
  position: relative;

  select {
    width: 100%;
    min-height: 54px;
    padding: 0 48px 0 18px;
    border: none;
    border-radius: var(--radius-control);
    appearance: none;
    background: rgba(239, 241, 242, 0.52);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
    line-height: 1.5;
    outline: none;
    cursor: pointer;
    transition: box-shadow 0.2s ease, background 0.2s ease;

    &:focus {
      background: #ffffff;
      box-shadow: var(--shadow-ring-accent);
    }

    &:disabled {
      cursor: wait;
      color: var(--color-text-muted);
    }
  }

  .el-icon {
    position: absolute;
    top: 50%;
    right: 18px;
    color: var(--color-text-subtle);
    transform: translateY(-50%);
    pointer-events: none;
  }
}

.setting-error {
  margin: 0;
  color: #b91c1c;
  font-size: var(--font-size-xs);
  line-height: 1.6;

  button {
    padding: 0;
    border: none;
    background: transparent;
    color: #005bad;
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }
}

.visibility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.visibility-option {
  min-height: 86px;
  padding: 16px;
  border-radius: var(--radius-control);
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.22s ease, background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .el-icon {
    color: var(--color-text-subtle);
    font-size: var(--font-size-5xl);
  }

  span {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
  }

  &.active {
    border-color: rgba(0, 91, 173, 0.34);
    background: rgba(94, 162, 255, 0.12);
    color: #005bad;
    box-shadow: 0 12px 24px rgba(0, 91, 173, 0.08);

    .el-icon {
      color: #005bad;
    }
  }
}

.check-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px;
  border-radius: var(--radius-control);
  background: rgba(239, 241, 242, 0.48);
  border: 1px solid transparent;

  .el-icon {
    margin-top: 2px;
    color: var(--color-text-subtle);
    font-size: var(--font-size-4xl);
  }

  span {
    display: block;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
  }

  p {
    margin: 4px 0 0;
    color: var(--color-text-subtle);
    font-size: var(--font-size-xs);
    line-height: 1.5;
  }

  &.done {
    border-color: rgba(0, 91, 173, 0.18);
    background: rgba(94, 162, 255, 0.1);

    .el-icon {
      color: #005bad;
    }
  }
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.loading-hero,
.loading-card {
  border-radius: var(--radius-panel);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 184px;
}

.loading-card {
  min-height: 340px;
}

.loading-card-large {
  min-height: 680px;
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
  .compose-layout,
  .loading-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .settings-column {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
  }
}

@media (max-width: 767px) {
  .publish-page {
    gap: 28px;
  }

  .publish-hero {
    padding-top: 0;
  }

  .hero-copy h1 {
    font-size: var(--font-size-title-lg);
  }

  .hero-description {
    font-size: var(--font-size-lg);
  }

  .editor-panel,
  .cover-panel,
  .settings-panel {
    padding: 22px 18px;
    border-radius: var(--radius-card);
  }

  .title-item :deep(.el-input__inner) {
    font-size: var(--font-size-8xl);
  }

  .content-item :deep(.el-textarea__inner) {
    min-height: 420px !important;
    padding: 22px 18px;
  }

  .editor-toolbar {
    gap: 10px;
    padding: 14px 16px;
  }

  .compose-actions,
  .settings-column {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .submit-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
