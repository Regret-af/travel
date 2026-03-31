<template>
  <div class="publish-page">
    <AuthDrawer v-model="authDrawerOpen" />

    <section v-if="pageState === 'loading'" class="loading-shell" aria-label="发布页加载中">
      <div class="loading-hero" />
      <div class="loading-grid">
        <div class="loading-card loading-card-large" />
        <div class="loading-card" />
      </div>
    </section>

    <DiaryCollectionState
      v-else-if="pageState === 'auth'"
      variant="auth"
      eyebrow="创作空间"
      title="登录后，才能开始写下这段新的旅途"
      description="登录后就能为这段旅途写下标题、封面与正文，让它以完整的样子被慢慢看见。"
      action-label="立即登录"
      secondary-label="返回个人中心"
      secondary-to="/account"
      @action="openAuthDrawer"
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
      <section class="compose-hero" :style="heroBackgroundStyle">
        <div class="hero-copy">
          <p class="hero-eyebrow">发布旅行日记</p>
          <h1>把路上的风景、情绪与细节，写成一篇适合被慢慢翻阅的公开故事。</h1>
          <p class="hero-description">
            从一张封面、一句标题开始，把沿途真正想留下的风景、情绪与片段慢慢写成一篇完整的旅行日记。
          </p>
        </div>

        <div class="hero-note">
          <span class="hero-note-label">创作提醒</span>
          <p>先想好这一篇最想留下什么：一张能定住气氛的封面、一句准确的标题，再加上一段愿意被慢慢读完的正文。</p>
          <RouterLink to="/account/diaries" class="hero-link">先看看我的日记目录</RouterLink>
        </div>
      </section>

      <section class="compose-grid">
        <article class="editor-card">
          <div class="section-head">
            <div>
              <p class="section-eyebrow">创作正文</p>
              <h2>把路上的一切，按自己的节奏写下来</h2>
            </div>
            <span class="draft-chip">公开发布</span>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="diary-form">
            <el-form-item label="日记标题" prop="title">
              <el-input
                v-model="form.title"
                maxlength="80"
                show-word-limit
                placeholder="先给这段旅途起一个有画面感的标题"
              />
            </el-form-item>

            <el-form-item label="摘要" prop="summary">
              <el-input
                v-model="form.summary"
                type="textarea"
                maxlength="180"
                show-word-limit
                :autosize="{ minRows: 3, maxRows: 5 }"
                placeholder="用两三句话，为读者留下一段进入正文前的呼吸感"
              />
            </el-form-item>

            <el-form-item label="正文" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                maxlength="10000"
                show-word-limit
                :autosize="{ minRows: 14, maxRows: 20 }"
                placeholder="从出发、遇见的人、天气、味道，或者某个突然击中你的瞬间开始写。"
              />
            </el-form-item>

            <div class="form-footer">
              <p v-if="submitError" class="submit-error">{{ submitError }}</p>
              <div class="form-actions">
                <button class="submit-button" type="button" :disabled="submitting" @click="handleSubmit">
                  {{ submitting ? '发布中...' : '立即发布' }}
                </button>
                <button class="secondary-button" type="button" :disabled="submitting" @click="goToMyDiaries">
                  返回我的日记
                </button>
              </div>
            </div>
          </el-form>
        </article>

        <div class="side-column">
          <ImageUploadCard
            v-model="form.coverUrl"
            biz-type="diary_image"
            title="给这篇日记留一张封面"
            description="封面会出现在日记列表和详情页顶部，让整篇故事先以画面开场。"
            button-text="上传封面"
            placeholder-title="选择一张封面图"
            placeholder-description="推荐上传横向图片，以获得更好的封面观感"
            tip="上传成功后会自动用于这篇日记的封面展示"
            @uploaded="handleCoverUploaded"
          />

          <article class="preview-card">
            <p class="section-eyebrow">即时预览</p>
            <div class="preview-visual">
              <img v-if="form.coverUrl" :src="form.coverUrl" :alt="previewTitle" class="preview-image" />
              <div v-else class="preview-fallback" />
              <div class="preview-overlay" />
            </div>
            <div class="preview-copy">
              <h3>{{ previewTitle }}</h3>
              <p>{{ previewSummary }}</p>
            </div>
          </article>

          <article class="tips-card">
            <p class="section-eyebrow">发布前确认</p>
            <h3>在按下发布前，再看一眼这篇故事</h3>
            <ul class="tips-list">
              <li>标题和正文需要完整填写，故事才能顺利发布。</li>
              <li>摘要和封面都可以留空，但补上它们会让读者更快进入这段旅途。</li>
              <li>封面会先上传并立即预览，确认无误后再正式发布整篇日记。</li>
            </ul>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import ImageUploadCard from '@/components/user/ImageUploadCard.vue';
import { createTravelDiary } from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';

type PageState = 'loading' | 'auth' | 'ready' | 'error';

const router = useRouter();
const authStore = useAuthStore();

