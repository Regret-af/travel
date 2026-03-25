<template>
  <div class="attraction-detail-page">
    <template v-if="pageStatus === 'success' && detail">
      <section class="detail-hero" :style="heroBackgroundStyle">
        <div class="hero-overlay" />
        <div class="hero-glow hero-glow-cyan" />
        <div class="hero-glow hero-glow-gold" />

        <div class="hero-topbar">
          <button class="hero-back" type="button" @click="goBackToList">
            返回景点列表
          </button>
          <span v-if="detail.category?.name" class="hero-category">{{ detail.category.name }}</span>
        </div>

        <div class="hero-content">
          <div class="hero-copy">
            <p class="hero-eyebrow">景点详情</p>
            <h1>{{ detail.name }}</h1>
            <p v-if="heroSummary" class="hero-summary">{{ heroSummary }}</p>

            <div class="hero-meta">
              <span v-if="detail.locationText" class="hero-meta-pill">{{ detail.locationText }}</span>
              <span v-if="detail.viewCount !== undefined" class="hero-meta-pill ghost">{{ viewCountText }}</span>
            </div>
          </div>

          <button class="hero-scroll" type="button" @click="scrollToIntro">
            继续阅读
          </button>
        </div>
      </section>

      <section ref="introRef" class="intro-shell">
        <div class="intro-card">
          <p class="section-eyebrow">目的地前言</p>
          <div class="intro-headline">
            <h2>{{ detail.name }}</h2>
            <p>{{ introSummary }}</p>
          </div>
        </div>

        <div class="meta-grid">
          <article class="meta-card">
            <span class="meta-label">景点分类</span>
            <strong class="meta-value">{{ detail.category?.name || '待补充' }}</strong>
            <p class="meta-note">以当前景点分类建立浏览语义，不扩展更多筛选维度。</p>
          </article>

          <article class="meta-card">
            <span class="meta-label">所在位置</span>
            <strong class="meta-value">{{ detail.locationText || '待补充' }}</strong>
            <p class="meta-note">这里仅展示文本位置说明，不伪装成地图或导航能力。</p>
          </article>

          <article class="meta-card">
            <span class="meta-label">浏览记录</span>
            <strong class="meta-value">{{ viewCountText }}</strong>
            <p class="meta-note">作为轻量内容档案信息展示，不做夸张营销数字。</p>
          </article>
        </div>
      </section>

      <section class="story-shell">
        <div class="story-frame">
          <div class="story-intro">
            <p class="section-eyebrow">景点介绍</p>
            <h2>以阅读的方式，重新走近这处目的地</h2>
            <p class="story-lead">{{ introSummary }}</p>
          </div>

          <div v-if="descriptionParagraphs.length" class="story-body">
            <p
              v-for="(paragraph, index) in descriptionParagraphs"
              :key="`${index}-${paragraph.slice(0, 12)}`"
              class="story-paragraph"
              :class="{ 'story-paragraph-first': index === 0 }"
            >
              {{ paragraph }}
            </p>
          </div>

          <div v-else class="story-empty">
            <p class="story-empty-title">景点正文正在补充中</p>
            <p class="story-empty-text">
              当前接口暂未返回更完整的景点介绍内容，但你仍可以先通过摘要与位置信息建立对这处目的地的初步印象。
            </p>
          </div>
        </div>
      </section>

      <section class="location-shell">
        <div class="location-card">
          <div class="location-graphic" />
          <div class="location-copy">
            <p class="section-eyebrow">位置说明</p>
            <h2>{{ detail.locationText || '位置待补充' }}</h2>
            <p>
              {{ locationNarrative }}
            </p>
          </div>
        </div>
      </section>

      <section class="return-shell">
        <div class="return-card">
          <div class="return-copy">
            <p class="section-eyebrow">继续探索</p>
            <h2>把这一站收进记忆，再回到目录继续翻阅</h2>
            <p>
              详情页到这里完成了一次完整阅读。如果你还想比较更多目的地，可以回到景点列表继续按分类、排序和分页浏览。
            </p>
          </div>

          <el-button type="primary" round class="return-button" @click="goBackToList">
            返回景点列表
          </el-button>
        </div>
      </section>
    </template>

    <section v-else-if="pageStatus === 'loading'" class="loading-shell">
      <div class="loading-hero">
        <div class="loading-sheen" />
      </div>
      <div class="loading-card-grid">
        <div class="loading-card loading-card-wide">
          <span class="loading-line short" />
          <span class="loading-line medium" />
          <span class="loading-line long" />
        </div>
        <div class="loading-card loading-card-compact">
          <span class="loading-line medium" />
          <span class="loading-line short" />
        </div>
      </div>
    </section>

    <section v-else class="state-shell">
      <div class="state-card">
        <div class="state-mark" :class="{ 'state-mark-error': pageStatus === 'error' }" />
        <p class="section-eyebrow">{{ pageStatus === 'error' ? '暂时无法打开' : '内容暂未找到' }}</p>
        <h2>{{ stateTitle }}</h2>
        <p class="state-description">{{ stateDescription }}</p>

        <div class="state-actions">
          <el-button v-if="pageStatus === 'error'" type="primary" round @click="reloadDetail">
            重新加载
          </el-button>
          <el-button round @click="goBackToList">
            返回景点列表
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAttractionDetail, type AttractionDetail } from '@/api/attractions';

