<template>
  <div class="diary-detail-page">
    <div v-if="detailStatus === 'loading'" class="detail-loading">
      <section class="loading-hero" />
      <section class="loading-copy-shell">
        <span class="loading-chip" />
        <span class="loading-line short" />
        <span class="loading-line long" />
        <span class="loading-line medium" />
      </section>
      <section class="loading-article">
        <span v-for="line in 8" :key="line" class="loading-line" :class="{ short: line % 3 === 0 }" />
      </section>
    </div>

    <DiaryCollectionState
      v-else-if="detailStatus === 'error'"
      variant="error"
      eyebrow="阅读受阻"
      title="这篇旅行故事暂时无法展开"
      :description="detailError"
      action-label="重新加载"
      secondary-label="返回日记列表"
      secondary-to="/diaries"
      @action="fetchDetail"
    />

    <DiaryCollectionState
      v-else-if="detailStatus === 'empty'"
      variant="empty"
      eyebrow="内容留白"
      title="这篇旅行故事暂时还没有准备好"
      description="当前内容尚未准备完整，暂时无法形成完整的阅读页。"
      action-label="返回日记列表"
      secondary-label="返回首页"
      secondary-to="/"
      @action="goBackToList"
    />

    <template v-else>
      <RouterLink to="/diaries" class="back-link back-link-top">
        <el-icon><ArrowLeft /></el-icon>
        返回日记列表
      </RouterLink>

      <section class="hero-shell">
        <div class="hero-cover">
          <img v-if="detail.coverUrl" :src="detail.coverUrl" :alt="detail.title" />
          <div v-else class="hero-fallback" />
          <div class="hero-overlay" />
          <div class="hero-note">旅行故事</div>
        </div>
      </section>

      <section class="title-shell">
        <p class="section-eyebrow">沉浸阅读</p>
        <h1>{{ detail.title }}</h1>
        <p v-if="detail.summary" class="summary-copy">{{ detail.summary }}</p>
      </section>

      <section class="meta-shell">
        <div class="author-card">
          <el-avatar :size="54" :src="detail.author?.avatarUrl" />
          <div class="author-copy">
            <p class="author-name">{{ detail.author?.nickname || '旅行者' }}</p>
            <span class="author-note">记录沿途的人与风景</span>
          </div>
        </div>

        <div v-if="formattedPublishedAt" class="publish-card">
          <span class="publish-label">发布时间</span>
          <strong>{{ formattedPublishedAt }}</strong>
        </div>
      </section>

      <section class="article-shell">
        <DiaryRichContent :content="detail.content" />
      </section>

      <DiaryInteractionPanel
        :detail="detail"
        :like-pending="likePending"
        :favorite-pending="favoritePending"
        @toggle-like="handleToggleLike"
        @toggle-favorite="handleToggleFavorite"
        @focus-comment="scrollToComments"
      />

      <div ref="commentsAnchorRef">
        <DiaryCommentSection
          v-model="commentDraft"
          :comments="commentsPage.list"
          :total-count="detail.commentCount ?? commentsPage.total"
          :status="commentsStatus"
          :submitting="commentSubmitting"
          :is-logged-in="isLoggedIn"
          :error-message="commentsError"
          @submit="handleSubmitComment"
          @retry="fetchComments"
          @require-auth="openAuthDrawer"
        />
      </div>

      <section class="return-shell">
        <p class="section-eyebrow">继续翻阅</p>
        <h2>这段旅程读到这里，故事目录仍在前方延伸</h2>
        <RouterLink to="/diaries" class="back-link back-link-bottom">
          <el-icon><ArrowLeft /></el-icon>
          返回日记列表
        </RouterLink>
      </section>
    </template>

    <AuthDrawer v-model="authDrawerOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryCommentSection from '@/components/diaries/DiaryCommentSection.vue';
