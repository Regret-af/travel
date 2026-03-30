<template>
  <section class="hero-container">
    <div v-if="featuredStatus === 'loading'" class="hero-loading">
      <div class="overlay">
        <div class="content loading-content">
          <p class="tagline">探索全球精选旅程</p>
          <div class="title">
            <div class="line thin">首页景点推荐</div>
            <div class="line bold">加载中</div>
          </div>
          <p class="desc">正在获取首页推荐景点，请稍候。</p>
          <div class="loading-bar">
            <span />
          </div>
        </div>
      </div>
    </div>

    <template v-else-if="featuredAttractions.length">
      <div class="hero-slides">
        <div
          v-for="(item, index) in featuredAttractions"
          :key="item.id"
          class="hero-slide"
          :class="{ active: index === currentSlideIndex }"
        >
          <div
            class="hero-bg"
            :style="{ backgroundImage: item.coverUrl ? `url(${item.coverUrl})` : '' }"
          />
        </div>
      </div>

      <div class="overlay">
        <div class="content">
          <p class="tagline">探索全球精选旅程</p>
          <div class="title">
            <div class="line thin">{{ activeFeaturedAttraction?.name }}</div>
            <div class="line bold">{{ activeFeaturedAttraction?.locationText || '发现旅途灵感' }}</div>
          </div>
          <p class="desc">
            {{ activeFeaturedAttraction?.summary || '沉浸式浏览真实景点内容，从灵感到出发一站完成。' }}
          </p>

          <div ref="searchRef" class="search-wrapper">
            <el-input
              v-model="keyword"
              placeholder="搜索景点名称或关键词"
              class="search-input"
              @input="handleInput"
              @focus="handleInput"
              @keyup.enter="handleSearchSubmit"
            >
              <template #prefix>
                <el-icon class="search-icon">
                  <Search />
                </el-icon>
              </template>
            </el-input>

            <el-button type="primary" class="search-btn" @click="handleSearchSubmit">
              搜索
            </el-button>

            <transition name="fade-slide">
              <div v-if="showDropdown" class="search-dropdown">
                <ul v-if="searchResults.length" class="result-list">
                  <li
                    v-for="result in searchResults"
                    :key="result.id"
                    class="search-item"
                    @click="handleSelectResult(result)"
                  >
                    <el-icon>
                      <Location />
                    </el-icon>
                    <span class="name">{{ result.name }}</span>
                    <span v-if="result.locationText" class="location-tag">{{ result.locationText }}</span>
                  </li>
                </ul>
                <div v-else-if="searchStatus === 'loading'" class="state-panel">
                  正在搜索景点...
                </div>
                <div v-else-if="searchStatus === 'error'" class="state-panel error">
                  {{ searchErrorMessage }}
                </div>
                <div v-else class="state-panel">
                  未找到相关景点，请尝试更换关键词
                </div>
              </div>
            </transition>
          </div>

          <div v-if="featuredAttractions.length > 1" class="slide-dots">
            <button
              v-for="(item, index) in featuredAttractions"
              :key="item.id"
              class="dot"
              :class="{ active: index === currentSlideIndex }"
              :aria-label="`切换到第 ${index + 1} 张景点图`"
              @click="setActiveSlide(index)"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="hero-fallback">
      <div class="overlay">
        <div class="content">
          <p class="tagline">探索全球精选旅程</p>
          <div class="title">
            <div class="line thin">景点灵感</div>
            <div class="line bold">从景点开始</div>
          </div>
          <p class="desc">{{ fallbackDescription }}</p>

          <div ref="searchRef" class="search-wrapper">
            <el-input
              v-model="keyword"
              placeholder="搜索景点名称或关键词"
              class="search-input"
              @input="handleInput"
              @focus="handleInput"
              @keyup.enter="handleSearchSubmit"
            >
              <template #prefix>
                <el-icon class="search-icon">
                  <Search />
                </el-icon>
              </template>
            </el-input>

            <el-button type="primary" class="search-btn" @click="handleSearchSubmit">
              搜索
            </el-button>

            <transition name="fade-slide">
              <div v-if="showDropdown" class="search-dropdown">
                <ul v-if="searchResults.length" class="result-list">
                  <li
                    v-for="result in searchResults"
                    :key="result.id"
                    class="search-item"
                    @click="handleSelectResult(result)"
                  >
                    <el-icon>
                      <Location />
                    </el-icon>
                    <span class="name">{{ result.name }}</span>
                    <span v-if="result.locationText" class="location-tag">{{ result.locationText }}</span>
                  </li>
                </ul>
                <div v-else-if="searchStatus === 'loading'" class="state-panel">
                  正在搜索景点...
                </div>
                <div v-else-if="searchStatus === 'error'" class="state-panel error">
                  {{ searchErrorMessage }}
                </div>
                <div v-else class="state-panel">
                  未找到相关景点，请尝试更换关键词
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Location } from '@element-plus/icons-vue';
import debounce from 'lodash-es/debounce';
import {
  getFeaturedAttractions,
  searchAttractions,
  type AttractionCard
} from '@/api/attractions';