const route = useRoute();
const router = useRouter();

const detail = ref<AttractionDetail | null>(null);
const pageStatus = ref<'loading' | 'success' | 'empty' | 'error'>('loading');
const errorMessage = ref('');
const introRef = ref<HTMLElement | null>(null);
let fetchSequence = 0;

const heroBackgroundStyle = computed(() => ({
  backgroundImage: detail.value?.coverUrl
    ? `linear-gradient(115deg, rgba(15, 23, 42, 0.62) 0%, rgba(15, 23, 42, 0.26) 42%, rgba(15, 23, 42, 0.72) 100%), url(${detail.value.coverUrl})`
    : 'radial-gradient(circle at 20% 18%, rgba(34, 211, 238, 0.26), transparent 24%), radial-gradient(circle at 82% 18%, rgba(212, 175, 55, 0.22), transparent 20%), linear-gradient(135deg, #e8f6fb 0%, #f8fafc 52%, #eef3ff 100%)'
}));
const heroSummary = computed(() => {
  const summary = detail.value?.summary?.trim() || '';
  if (!summary) return '';
  return summary.length > 90 ? `${summary.slice(0, 90)}...` : summary;
});
const introSummary = computed(
  () =>
    detail.value?.summary?.trim() ||
    '从封面、位置与正文开始，建立对这一处目的地最直接的第一印象。'
);
const descriptionParagraphs = computed(() => {
  const description = detail.value?.description?.trim() || '';
  if (!description) return [];

  return description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
});
const viewCountText = computed(() =>
  typeof detail.value?.viewCount === 'number' ? `${detail.value.viewCount} 次浏览` : '浏览记录待补充'
);
const locationNarrative = computed(() => {
  const location = detail.value?.locationText?.trim();
  if (!location) {
    return '当前接口暂未提供更完整的位置文本说明，因此这里只保留了一个克制的章节式占位，等待后续内容补充。';
  }

  return `${location} 是这处目的地当前能够被确认的文本位置线索。这里不扩展地图、坐标或路线信息，只保留一份轻量而安静的到达感说明。`;
});
const stateTitle = computed(() =>
  pageStatus.value === 'error' ? '景点详情暂时无法加载' : '未找到对应景点内容'
);
const stateDescription = computed(() =>
  pageStatus.value === 'error'
    ? errorMessage.value || '当前无法从接口获取这处景点的详情数据，请稍后重试。'
    : '这处景点可能不存在，或当前接口没有返回可展示的详情内容。'
);

const goBackToList = () => {
  router.push('/attractions');
};

const scrollToIntro = () => {
  nextTick(() => {
    const targetTop = introRef.value?.getBoundingClientRect().top;

    if (typeof targetTop !== 'number') return;

    window.scrollTo({
      top: Math.max(window.scrollY + targetTop - 96, 0),
      behavior: 'smooth'
    });
  });
};

const fetchDetail = async (id: string | string[] | undefined) => {
  const attractionId = Array.isArray(id) ? id[0] : id;
  const requestId = ++fetchSequence;

  if (!attractionId) {
    detail.value = null;
    errorMessage.value = '';
    pageStatus.value = 'empty';
    return;
  }

  pageStatus.value = 'loading';
  errorMessage.value = '';

  try {
    const res = await getAttractionDetail(attractionId);
    if (requestId !== fetchSequence) return;
    detail.value = res.data || null;
    pageStatus.value = detail.value ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== fetchSequence) return;
    console.error('Failed to load attraction detail', error);
    detail.value = null;
    errorMessage.value = '当前无法获取景点详情，请稍后重试。';
    pageStatus.value = 'error';
  }
};