import DiaryInteractionPanel from '@/components/diaries/DiaryInteractionPanel.vue';
import DiaryRichContent from '@/components/diaries/DiaryRichContent.vue';
import {
  createTravelDiaryComment,
  favoriteTravelDiary,
  getTravelDiaryComments,
  getTravelDiaryDetail,
  likeTravelDiary,
  unfavoriteTravelDiary,
  unlikeTravelDiary,
  type DiaryDetail,
  type PageDiaryComment
} from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';
import { formatDateTime } from '@/utils/formatters';

type DetailStatus = 'loading' | 'success' | 'empty' | 'error';
type CommentsStatus = 'idle' | 'loading' | 'success' | 'error';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const commentsAnchorRef = ref<HTMLElement | null>(null);
const authDrawerOpen = ref(false);

const detail = ref<DiaryDetail>({
  id: '',
  title: '',
  summary: '',
  coverUrl: '',
  content: '',
  author: undefined,
  viewCount: 0,
  likeCount: 0,
  favoriteCount: 0,
  commentCount: 0,
  liked: false,
  favorited: false,
  publishedAt: ''
});
const commentsPage = ref<PageDiaryComment>({
  list: [],
  pageNum: 1,
  pageSize: 12,
  total: 0,
  pages: 0
});
const detailStatus = ref<DetailStatus>('loading');
const commentsStatus = ref<CommentsStatus>('idle');
const detailError = ref('当前无法加载这篇旅行日记，请稍后再试。');
const commentsError = ref('评论区暂时不可用，请稍后重试。');
const commentDraft = ref('');
const likePending = ref(false);
const favoritePending = ref(false);
const commentSubmitting = ref(false);
let detailFetchSequence = 0;
let commentsFetchSequence = 0;

const diaryId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw.trim() : '';
});
const isLoggedIn = computed(() => Boolean(authStore.token));
const formattedPublishedAt = computed(() => formatDateTime(detail.value.publishedAt));

const goBackToList = () => {
  router.push('/diaries');
};

const openAuthDrawer = () => {
  authDrawerOpen.value = true;
};

const ensureLoggedIn = () => {
  if (isLoggedIn.value) return true;

  ElMessage.warning('请先登录后再参与互动');
  openAuthDrawer();
  return false;
};

