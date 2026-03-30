<template>
  <article
    class="attraction-card"
    :class="{ clickable: Boolean(to) }"
    :role="to ? 'link' : undefined"
    :tabindex="to ? 0 : undefined"
    @click="handleClick"
    @keyup.enter="handleClick"
    @keyup.space.prevent="handleClick"
  >
    <div class="image-box">
      <img v-if="imageSrc" :src="imageSrc" :alt="item.name" />
      <div v-else class="image-fallback" />

      <div class="image-top">
        <span v-if="item.category?.name" class="category-badge">
          {{ item.category.name }}
        </span>
        <span class="ghost-dot" />
      </div>
    </div>

    <div class="content-panel">
      <div class="content-head">
        <h3 class="title" :title="item.name">{{ item.name }}</h3>
        <span class="arrow-mark">进入</span>
      </div>

      <p v-if="summaryText" class="summary" :title="summaryText">{{ summaryText }}</p>

      <div v-if="locationText" class="meta-line">
        <span class="meta-pill">{{ locationText }}</span>
      </div>

      <div v-if="viewText" class="meta-row">
        <span v-if="viewText">{{ viewText }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { AttractionCard } from '@/api/attractions';
import { formatCountStat } from '@/utils/formatters';

const props = defineProps<{
  item: AttractionCard;
  to?: string;
}>();

const router = useRouter();

const imageSrc = computed(() => props.item.coverUrl || '');
const summaryText = computed(() => props.item.summary?.trim() || '');
const locationText = computed(() => props.item.locationText?.trim() || '');
const viewText = computed(() =>
  typeof props.item.viewCount === 'number' ? `${formatCountStat(props.item.viewCount)} 浏览` : ''
);

const handleClick = () => {
  if (!props.to) return;
  router.push(props.to);
};
</script>

<style scoped lang="scss">
.attraction-card {
  position: relative;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.45s cubic-bezier(0.25, 1, 0.5, 1),
    box-shadow 0.45s cubic-bezier(0.25, 1, 0.5, 1),
    border-color 0.45s ease;

  &.clickable {
    cursor: pointer;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(34, 211, 238, 0.18),
      0 22px 50px rgba(15, 23, 42, 0.12);
  }

  .image-box {
    position: relative;
    width: 100%;
    height: 68%;
    overflow: hidden;
    background: linear-gradient(160deg, #dcecff 0%, #eef2ff 50%, #f7f7f7 100%);

    img,
    .image-fallback {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1);
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .image-fallback {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(15, 23, 42, 0.18) 100%),
        linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%);
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.28) 100%);
    }

    .image-top {
      position: absolute;
      inset: 16px 16px auto 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      z-index: 1;

      .category-badge {
        display: inline-flex;
        align-items: center;
        max-width: calc(100% - 40px);
        min-height: 32px;
        padding: 0 14px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.46);
        color: #f8fafc;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.04em;
        backdrop-filter: blur(12px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ghost-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.12);
      }
    }
  }

  .content-panel {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    padding: 18px 18px 16px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(16px);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    transition:
      transform 0.45s cubic-bezier(0.25, 1, 0.5, 1),
      background 0.45s ease,
      box-shadow 0.45s ease;
  }

  .content-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;

    .title {
      margin: 0;
      font-size: var(--font-size-4xl);
      line-height: 1.18;
      font-weight: var(--font-weight-bold);
      color: #0f172a;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .arrow-mark {
      flex-shrink: 0;
      font-size: var(--font-size-2xs);
      letter-spacing: 0.08em;
      color: rgba(100, 116, 139, 0.72);
      transform: translateX(0);
      transition: transform 0.45s ease, color 0.45s ease;
    }
  }

  .summary {
    margin: 0 0 14px;
    font-size: var(--font-size-md);
    line-height: 1.72;
    color: #475569;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta-line {
    margin-bottom: 10px;

    .meta-pill {
      display: inline-flex;
      max-width: 100%;
      align-items: center;
      min-height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      background: rgba(248, 250, 252, 0.96);
      color: #334155;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid rgba(226, 232, 240, 0.9);
    }
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    color: #64748b;
    font-size: var(--font-size-xs);
    letter-spacing: 0.03em;

    .divider {
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.9);
    }
  }

  &:hover {
    border-color: rgba(212, 175, 55, 0.32);
    box-shadow: 0 28px 62px rgba(15, 23, 42, 0.14);
    transform: translateY(-6px);

    .image-box {
      img,
      .image-fallback {
        transform: scale(1.06);
      }
    }

    .content-panel {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
    }

    .arrow-mark {
      color: #d4af37;
      transform: translateX(4px);
    }
  }
}

@media (max-width: 640px) {
  .attraction-card {
    border-radius: 20px;

    .image-box {
      height: 64%;
    }

    .content-panel {
      left: 12px;
      right: 12px;
      bottom: 12px;
      padding: 16px 16px 14px;
      border-radius: 18px;
    }

    .content-head .title {
      font-size: var(--font-size-2xl);
    }

    .summary {
      -webkit-line-clamp: 3;
    }

    &:hover {
      transform: none;

      .content-panel {
        transform: none;
      }
    }
  }
}
</style>
