<template>
  <section class="diary-section" v-loading="loading">
    <div class="header">
      <div>
        <p class="subtitle">旅行日记精选</p>
        <h2 class="title">重叠叙事里的真实旅途</h2>
      </div>
      <el-button round class="more-btn" @click="router.push('/diaries')">查看更多日记</el-button>
    </div>

    <div v-if="diaries.length" class="list">
      <article
        v-for="item in diaries"
        :key="item.id"
        ref="cardsRef"
        class="diary-card"
        @click="router.push(`/diaries/${item.id}`)"
      >
        <div class="content">
          <div class="author">
            <el-avatar :size="40" :src="item.author?.avatarUrl" />
            <div class="meta">
              <p class="name">{{ item.author?.nickname || '旅行者' }}</p>
              <span v-if="getPublishedAt(item)" class="time">{{ getPublishedAt(item) }}</span>
            </div>
          </div>

          <h3 class="diary-title" :title="item.title">{{ item.title }}</h3>
          <p class="summary" :title="getSummary(item)">{{ getSummary(item) }}</p>

          <div class="counts">
            <span class="count">
              <el-icon><View /></el-icon>
              {{ formatCountStat(item.viewCount) }}
            </span>
            <span class="count">
              <el-icon><Star /></el-icon>
              {{ formatCountStat(item.likeCount) }}
            </span>
            <span class="count">
              <el-icon><ChatLineRound /></el-icon>
              {{ formatCountStat(item.commentCount) }}
            </span>
            <span class="count">
              <el-icon><CollectionTag /></el-icon>
              {{ formatCountStat(item.favoriteCount) }}
            </span>
          </div>
        </div>

        <div class="image-wrap">
          <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" />
          <div v-else class="image-fallback" />
        </div>
      </article>
    </div>

    <div v-else-if="loadError && !loading" class="state-card">
      <h3>旅行日记加载失败</h3>
      <p>{{ loadError }}</p>
      <el-button round @click="fetchData">重新加载</el-button>
    </div>

    <div v-else-if="!loading" class="state-card">
      <h3>暂无精选日记</h3>
      <p>当前暂无可展示的旅行日记内容，你可以稍后再来查看。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ChatLineRound, CollectionTag, Star, View } from '@element-plus/icons-vue';
import { getDiaryFeed, type DiaryCard } from '@/api/diaries';
import { formatCountStat, formatDate } from '@/utils/formatters';

const router = useRouter();
const diaries = ref<DiaryCard[]>([]);
const cardsRef = ref<HTMLElement[]>([]);
const loading = ref(false);
const loadError = ref('');
let observer: IntersectionObserver | null = null;

const fetchData = async () => {
  loading.value = true;
  loadError.value = '';

  try {
    const res = await getDiaryFeed();
    diaries.value = res?.data?.list || [];
    await nextTick();
    observeCards();
  } catch (error) {
    console.error('Failed to load diaries', error);
    diaries.value = [];
    loadError.value = '当前无法获取旅行日记精选，请稍后重试。';
  } finally {
    loading.value = false;
  }
};

const observeCards = () => {
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  cardsRef.value.forEach((card) => card && observer?.observe(card));
};

const getSummary = (item: DiaryCard) => {
  const summary = item.summary?.trim();
  if (!summary) return '这篇旅行日记暂未提供摘要内容。';
  return summary;
};

const getPublishedAt = (item: DiaryCard) => formatDate(item.publishedAt);

onMounted(fetchData);

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<style scoped lang="scss">
$gold: #d4af37;

.diary-section {
  background: #fafafa;
  padding: 48px 24px;
  border-radius: 24px;

  .header {
    margin-bottom: 24px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;

    .subtitle {
      color: $gold;
      font-size: 14px;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }

    .title {
      color: #1a1a1a;
      font-size: 28px;
      font-weight: 700;
    }

    .more-btn {
      flex-shrink: 0;
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .diary-card {
    display: flex;
    align-items: stretch;
    opacity: 0;
    transform: translateY(40px);
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    cursor: pointer;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    &:nth-child(even) {
      flex-direction: row-reverse;

      .content {
        margin-right: 0;
        margin-left: -90px;
      }
    }

    .content {
      flex: 1 1 40%;
      padding: 28px 30px;
      margin-right: -90px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.16);
      border-radius: 24px;
      position: relative;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 0.4s ease;

      .author {
        display: flex;
        align-items: center;
        gap: 12px;

        .meta {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .name {
            color: #111827;
            font-weight: 700;
            margin: 0;
          }

          .time {
            display: inline-flex;
            align-items: center;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #6b7280;
            width: fit-content;
          }
        }
      }

      .diary-title {
        font-size: 30px;
        font-weight: 800;
        color: #111827;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0;
      }

      .summary {
        color: #4b5563;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0;
      }

      .counts {
        display: flex;
        flex-wrap: wrap;
        gap: 16px 24px;
        margin-top: auto;

        .count {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #111827;
          font-weight: 600;

          :deep(.el-icon) {
            color: $gold;
          }
        }
      }
    }

    .image-wrap {
      position: relative;
      flex: 1 1 60%;
      height: 320px;
      overflow: hidden;
      border-radius: 32px;
      z-index: 10;
      background: linear-gradient(135deg, #dbeafe 0%, #eef2ff 100%);

      img,
      .image-fallback {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 700ms ease;
      }

      .image-fallback {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(15, 23, 42, 0.18) 100%),
          linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);
      }
    }

    &:hover {
      .image-wrap img,
      .image-wrap .image-fallback {
        transform: scale(1.08);
      }

      .content {
        transform: translateY(-8px);
      }
    }
  }

  .state-card {
    min-height: 280px;
    padding: 48px 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.85);
    text-align: center;
    color: #6b7280;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    h3 {
      margin: 0 0 10px;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
    }

    p {
      margin: 0 0 20px;
      max-width: 440px;
      line-height: 1.7;
    }
  }
}

@media (max-width: 1024px) {
  .diary-section {
    .diary-card {
      flex-direction: column;
      gap: 8px;

      .content {
        flex: 0 0 auto;
        margin-right: 0;
        margin-left: 0;
      }

      .image-wrap {
        flex: 0 0 auto;
        height: 260px;
        border-radius: 22px;
        order: -1;
      }
    }

    .diary-card:nth-child(even) {
      flex-direction: column;

      .content {
        margin-right: 0;
        margin-left: 0;
      }
    }
  }
}

@media (max-width: 640px) {
  .diary-section {
    padding: 32px 16px;

    .header {
      flex-direction: column;
      align-items: flex-start;

      .title {
        font-size: 24px;
      }
    }

    .diary-card {
      .content {
        padding: 22px 18px;
      }

      .image-wrap {
        height: 200px;
        border-radius: 18px;
      }
    }
  }
}
</style>
