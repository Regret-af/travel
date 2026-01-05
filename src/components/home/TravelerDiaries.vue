<template>
  <section class="diary-section">
    <div class="header">
      <p class="subtitle">灵感日记</p>
      <h2 class="title">达人日记流</h2>
    </div>
    <div class="list">
      <article
        v-for="(item, index) in diaries"
        :key="item.id"
        class="diary-card"
        :class="{ reverse: isEven(index) }"
        ref="cardsRef"
      >
        <div class="image-wrap">
          <img :src="item.coverImage" :alt="item.title" />
          <div class="like-badge">
            <el-icon><LinearNewMedicHealthHeartCardiogram /></el-icon>
            <span>{{ item.likeCount ?? 0 }}</span>
          </div>
        </div>
        <div class="content">
          <h3 class="diary-title">{{ item.title }}</h3>
          <p class="summary">{{ item.summary }}</p>
          <div class="author">
            <el-avatar :size="40" :src="item.user?.avatarUrl" />
            <div class="meta">
              <p class="name">{{ item.user?.username || 'Traveler' }}</p>
              <p class="time">{{ item.createdAt?.slice(0, 10) }}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { LinearNewMedicHealthHeartCardiogram } from '@element-extended-icon-pack/vue';
import { getDiaryFeed } from '@/api/diaries';
import type { DiaryCard } from '@/api/diaries';

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

const isEven = (index: number) => (index + 1) % 2 === 0;

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
    gap: 24px;
  }

  .diary-card {
    display: flex;
    gap: 20px;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
    opacity: 0;
    transform: translateY(40px);
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    &.reverse {
      flex-direction: row-reverse;
    }

    .image-wrap {
      position: relative;
      flex: 1 1 45%;
      min-height: 220px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .like-badge {
        position: absolute;
        right: 12px;
        bottom: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.6);
        color: $gold;
        font-weight: 600;

        :deep(.el-icon) {
          color: $gold;
        }
      }
    }

    .content {
      flex: 1 1 55%;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .diary-title {
        font-size: 22px;
        font-weight: 700;
        color: #111827;
        font-family: 'Georgia', 'Times New Roman', serif;
      }

      .summary {
        color: #4b5563;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .author {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: auto;

        .meta {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .name {
            color: $gold;
            font-weight: 700;
          }

          .time {
            color: #9ca3af;
            font-size: 13px;
          }
        }
      }
    }
  }
}

@media (max-width: 900px) {
  .diary-section {
    .diary-card {
      flex-direction: column;

      &.reverse {
        flex-direction: column;
      }

      .image-wrap {
        min-height: 200px;
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
  }
}
</style>