const scrollToComments = () => {
  nextTick(() => {
    commentsAnchorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const applyDetailResponse = (data: DiaryDetail) => {
  detail.value = {
    ...detail.value,
    ...data,
    liked: Boolean(data.liked),
    favorited: Boolean(data.favorited)
  };
};

const resetInteractionStateForAnonymous = () => {
  detail.value = {
    ...detail.value,
    liked: false,
    favorited: false
  };
};

const fetchComments = async () => {
  if (!diaryId.value) return;

  const requestId = ++commentsFetchSequence;
  commentsStatus.value = 'loading';
  commentsError.value = '评论区暂时不可用，请稍后重试。';

  try {
    const res = await getTravelDiaryComments(diaryId.value, {
      pageNum: 1,
      pageSize: 12
    });

    if (requestId !== commentsFetchSequence) return;

    commentsPage.value = res.data;
    commentsStatus.value = 'success';
  } catch (error) {
    if (requestId !== commentsFetchSequence) return;

    console.error('Failed to load diary comments', error);
    commentsPage.value = {
      list: [],
      pageNum: 1,
      pageSize: 12,
      total: 0,
      pages: 0
    };
    commentsStatus.value = 'error';
    commentsError.value = getApiErrorMessage(error, '评论加载失败，你可以稍后重新尝试。');
  }
};

const fetchDetail = async () => {
  if (!diaryId.value) {
    detailStatus.value = 'error';
    detailError.value = '当前日记标识无效，无法打开这篇旅行故事。';
    return;
  }

  const requestId = ++detailFetchSequence;
  detailStatus.value = 'loading';
  commentsStatus.value = 'idle';
  detailError.value = '当前无法加载这篇旅行日记，请稍后再试。';
  detail.value = {
    id: diaryId.value,
    title: '',
    summary: '',
    coverUrl: '',
    content: '',
    author: undefined,
    viewCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    liked: false,
    favorited: false,
    publishedAt: ''
  };
  commentsPage.value = {
    list: [],
    pageNum: 1,
    pageSize: 12,
    total: 0,
    pages: 0
  };

  try {
    const res = await getTravelDiaryDetail(diaryId.value);

    if (requestId !== detailFetchSequence) return;

    applyDetailResponse(res.data);

    const hasCoreContent = Boolean(detail.value.title.trim() && detail.value.content?.trim());
    detailStatus.value = hasCoreContent ? 'success' : 'empty';

    if (detailStatus.value === 'success') {
      fetchComments();
    }
  } catch (error) {
    if (requestId !== detailFetchSequence) return;

    console.error('Failed to load diary detail', error);
    detailStatus.value = 'error';
    detailError.value = getApiErrorMessage(error, '当前旅程内容加载受阻，请稍后重新打开。');
  }
};

const handleToggleLike = async () => {
  if (!ensureLoggedIn() || !diaryId.value || likePending.value) return;

  likePending.value = true;

  try {
    const res = detail.value.liked ? await unlikeTravelDiary(diaryId.value) : await likeTravelDiary(diaryId.value);
    detail.value.liked = res.data.liked;
    detail.value.likeCount = res.data.likeCount;
  } catch (error) {
    console.error('Failed to toggle like', error);

    if (!authStore.token) {
      openAuthDrawer();
    }
  } finally {
    likePending.value = false;
  }
};

const handleToggleFavorite = async () => {
  if (!ensureLoggedIn() || !diaryId.value || favoritePending.value) return;

  favoritePending.value = true;

  try {
    const res = detail.value.favorited
      ? await unfavoriteTravelDiary(diaryId.value)
      : await favoriteTravelDiary(diaryId.value);
    detail.value.favorited = res.data.favorited;
    detail.value.favoriteCount = res.data.favoriteCount;
  } catch (error) {
    console.error('Failed to toggle favorite', error);

    if (!authStore.token) {
      openAuthDrawer();
    }
  } finally {
    favoritePending.value = false;
  }
};

const handleSubmitComment = async () => {
  if (!ensureLoggedIn() || !diaryId.value || commentSubmitting.value) return;

  const content = commentDraft.value.trim();

  if (!content) {
    ElMessage.warning('请输入评论内容');
    return;
  }

  commentSubmitting.value = true;

  try {
    const res = await createTravelDiaryComment(diaryId.value, { content });
    commentDraft.value = '';
    const nextList = [res.data, ...commentsPage.value.list];
    commentsPage.value = {
      ...commentsPage.value,
      list: nextList.slice(0, commentsPage.value.pageSize || 12),
      total: commentsPage.value.total + 1
    };
    detail.value.commentCount = (detail.value.commentCount ?? 0) + 1;
    commentsStatus.value = 'success';
    ElMessage.success('评论已发布');
    scrollToComments();
  } catch (error) {
    console.error('Failed to create comment', error);

    if (!authStore.token) {
      openAuthDrawer();
    }
  } finally {
    commentSubmitting.value = false;
  }
};

watch(
  () => route.fullPath,
  () => {
    fetchDetail();
  },
  { immediate: true }
);

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token && token !== previousToken && detailStatus.value === 'success' && diaryId.value) {
      const currentDiaryId = diaryId.value;

      getTravelDiaryDetail(currentDiaryId)
        .then((res) => {
          if (diaryId.value !== currentDiaryId || detailStatus.value !== 'success') {
            return;
          }

          applyDetailResponse(res.data);
        })
        .catch((error) => {
          console.error('Failed to refresh diary detail after login', error);
        });

      return;
    }

    if (!token && previousToken && detailStatus.value === 'success' && diaryId.value) {
      const currentDiaryId = diaryId.value;

      resetInteractionStateForAnonymous();

      getTravelDiaryDetail(currentDiaryId, { skipErrorToast: true })
        .then((res) => {
          if (diaryId.value !== currentDiaryId || detailStatus.value !== 'success' || authStore.token) {
            return;
          }

          applyDetailResponse(res.data);
        })
        .catch((error) => {
          console.error('Failed to refresh diary detail after auth cleared', error);
        });
    }
  }
);
</script>