const reloadDetail = () => {
  fetchDetail(route.params.id);
};

watch(
  () => route.params.id,
  (id) => {
    fetchDetail(id);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.attraction-detail-page {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  color: #111827;
}

.detail-hero,
.intro-card,
.meta-card,
.story-frame,
.location-card,
.return-card,
.state-card,
.loading-hero,
.loading-card {
  border-radius: 32px;
}

.detail-hero {
  position: relative;
  min-height: 78vh;
  padding: 32px 36px 38px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-position: center;
  background-size: cover;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
}

.hero-overlay,
.hero-glow {
  position: absolute;
  pointer-events: none;
}

.hero-overlay {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.22) 46%, rgba(15, 23, 42, 0.58) 100%);
}

.hero-glow {
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.72;
}

.hero-glow-cyan {
  width: 260px;
  height: 260px;
  right: -40px;
  top: 12%;
  background: rgba(34, 211, 238, 0.22);
}

.hero-glow-gold {
  width: 220px;
  height: 220px;
  left: -30px;
  bottom: 12%;
  background: rgba(212, 175, 55, 0.18);
}

.hero-topbar,
.hero-content {
  position: relative;
  z-index: 1;
}

.hero-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-back,
.hero-category,
.hero-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(12px);
}

.hero-back {
  border: none;
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.hero-category {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.82);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.hero-copy {
  max-width: 700px;
  color: #f8fafc;
}

.hero-eyebrow,
.section-eyebrow {
  margin: 0 0 12px;
  color: #f0cf79;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  font-size: 68px;
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.hero-summary {
  margin: 20px 0 0;
  max-width: 560px;
  font-size: 17px;
  line-height: 1.85;
  color: rgba(248, 250, 252, 0.88);
}

.hero-meta {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-meta-pill {
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.14);

  &.ghost {
    background: rgba(255, 255, 255, 0.14);
  }
}

.hero-scroll {
  flex-shrink: 0;
  min-height: 54px;
  padding: 0 22px;
  border-radius: 999px;
  border: none;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.9);
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  }
}

.intro-shell,
.location-shell,
.return-shell {
  position: relative;
}

.intro-shell {
  margin-top: -92px;
  z-index: 2;
}

.intro-card {
  padding: 34px 34px 32px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
}

.intro-headline {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 28px;
  align-items: start;

  h2 {
    margin: 0;
    font-size: 42px;
    line-height: 1.06;
    font-weight: 760;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: #475569;
    font-size: 17px;
    line-height: 1.95;
  }
}

.meta-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}

.meta-card {
  grid-column: span 4;
  padding: 24px 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.86);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
  }
}

.meta-card-wide {
  grid-column: span 8;
}

.meta-label {
  display: inline-flex;
  margin-bottom: 12px;
  color: #c79b1d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.meta-value {
  display: block;
  color: #111827;
  font-size: 25px;
  line-height: 1.2;
  font-weight: 760;
}

.meta-note {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.8;
}

.story-shell {
  padding-top: 4px;
}

.story-frame {
  padding: 42px 42px 46px;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.08), transparent 20%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.story-intro {
  max-width: 860px;
  margin: 0 auto 30px;

  h2 {
    margin: 0;
    font-size: 38px;
    line-height: 1.08;
    font-weight: 760;
    letter-spacing: -0.03em;
  }
}

.story-lead {
  margin: 18px 0 0;
  color: #334155;
  font-size: 19px;
  line-height: 1.95;
}

.story-body {
  max-width: 760px;
  margin: 0 auto;
}

.story-paragraph {
  margin: 0;
  color: #475569;
  font-size: 17px;
  line-height: 2.05;

  & + & {
    margin-top: 24px;
  }
}

.story-paragraph-first {
  color: #1f2937;
}

.story-empty {
  max-width: 760px;
  margin: 0 auto;
  padding: 26px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
}

.story-empty-title {
  margin: 0;
  color: #111827;
  font-size: 26px;
  font-weight: 760;
}

.story-empty-text {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.85;
}

.location-card,
.return-card,
.state-card {
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);
}

.location-card {
  padding: 30px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 26px;
  align-items: center;
}

.location-graphic {
  min-height: 220px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0) 34%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.24) 0%, rgba(212, 175, 55, 0.18) 100%);
  position: relative;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 999px;
  }

  &::before {
    width: 110px;
    height: 110px;
    top: 18%;
    left: 22%;
    border: 1px solid rgba(255, 255, 255, 0.56);
  }

  &::after {
    width: 160px;
    height: 1px;
    left: 24px;
    right: 24px;
    bottom: 58px;
    background: rgba(255, 255, 255, 0.74);
    box-shadow:
      0 -20px 0 rgba(255, 255, 255, 0.28),
      0 -40px 0 rgba(255, 255, 255, 0.18);
  }
}