const router = useRouter();
const searchRef = ref<HTMLElement | null>(null);
const featuredAttractions = ref<AttractionCard[]>([]);
const currentSlideIndex = ref(0);
const keyword = ref('');
const searchResults = ref<AttractionCard[]>([]);
const isDropdownVisible = ref(false);
const featuredStatus = ref<'loading' | 'success' | 'empty' | 'error'>('loading');
const searchStatus = ref<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
const searchErrorMessage = ref('');
let heroTimer: number | null = null;

const showDropdown = computed(() => isDropdownVisible.value && keyword.value.trim().length > 0);
const activeFeaturedAttraction = computed(
  () => featuredAttractions.value[currentSlideIndex.value] || featuredAttractions.value[0] || null
);
const fallbackDescription = computed(() =>
  featuredStatus.value === 'error'
    ? '当前无法获取首页推荐景点，你仍可继续搜索并浏览景点列表。'
    : '当前暂无可展示的首页推荐景点，你仍可继续搜索并浏览景点列表。'
);

const clearHeroTimer = () => {
  if (heroTimer !== null) {
    window.clearInterval(heroTimer);
    heroTimer = null;
  }
};

const startHeroTimer = () => {
  clearHeroTimer();
  if (featuredAttractions.value.length <= 1) return;

  heroTimer = window.setInterval(() => {
    currentSlideIndex.value = (currentSlideIndex.value + 1) % featuredAttractions.value.length;
  }, 6000);
};

const loadFeatured = async () => {
  featuredStatus.value = 'loading';
  currentSlideIndex.value = 0;

  try {
    const res = await getFeaturedAttractions({ skipErrorToast: true });
    featuredAttractions.value = (res?.data?.list || []).filter((item) => item.coverUrl).slice(0, 3);
    featuredStatus.value = featuredAttractions.value.length ? 'success' : 'empty';
    startHeroTimer();
  } catch (error) {
    console.error('Failed to load featured attractions', error);
    featuredAttractions.value = [];
    featuredStatus.value = 'error';
    clearHeroTimer();
  }
};

const doSearch = debounce(async () => {
  const value = keyword.value.trim();
  if (!value) {
    searchResults.value = [];
    searchStatus.value = 'idle';
    searchErrorMessage.value = '';
    return;
  }

  searchStatus.value = 'loading';
  searchErrorMessage.value = '';

  try {
    const res = await searchAttractions({
      keyword: value,
      pageNum: 1,
      pageSize: 5,
      sort: 'hot'
    }, { skipErrorToast: true });
    searchResults.value = res?.data?.list || [];
    searchStatus.value = searchResults.value.length ? 'success' : 'empty';
  } catch (error) {
    console.error('Attraction search failed', error);
    searchResults.value = [];
    searchStatus.value = 'error';
    searchErrorMessage.value = '搜索建议加载失败，请稍后重试。';
  }
}, 300);

const handleInput = () => {
  isDropdownVisible.value = true;
  doSearch();
};

const handleSearchSubmit = () => {
  const value = keyword.value.trim();
  if (!value) return;

  isDropdownVisible.value = false;
  router.push({
    path: '/attractions',
    query: { keyword: value }
  });
};

const handleSelectResult = (result: AttractionCard) => {
  isDropdownVisible.value = false;
  keyword.value = result.name;
  router.push(`/attractions/${result.id}`);
};

const handleClickOutside = (event: MouseEvent) => {
  if (searchRef.value && !searchRef.value.contains(event.target as Node)) {
    isDropdownVisible.value = false;
  }
};

const setActiveSlide = (index: number) => {
  currentSlideIndex.value = index;
  startHeroTimer();
};

