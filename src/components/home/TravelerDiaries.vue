<template>
  <section class="diary-section">
    <div class="header">
      <p class="subtitle">旅行者日记</p>
      <h2 class="title">重叠叙事里的真实旅途</h2>
    </div>
    <div class="list">
      <article v-for="item in diaries" :key="item.id" class="diary-card" ref="cardsRef">
        <div class="content">
          <div class="author">
            <!-- <el-avatar :size="40" :src="item.user?.avatarUrl ? `${item.user.avatarUrl}/webp_low` : ''" /> -->
            <el-avatar :size="40" :src="item.user?.avatarUrl" />
            <div class="meta">
              <p class="name">{{ item.user?.username || 'Traveler' }}</p>
              <span class="location">{{ getLocation(item) }}</span>
            </div>
          </div>
          <h3 class="diary-title">{{ item.title }}</h3>
          <p class="summary">{{ getSummary(item) }}</p>
          <div class="counts">
            <span class="count">
              <el-icon><FillNewMedicHealthHeartLike /></el-icon>
              {{ item.likeCount ?? 0 }}
            </span>
            <span class="count">
              <el-icon><Comment /></el-icon>
              {{ item.commentCount ?? 0 }}
            </span>
            <span class="count">
              <el-icon><StarFilled /></el-icon>
              {{ item.collectCount ?? 0 }}
            </span>
          </div>
        </div>
        <div class="image-wrap">
          <!-- <img :src="item.coverImage ? `${item.coverImage}/webp_low` : ''" :alt="item.title" /> -->
          <img :src="item.coverImage" :alt="item.title" />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { Comment, StarFilled } from '@element-plus/icons-vue';
import { FillNewMedicHealthHeartLike } from '@element-extended-icon-pack/vue';
import { getDiaryFeed } from '@/api/diaries';
import type { DiaryCard } from '@/api/diaries';

type DiaryCardWithContent = DiaryCard & { content?: string; location?: string };

const diaries = ref<DiaryCard[]>([]);
const cardsRef = ref<HTMLElement[]>([]);

const fetchData = async () => {
  try {
    const res = await getDiaryFeed();
    diaries.value = res?.data?.list || [];
    await nextTick();
    observeCards();
  } catch (error) {
    console.error('Failed to load diaries', error);
  }
};

const observeCards = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  cardsRef.value.forEach((card) => card && observer.observe(card));
};

const getSummary = (item: DiaryCardWithContent) => {
  const summary = item.summary?.trim();
  if (summary) return summary;
  const content = item.content?.replace(/\s+/g, ' ').trim();
  if (!content) return '暂无摘要';
  return content.length > 80 ? `${content.slice(0, 80)}...` : content;
};

const getLocation = (item: DiaryCardWithContent) => {
  return item.location || item.user?.bio || '未知地点';
};

onMounted(() => {
  fetchData();
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
      font-family: 'Georgia', 'Times New Roman', serif;
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
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
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
          }

          .location {
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
        font-family: 'Georgia', 'Times New Roman', serif;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .summary {
        color: #4b5563;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .counts {
        display: flex;
        gap: 24px;
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

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 700ms ease;
      }
    }

    &:hover {
      .image-wrap img {
        transform: scale(1.1);
      }

      .content {
        transform: translateY(-8px);
      }
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

    .header .title {
      font-size: 24px;
    }

    .image-wrap {
      height: 200px;
      border-radius: 18px;
    }
  }
}
</style>
