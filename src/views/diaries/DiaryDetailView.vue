<template>
  <div class="diary-detail-page">
    <div v-if="detailStatus === 'loading'" class="detail-loading">
      <section class="loading-hero" />
      <section class="loading-panel">
        <span class="loading-chip" />
        <span class="loading-line short" />
        <span class="loading-line long" />
        <span class="loading-line medium" />
      </section>
      <section class="loading-panel loading-panel-article">
        <span v-for="line in 8" :key="line" class="loading-line" :class="{ short: line % 3 === 0 }" />
      </section>
    </div>

    <DiaryCollectionState
      v-else-if="detailStatus === 'error'"
      variant="error"
      eyebrow="阅读受阻"
      title="这篇旅行日记暂时无法展开"
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
      description="这篇日记还没有可继续阅读的完整内容，你可以先回到列表查看其他旅行记录。"
      action-label="返回日记列表"
      secondary-label="返回首页"
      secondary-to="/"
      @action="goBackToList"
    />

    <template v-else>
      <aside class="floating-actions floating-actions-desktop" aria-label="日记互动">
        <button
          class="floating-action"
          :class="{ active: detail.liked }"
          :disabled="likePending"
          @click="handleToggleLike"
        >
          <span class="floating-action-icon">
            <span class="material-symbols-outlined">favorite</span>
          </span>
          <span class="floating-action-value">{{ formatCount(detail.likeCount) }}</span>
        </button>

        <button class="floating-action" @click="scrollToComments">
          <span class="floating-action-icon">
            <span class="material-symbols-outlined">chat_bubble</span>
          </span>
          <span class="floating-action-value">{{ formatCount(detail.commentCount) }}</span>
        </button>

        <button
          class="floating-action"
          :class="{ active: detail.favorited }"
          :disabled="favoritePending"
          @click="handleToggleFavorite"
        >
          <span class="floating-action-icon">
            <span class="material-symbols-outlined">bookmark</span>
          </span>
          <span class="floating-action-value">{{ formatCount(detail.favoriteCount) }}</span>
        </button>
      </aside>

      <section class="hero-stage">
        <div class="hero-media">
          <img v-if="detail.coverUrl" :src="detail.coverUrl" :alt="detail.title" />
          <div v-else class="hero-fallback" />
        </div>
        <div class="hero-overlay" />

        <div class="hero-shell">
          <div class="hero-topbar">
            <RouterLink to="/diaries" class="hero-back">
              <span class="material-symbols-outlined">arrow_back</span>
              返回日记列表
            </RouterLink>
          </div>

          <div class="hero-content">
            <div class="hero-copy">
              <div class="hero-pill-row">
                <span class="hero-pill hero-pill-solid">
                  {{ contentTypeLabel || '旅行日记' }}
                </span>
              </div>

              <h1 class="headline-text">{{ detail.title }}</h1>
              <p v-if="detail.summary" class="hero-summary">{{ detail.summary }}</p>

              <div class="hero-author-row">
                <div class="hero-author">
                  <el-avatar :size="46" :src="detail.author?.avatarUrl">
                    {{ authorInitial }}
                  </el-avatar>
                  <div class="hero-author-copy">
                    <p class="hero-author-name">{{ authorDisplayName }}</p>
                    <p v-if="formattedPublishedAt" class="hero-author-note">发布于 {{ formattedPublishedAt }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <article class="story-shell">
        <div v-if="detail.summary" class="story-intro">
          <p>{{ detail.summary }}</p>
        </div>

        <DiaryRichContent :content="detail.content" />

        <div class="story-divider" />

        <section class="author-feature">
          <div class="author-feature-main">
            <el-avatar :size="84" :src="detail.author?.avatarUrl" class="author-feature-avatar">
              {{ authorInitial }}
            </el-avatar>

            <div class="author-feature-copy">
              <div class="author-feature-header">
                <h2 class="headline-text">{{ authorDisplayName }}</h2>
              </div>

              <p class="author-feature-bio">
                {{ authorBio || '正在探索世界的某个角落，暂未更新简介。' }}
              </p>
            </div>
          </div>

          <button
            v-if="authorMoreList.length"
            type="button"
            class="author-feature-action"
            @click="scrollToMoreSection"
          >
            查看更多创作
          </button>
        </section>
      </article>

      <div ref="commentsAnchorRef" class="comments-shell">
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

      <section v-if="showAuthorMoreSection" ref="authorMoreAnchorRef" class="more-section">
        <div class="more-section-heading">
          <p class="section-eyebrow">更多创作</p>
          <h2 class="headline-text">{{ authorDisplayName }} 的更多日记</h2>
        </div>

        <div v-if="authorMoreStatus === 'loading'" class="more-skeleton-list">
          <article v-for="item in 2" :key="item" class="more-skeleton-card" />
        </div>

        <div v-else class="more-list">
          <DiaryShelfCard
            v-for="item in authorMoreList"
            :key="item.id"
            :item="item"
            :to="`/diaries/${item.id}`"
            note="继续阅读这位作者的其他记录"
          />
        </div>
      </section>

      <div class="floating-actions floating-actions-mobile" aria-label="日记互动">
        <button
          class="floating-action"
          :class="{ active: detail.liked }"
          :disabled="likePending"
          @click="handleToggleLike"
        >
          <span class="floating-action-icon">
            <span class="material-symbols-outlined">favorite</span>
          </span>
          <span class="floating-action-value">{{ formatCount(detail.likeCount) }}</span>
        </button>

        <button class="floating-action" @click="scrollToComments">
          <span class="floating-action-icon">
            <span class="material-symbols-outlined">chat_bubble</span>
          </span>
          <span class="floating-action-value">{{ formatCount(detail.commentCount) }}</span>
        </button>

        <button
          class="floating-action"
          :class="{ active: detail.favorited }"
          :disabled="favoritePending"
          @click="handleToggleFavorite"
        >
          <span class="floating-action-icon">
            <span class="material-symbols-outlined">bookmark</span>
          </span>
          <span class="floating-action-value">{{ formatCount(detail.favoriteCount) }}</span>
        </button>
      </div>
    </template>

    <AuthDrawer v-model="authDrawerOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';
import DiaryCollectionState from '@/components/diaries/DiaryCollectionState.vue';
import DiaryCommentSection from '@/components/diaries/DiaryCommentSection.vue';
import DiaryRichContent from '@/components/diaries/DiaryRichContent.vue';
import DiaryShelfCard from '@/components/diaries/DiaryShelfCard.vue';
import {
  createTravelDiaryComment,
  favoriteTravelDiary,
  getMoreTravelDiariesFromAuthor,
  getTravelDiaryComments,
  getTravelDiaryDetail,
  likeTravelDiary,
  unfavoriteTravelDiary,
  unlikeTravelDiary,
  type DiaryCard,
  type DiaryDetail,
  type PageDiaryComment
} from '@/api/diaries';
import { useAuthStore } from '@/stores/auth';
import { getApiErrorMessage } from '@/types/api';
import { formatCountStat, formatDateTime } from '@/utils/formatters';

type DetailStatus = 'loading' | 'success' | 'empty' | 'error';
type CommentsStatus = 'idle' | 'loading' | 'success' | 'error';
type AuthorMoreStatus = 'idle' | 'loading' | 'success' | 'error';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const commentsAnchorRef = ref<HTMLElement | null>(null);
const authorMoreAnchorRef = ref<HTMLElement | null>(null);
const authDrawerOpen = ref(false);

const detail = ref<DiaryDetail>({
  id: '',
  title: '',
  summary: '',
  coverUrl: '',
  content: '',
  contentType: '',
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
const authorMoreList = ref<DiaryCard[]>([]);
const detailStatus = ref<DetailStatus>('loading');
const commentsStatus = ref<CommentsStatus>('idle');
const authorMoreStatus = ref<AuthorMoreStatus>('idle');
const detailError = ref('当前无法加载这篇旅行日记，请稍后再试。');
const commentsError = ref('评论区暂时不可用，请稍后重试。');
const commentDraft = ref('');
const likePending = ref(false);
const favoritePending = ref(false);
const commentSubmitting = ref(false);
let detailFetchSequence = 0;
let commentsFetchSequence = 0;
let authorMoreFetchSequence = 0;

const diaryId = computed(() => {
  const raw = route.params.id;
  return typeof raw === 'string' ? raw.trim() : '';
});
const isLoggedIn = computed(() => Boolean(authStore.token));
const formattedPublishedAt = computed(() => formatDateTime(detail.value.publishedAt));
const authorDisplayName = computed(() => detail.value.author?.nickname?.trim() || '旅行者');
const authorInitial = computed(() => authorDisplayName.value.slice(0, 1).toUpperCase());
const authorBio = computed(() => detail.value.author?.bio?.trim() || '');
const contentTypeLabel = computed(() => detail.value.contentType?.trim() || '');
const showAuthorMoreSection = computed(
  () => authorMoreStatus.value === 'loading' || authorMoreList.value.length > 0
);

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

const formatCount = (value?: number) => formatCountStat(value);

const scrollToElement = (element: HTMLElement | null, offset = 108) => {
  if (!element) return;

  window.scrollTo({
    top: Math.max(window.scrollY + element.getBoundingClientRect().top - offset, 0),
    behavior: 'smooth'
  });
};

const scrollToComments = () => {
  nextTick(() => {
    scrollToElement(commentsAnchorRef.value, 104);
  });
};

const scrollToMoreSection = () => {
  nextTick(() => {
    scrollToElement(authorMoreAnchorRef.value, 104);
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

const fetchAuthorMore = async () => {
  const currentDiaryId = detail.value.id?.trim() || diaryId.value;

  if (!currentDiaryId) {
    authorMoreStatus.value = 'idle';
    authorMoreList.value = [];
    return;
  }

  const requestId = ++authorMoreFetchSequence;
  authorMoreStatus.value = 'loading';

  try {
    const res = await getMoreTravelDiariesFromAuthor(
      currentDiaryId,
      {
        pageNum: 1,
        pageSize: 4,
        sort: 'latest'
      },
      { skipErrorToast: true }
    );

    if (requestId !== authorMoreFetchSequence) return;

    authorMoreList.value = (res.data.list || [])
      .filter((item) => item.id !== detail.value.id)
      .slice(0, 2);
    authorMoreStatus.value = 'success';
  } catch (error) {
    if (requestId !== authorMoreFetchSequence) return;

    console.error('Failed to load more diaries by author', error);
    authorMoreList.value = [];
    authorMoreStatus.value = 'error';
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
  authorMoreStatus.value = 'idle';
  detailError.value = '当前无法加载这篇旅行日记，请稍后再试。';
  detail.value = {
    id: diaryId.value,
    title: '',
    summary: '',
    coverUrl: '',
    content: '',
    contentType: '',
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
  authorMoreList.value = [];

  try {
    const res = await getTravelDiaryDetail(diaryId.value);

    if (requestId !== detailFetchSequence) return;

    applyDetailResponse(res.data);

    const hasCoreContent = Boolean(detail.value.title.trim() && detail.value.content?.trim());
    detailStatus.value = hasCoreContent ? 'success' : 'empty';

    if (detailStatus.value === 'success') {
      fetchComments();
      fetchAuthorMore();
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
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.headline-text {
  font-family: 'Plus Jakarta Sans', var(--font-family-sans);
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

.diary-detail-page {
  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  color: #2c2f30;
  padding-bottom: 104px;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero,
.loading-panel {
  border-radius: 32px;
  background: linear-gradient(90deg, rgba(230, 232, 234, 0.88), rgba(239, 241, 242, 1), rgba(230, 232, 234, 0.88));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loading-hero {
  min-height: 620px;
}

.loading-panel {
  padding: 32px;
}

.loading-panel-article {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.loading-chip,
.loading-line {
  display: block;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
}

.loading-chip {
  width: 124px;
  height: 14px;
}

.loading-line {
  height: 16px;
}

.loading-line.short {
  width: 38%;
}

.loading-line.medium {
  width: 68%;
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

.hero-stage {
  position: relative;
  min-height: 600px;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(44, 47, 48, 0.12);
}

.hero-media,
.hero-overlay {
  position: absolute;
  inset: 0;
}

.hero-media {
  img,
  .hero-fallback {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-fallback {
  background:
    radial-gradient(circle at 16% 18%, rgba(94, 162, 255, 0.28), transparent 22%),
    radial-gradient(circle at 82% 14%, rgba(255, 202, 77, 0.26), transparent 18%),
    linear-gradient(135deg, #eef4fb 0%, #f7f9fb 58%, #eef2f6 100%);
}

.hero-overlay {
  background: linear-gradient(180deg, rgba(13, 21, 31, 0.06) 0%, rgba(13, 21, 31, 0.16) 36%, rgba(13, 21, 31, 0.68) 100%);
}

.hero-shell {
  position: relative;
  z-index: 1;
  min-height: 600px;
  padding: 26px 32px 34px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
}

.hero-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.hero-back,
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.hero-back {
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.18);
  color: #eef2ff;
  text-decoration: none;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.24);
    border-color: rgba(255, 255, 255, 0.36);
  }
}

.hero-pill {
  color: rgba(238, 242, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.hero-pill-solid {
  color: #002c59;
  background: rgba(255, 255, 255, 0.88);
}

.hero-content {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 24px;
}

.hero-copy {
  max-width: 100%;
}

.hero-copy h1 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(38px, 5.8vw, 66px);
  line-height: 1.02;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.hero-summary {
  max-width: 820px;
  margin: 14px 0 0;
  color: rgba(238, 242, 255, 0.9);
  font-size: var(--font-size-base);
  line-height: 1.8;
}

.hero-author-row {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 18px;
}

.hero-author {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-author-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-author-name {
  margin: 0;
  color: #ffffff;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.hero-author-note {
  margin: 0;
  color: rgba(238, 242, 255, 0.8);
  font-size: var(--font-size-sm);
}

.story-shell,
.more-section {
  margin-top: 28px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 36px rgba(44, 47, 48, 0.06);
}

.story-shell {
  padding: 38px 42px 46px;
}

.story-shell :deep(.rich-content) {
  max-width: none;
  margin: 0;
  color: #595c5d;
  font-size: var(--font-size-xl);
  line-height: 1.95;
}

.story-shell :deep(h2),
.story-shell :deep(h3),
.story-shell :deep(h4) {
  font-family: 'Plus Jakarta Sans', var(--font-family-sans);
}

.story-divider {
  height: 1px;
  margin: 36px 0 28px;
  background: rgba(224, 227, 228, 0.92);
}

.story-intro {
  max-width: none;
  margin: 0 0 30px;
  padding: 18px 20px;
  border-left: 4px solid #005bad;
  border-radius: 0 24px 24px 0;
  background: linear-gradient(90deg, rgba(0, 91, 173, 0.08), rgba(0, 91, 173, 0));

  p {
    margin: 0;
    color: #4b5563;
    font-size: var(--font-size-xl);
    font-style: italic;
    line-height: 1.9;
  }
}

.author-feature {
  margin-top: 0;
  padding: 26px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-radius: 24px;
  background: #eff1f2;
}

.author-feature-main {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.author-feature-avatar {
  flex-shrink: 0;
  border: 3px solid #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.author-feature-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-feature-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  h2 {
    margin: 0;
    color: #2c2f30;
    font-size: clamp(26px, 3.2vw, 32px);
    line-height: 1.14;
    font-weight: 800;
  }
}

.author-feature-bio {
  max-width: 760px;
  margin: 12px 0 0;
  color: #595c5d;
  font-size: var(--font-size-md);
  line-height: 1.8;
}

.author-feature-action {
  min-height: 44px;
  padding: 0 26px;
  border-radius: 999px;
  border: 1px solid #005bad;
  background: #005bad;
  color: #eef2ff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 91, 173, 0.16);
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(0, 91, 173, 0.18);
  }
}

.comments-shell {
  margin-top: 28px;
}

.section-eyebrow {
  margin: 0 0 12px;
  color: #005bad;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
}

.more-section {
  padding: 28px;
}

.more-section-heading {
  h2 {
    margin: 0;
    color: #111827;
    font-size: var(--font-size-9xl);
    line-height: 1.14;
    font-weight: 800;
  }
}

.more-list,
.more-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 24px;
}

.more-skeleton-card {
  min-height: 280px;
  border-radius: 28px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.76), rgba(241, 245, 249, 0.94), rgba(226, 232, 240, 0.76));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.floating-actions {
  z-index: 30;
}

.floating-actions-desktop {
  position: fixed;
  left: max(18px, calc(50% - 662px));
  top: 176px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.floating-actions-mobile {
  position: fixed;
  left: 50%;
  bottom: 18px;
  display: none;
  transform: translateX(-50%);
  gap: 12px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(245, 246, 247, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.54);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(20px);
}

.floating-action {
  padding: 0;
  border: none;
  background: transparent;
  color: #757778;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.25s ease, color 0.25s ease;

  &:hover:not(:disabled),
  &.active {
    transform: translateY(-2px);
    color: #005bad;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.floating-action-icon {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  border: 1px solid rgba(224, 227, 228, 0.96);
  background: rgba(255, 255, 255, 0.98);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease;

  .material-symbols-outlined {
    font-size: 25px;
    font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
  }
}

.floating-action:hover:not(:disabled) .floating-action-icon,
.floating-action.active .floating-action-icon {
  border-color: rgba(0, 91, 173, 0.2);
  background: rgba(0, 91, 173, 0.08);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
}

.floating-action-value {
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

@media (max-width: 1640px) {
  .floating-actions-desktop {
    display: none;
  }
}

@media (max-width: 1200px) {
  .hero-author-row,
  .author-feature {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 767px) {
  .diary-detail-page {
    padding-bottom: 118px;
  }

  .loading-hero,
  .loading-panel,
  .hero-stage,
  .story-shell,
  .more-section {
    border-radius: 24px;
  }

  .loading-hero {
    min-height: 420px;
  }

  .loading-panel {
    padding: 22px 18px;
  }

  .hero-stage {
    min-height: 440px;
  }

  .hero-shell {
    min-height: 440px;
    padding: 18px 18px 24px;
  }

  .hero-topbar {
    align-items: flex-start;
  }

  .hero-copy h1 {
    font-size: clamp(34px, 10.5vw, 46px);
  }

  .hero-summary {
    font-size: var(--font-size-md);
    line-height: 1.75;
  }

  .story-shell,
  .more-section {
    margin-top: 22px;
  }

  .story-shell {
    padding: 24px 18px 28px;
  }

  .story-shell :deep(.rich-content) {
    font-size: var(--font-size-lg);
  }

  .story-intro {
    margin-bottom: 22px;
    padding: 16px;

    p {
      font-size: var(--font-size-base);
    }
  }

  .author-feature {
    padding: 22px 18px;
    align-items: stretch;
  }

  .author-feature-main {
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
  }

  .author-feature-header h2,
  .more-section-heading h2 {
    font-size: var(--font-size-7xl);
  }

  .author-feature-action {
    width: 100%;
    justify-content: center;
  }

  .floating-actions-mobile {
    display: flex;
  }

  .floating-action {
    min-width: 88px;
    flex-direction: row;
    gap: 8px;
  }

  .floating-action-icon {
    width: 40px;
    height: 40px;

    .material-symbols-outlined {
      font-size: 20px;
    }
  }
}
</style>