.location-copy {
  h2 {
    margin: 0;
    font-size: 34px;
    line-height: 1.12;
    font-weight: 760;
    letter-spacing: -0.03em;
  }

  p {
    margin: 16px 0 0;
    color: #64748b;
    font-size: 16px;
    line-height: 1.92;
    max-width: 720px;
  }
}

.return-card {
  padding: 34px 34px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.return-copy {
  max-width: 760px;

  h2 {
    margin: 0;
    font-size: 36px;
    line-height: 1.08;
    font-weight: 760;
    letter-spacing: -0.03em;
  }

  p:last-child {
    margin: 16px 0 0;
    color: #64748b;
    font-size: 16px;
    line-height: 1.9;
  }
}

.return-button {
  min-width: 160px;
  height: 50px;
}

.state-shell {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-card {
  width: min(100%, 680px);
  padding: 46px 34px 42px;
  text-align: center;
}

.state-mark {
  width: 92px;
  height: 92px;
  margin: 0 auto 18px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 36%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(212, 175, 55, 0.22) 100%);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);

  &.state-mark-error {
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 36%),
      linear-gradient(135deg, rgba(248, 113, 113, 0.24) 0%, rgba(251, 191, 36, 0.18) 100%);
  }
}

.state-card h2 {
  margin: 0;
  font-size: 38px;
  line-height: 1.08;
  font-weight: 760;
}

.state-description {
  margin: 18px auto 0;
  max-width: 520px;
  color: #64748b;
  font-size: 16px;
  line-height: 1.88;
}

.state-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.loading-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-hero {
  min-height: 72vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.8) 0%, rgba(241, 245, 249, 0.96) 100%);
}

.loading-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.65) 50%, rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  animation: loading-sheen 1.3s ease-in-out infinite;
}

.loading-card-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.loading-card {
  padding: 30px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.84);
}

.loading-card-wide {
  min-height: 180px;
}

.loading-card-compact {
  min-height: 180px;
}

.loading-line {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.8));
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;

  & + & {
    margin-top: 14px;
  }

  &.short {
    width: 30%;
  }

  &.medium {
    width: 58%;
  }

  &.long {
    width: 84%;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@keyframes loading-sheen {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1100px) {
  .detail-hero {
    min-height: 68vh;
  }

  .hero-copy h1 {
    font-size: 56px;
  }

  .intro-headline,
  .location-card,
  .return-card,
  .loading-card-grid {
    grid-template-columns: 1fr;
  }

  .meta-card,
  .meta-card-wide {
    grid-column: span 6;
  }
}

@media (max-width: 767px) {
  .attraction-detail-page {
    gap: 24px;
  }

  .detail-hero,
  .intro-card,
  .meta-card,
  .story-frame,
  .location-card,
  .return-card,
  .state-card,
  .loading-hero,
  .loading-card {
    border-radius: 24px;
  }

  .detail-hero {
    min-height: 76vh;
    padding: 20px 18px 24px;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-copy h1 {
    font-size: 40px;
    line-height: 1.04;
  }

  .hero-summary {
    font-size: 15px;
    line-height: 1.85;
  }

  .hero-scroll {
    width: 100%;
    justify-content: center;
  }

  .intro-shell {
    margin-top: -48px;
  }

  .intro-card,
  .story-frame,
  .location-card,
  .return-card,
  .state-card {
    padding: 24px 18px;
  }

  .intro-headline h2,
  .story-intro h2,
  .location-copy h2,
  .return-copy h2,
  .state-card h2 {
    font-size: 30px;
  }

  .intro-headline p,
  .story-lead,
  .location-copy p,
  .return-copy p:last-child,
  .state-description {
    font-size: 15px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .meta-card,
  .meta-card-wide {
    grid-column: span 1;
  }

  .meta-value {
    font-size: 22px;
  }

  .story-body,
  .story-empty {
    margin: 0;
  }

  .story-paragraph {
    font-size: 15px;
    line-height: 1.95;
  }

  .location-graphic {
    min-height: 180px;
  }

  .return-button {
    width: 100%;
  }

  .state-actions {
    flex-direction: column;
  }

  .state-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .loading-hero {
    min-height: 54vh;
  }
}
</style>