<style scoped lang="scss">
.diary-detail-page {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  color: #0f172a;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-copy-shell,
.loading-article {
  border-radius: 32px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 54vh;
}

.loading-copy-shell {
  padding: 34px;
}

.loading-article {
  min-height: 520px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.loading-chip,
.loading-line {
  display: block;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
}

.loading-chip {
  width: 118px;
  height: 14px;
}

.loading-line {
  height: 16px;
}

.loading-line.short {
  width: 38%;
}

.loading-line.medium {
  width: 72%;
}

.loading-line.long {
  width: 88%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.86);
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  text-decoration: none;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(212, 175, 55, 0.42);
    color: #9a7313;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
  }
}

.back-link-top {
  margin-top: 6px;
}

.hero-shell {
  position: relative;
}

.hero-cover {
  position: relative;
  min-height: 60vh;
  overflow: hidden;
  border-radius: 40px;
  box-shadow: 0 26px 72px rgba(15, 23, 42, 0.12);

  img,
  .hero-fallback {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-fallback {
  background:
    radial-gradient(circle at 22% 20%, rgba(255, 255, 255, 0.86), transparent 18%),
    linear-gradient(145deg, rgba(34, 211, 238, 0.2) 0%, rgba(212, 175, 55, 0.16) 48%, rgba(15, 23, 42, 0.18) 100%);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.22) 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.16) 100%);
}

.hero-note {
  position: absolute;
  left: 26px;
  bottom: 24px;
  z-index: 1;
  color: #f8fafc;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.title-shell,
.meta-shell,
.article-shell,
.return-shell {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.84);
  box-shadow: 0 22px 58px rgba(15, 23, 42, 0.06);
}

.title-shell {
  padding: 40px 42px;
  border-radius: 34px;

  h1 {
    margin: 0;
    max-width: 900px;
    color: #111827;
    font-size: var(--font-size-19xl);
    line-height: 1.02;
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.035em;
  }
}

.section-eyebrow {
  margin: 0 0 12px;
  color: #c79b1d;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.summary-copy {
  margin: 22px 0 0;
  max-width: 760px;
  color: #475569;
  font-size: var(--font-size-2xl);
  line-height: 1.9;
}

.meta-shell {
  padding: 26px 28px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.author-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.author-name {
  margin: 0;
  color: #111827;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.author-note,
.publish-label {
  color: #64748b;
  font-size: var(--font-size-sm);
}

.publish-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;

  strong {
    color: #111827;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
  }
}

.article-shell {
  padding: 54px min(10vw, 120px);
  border-radius: 36px;
}

.article-shell :deep(.rich-content) {
  max-width: 780px;
  margin: 0 auto;
}

.return-shell {
  padding: 32px 30px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  h2 {
    margin: 0;
    max-width: 620px;
    color: #111827;
    font-size: var(--font-size-8xl);
    line-height: 1.16;
    font-weight: var(--font-weight-title);
  }
}

@media (max-width: 1024px) {
  .title-shell h1 {
    font-size: var(--font-size-15xl);
  }

  .article-shell {
    padding: 40px 36px;
  }

  .meta-shell,
  .return-shell {
    flex-direction: column;
    align-items: flex-start;
  }

  .publish-card {
    align-items: flex-start;
  }
}

@media (max-width: 767px) {
  .diary-detail-page {
    gap: 22px;
  }

  .loading-hero,
  .loading-copy-shell,
  .loading-article,
  .hero-cover,
  .title-shell,
  .meta-shell,
  .article-shell,
  .return-shell {
    border-radius: 24px;
  }

  .loading-hero {
    min-height: 38vh;
  }

  .hero-cover {
    min-height: 34vh;
  }

  .title-shell {
    padding: 26px 18px;

    h1 {
      font-size: var(--font-size-10xl);
      line-height: 1.08;
    }
  }

  .summary-copy {
    font-size: var(--font-size-lg);
  }

  .meta-shell,
  .return-shell {
    padding: 22px 18px;
  }

  .article-shell {
    padding: 28px 18px;
  }

  .return-shell h2 {
    font-size: var(--font-size-6xl);
  }
}
</style>