onMounted(() => {
  loadFeatured();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  clearHeroTimer();
  doSearch.cancel();
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
@use "sass:color";

$gold-color: #d4af37;
$white: #f9fafb;

.hero-container {
  position: relative;
  width: 100%;
  height: 100vh;
  border-radius: 34px;
  background: #1a1a1a;
  overflow: hidden;

  .hero-loading,
  .hero-slides,
  .hero-fallback {
    position: absolute;
    inset: 0;
  }

  .hero-slide,
  .hero-bg {
    position: absolute;
    inset: 0;
  }

  .hero-slide {
    opacity: 0;
    transition: opacity 0.9s ease;

    &.active {
      opacity: 1;
    }
  }

  .hero-bg {
    background-size: cover;
    background-position: center;
    transform: scale(1);
    transition: transform 6.2s ease;
  }

  .hero-slide.active .hero-bg,
  .hero-fallback:hover {
    transform: scale(1.06);
  }

  .hero-fallback {
    background:
      radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.2), transparent 24%),
      radial-gradient(circle at 78% 20%, rgba(212, 175, 55, 0.14), transparent 22%),
      linear-gradient(120deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.62) 48%, rgba(15, 23, 42, 0.3) 100%);
  }

  .hero-loading {
    background:
      radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.18), transparent 24%),
      radial-gradient(circle at 78% 20%, rgba(212, 175, 55, 0.12), transparent 22%),
      linear-gradient(120deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.74) 52%, rgba(15, 23, 42, 0.42) 100%);
  }

  .hero-slide::after,
  .hero-loading::after,
  .hero-fallback::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.62) 18%, rgba(0, 0, 0, 0.18) 52%, transparent 100%);
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 0 8%;
    z-index: 20;
    pointer-events: none;
  }

  .content {
    max-width: 620px;
    z-index: 10;
    pointer-events: auto;

    .tagline {
      display: inline-block;
      font-size: var(--font-size-md);
      color: $gold-color;
      letter-spacing: 0.08em;
      margin-bottom: 1rem;
    }

    .title {
      margin-bottom: 1.5rem;

      .line {
        color: $white;
        line-height: 1.2;
      }

      .thin {
        font-size: var(--font-size-13xl);
        font-weight: var(--font-weight-thin);
      }

      .bold {
        font-size: var(--font-size-20xl);
        font-weight: var(--font-weight-display);
      }
    }

    .desc {
      font-size: var(--font-size-xl);
      color: rgba(255, 255, 255, 0.82);
      margin-bottom: 2.5rem;
      line-height: 1.6;
      max-width: 560px;
    }

    .loading-content {
      .desc {
        margin-bottom: 20px;
      }
    }

    .loading-bar {
      width: min(320px, 100%);
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.16);

      span {
        display: block;
        width: 38%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, rgba(34, 211, 238, 0.9), rgba(212, 175, 55, 0.92));
        animation: hero-loading 1.3s ease-in-out infinite;
      }
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 50px;

      .search-input {
        flex: 1;

        :deep(.el-input__wrapper) {
          background: transparent;
          box-shadow: none !important;

          .el-input__inner {
            color: white;

            &::placeholder {
              color: rgba(255, 255, 255, 0.6);
            }
          }
        }
      }

      .search-btn {
        border-radius: 40px;
        padding: 0 25px;
        height: 44px;
        background: $gold-color;
        border: none;
        font-weight: var(--font-weight-bold);

        &:hover {
          background: color.adjust($gold-color, $lightness: 10%);
        }
      }

      .search-dropdown {
        position: absolute;
        top: calc(100% + 15px);
        left: 0;
        width: 100%;
        background: rgba(26, 26, 26, 0.95);
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        z-index: 50;

        .result-list {
          list-style: none;
          padding: 10px 0;
          margin: 0;

          .search-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            color: #ddd;
            cursor: pointer;
            transition: all 0.2s;

            .el-icon {
              color: $gold-color;
            }

            .name {
              flex: 1;
            }

            .location-tag {
              font-size: var(--font-size-xs);
              opacity: 0.65;
            }

            &:hover {
              background: rgba(212, 175, 55, 0.15);
              color: white;
            }
          }
        }

        .state-panel {
          padding: 20px;
          text-align: center;
          color: #cbd5e1;
          font-size: var(--font-size-md);

          &.error {
            color: #fca5a5;
          }
        }
      }
    }

    .slide-dots {
      margin-top: 18px;
      display: flex;
      gap: 10px;

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.35);
        transition: all 0.25s ease;

        &.active {
          width: 28px;
          background: $gold-color;
        }
      }
    }
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes hero-loading {
  0% {
    transform: translateX(-110%);
  }

  100% {
    transform: translateX(280%);
  }
}

@media (max-width: 768px) {
  .hero-container {
    border-radius: 24px;

    .overlay {
      padding: 0 24px;
    }

    .content {
      .title {
        .thin {
          font-size: var(--font-size-9xl);
        }

        .bold {
          font-size: var(--font-size-15xl);
        }
      }

      .search-wrapper {
        flex-direction: column;
        align-items: stretch;
        border-radius: 28px;

        .search-btn {
          width: 100%;
        }
      }
    }
  }
}
</style>