const authDrawerOpen = ref(false);
const formRef = ref<FormInstance>();
const pageState = ref<PageState>('loading');
const pageError = ref('当前无法进入发布页面，请稍后重试。');
const submitting = ref(false);
const submitError = ref('');
const form = reactive({
  title: '',
  summary: '',
  coverUrl: '',
  content: ''
});

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
  ]
};

const previewTitle = computed(() => form.title.trim() || '这篇新旅途，正在等一个标题');
const previewSummary = computed(
  () => form.summary.trim() || '摘要会出现在这里，让读者先听见这段旅途的第一口呼吸。'
);
const heroBackgroundStyle = computed(() => ({
  backgroundImage: form.coverUrl
    ? `linear-gradient(110deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.88) 46%, rgba(255, 255, 255, 0.52) 100%), url(${form.coverUrl})`
    : 'radial-gradient(circle at 18% 18%, rgba(34, 211, 238, 0.16), transparent 22%), radial-gradient(circle at 84% 18%, rgba(212, 175, 55, 0.16), transparent 20%), linear-gradient(135deg, #f8fafc 0%, #ffffff 64%, #f7fbff 100%)'
}));

const openAuthDrawer = () => {
  authDrawerOpen.value = true;
};

const goToMyDiaries = () => {
  router.push('/account/diaries');
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
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.compose-hero,
.editor-card,
.preview-card,
.tips-card,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.compose-hero {
  position: relative;
  min-height: 340px;
  padding: 44px;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 24px;
  align-items: end;
  background-position: center;
  background-size: cover;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.08);
}

.hero-copy,
.hero-note {
  position: relative;
  z-index: 1;
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
  max-width: 640px;
  color: #475569;
  font-size: var(--font-size-base);
  line-height: 1.86;
}

.hero-note {
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);

  p {
    margin: 10px 0 0;
    color: #475569;
    font-size: var(--font-size-md);
    line-height: 1.75;
  }
}

.hero-note-label {
  color: #64748b;
  font-size: var(--font-size-xs);
  letter-spacing: 0.04em;
}

.hero-link {
  display: inline-flex;
  margin-top: 16px;
  color: #9a7313;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.compose-grid,
.loading-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
  gap: 24px;
}

.editor-card,
.preview-card,
.tips-card {
  padding: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-8xl);
    line-height: 1.14;
    font-weight: var(--font-weight-title);
  }
}

.draft-chip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.24);
  color: #9a7313;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.diary-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.diary-form :deep(.el-form-item__label) {
  color: #334155;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.diary-form :deep(.el-input__wrapper),
.diary-form :deep(.el-textarea__inner) {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.95) inset !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.diary-form :deep(.el-input__wrapper.is-focus),
.diary-form :deep(.el-textarea__inner:focus) {
  transform: translateY(-1px);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.26) inset !important;
}

.diary-form :deep(.el-textarea__inner) {
  min-height: 180px !important;
  padding: 16px 18px;
}

.form-footer {
  padding-top: 10px;
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
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
}

.submit-button {
  border: 1px solid rgba(212, 175, 55, 0.24);
  background: #111827;
  color: #f8fafc;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.48);
    background: #9a7313;
    color: #111827;
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  }
}

.secondary-button {
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
}

.submit-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.submit-error {
  margin: 0 0 14px;
  color: #b91c1c;
  font-size: var(--font-size-md);
  line-height: 1.7;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-visual {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, #dbeafe 0%, #f8fafc 48%, #eef2ff 100%);
}

.preview-image,
.preview-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-fallback {
  background:
    radial-gradient(circle at 24% 22%, rgba(255, 255, 255, 0.82), transparent 18%),
    linear-gradient(140deg, rgba(34, 211, 238, 0.24) 0%, rgba(212, 175, 55, 0.2) 46%, rgba(15, 23, 42, 0.12) 100%);
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.03) 0%, rgba(15, 23, 42, 0.18) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0) 34%, rgba(255, 255, 255, 0.16) 100%);
}

.preview-copy h3,
.tips-card h3 {
  margin: 18px 0 0;
  color: #111827;
  font-size: var(--font-size-5xl);
  line-height: 1.18;
  font-weight: var(--font-weight-title);
}

.preview-copy p,
.tips-list {
  margin: 12px 0 0;
  color: #64748b;
  font-size: var(--font-size-md);
  line-height: 1.8;
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
  min-height: 300px;
}

.loading-card {
  min-height: 320px;
}

.loading-card-large {
  min-height: 620px;
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
  .compose-hero,
  .compose-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .publish-page {
    gap: 22px;
  }

  .compose-hero,
  .editor-card,
  .preview-card,
  .tips-card,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .compose-hero,
  .editor-card,
  .preview-card,
  .tips-card {
    padding: 24px 18px;
  }

  .hero-copy h1,
  .section-head h2 {
    font-size: var(--font-size-10xl);
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
