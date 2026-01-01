<template>
  <section class="hero-container">
    <el-carousel
      v-if="featuredAttractions.length"
      height="100vh"
      trigger="click"
      arrow="always"
      indicator-position="none"
      :interval="6000"
      :autoplay="true"
    >
      <el-carousel-item
        v-for="item in featuredAttractions"
        :key="item.id"
        class="carousel-item"
      >
        <div
          class="carousel-bg"
          :style="{ backgroundImage: `url(${item.imageUrl || item.imageUrl || ''})` }"
        />
        <div class="overlay">
          <div class="content">
            <p class="tagline">精选目的地</p>
            <div class="title">
              <div class="line thin">{{ item.name }}</div>
              <div class="line bold">{{ item.location || '探索未知，记录精彩' }}</div>
            </div>
            <p class="desc">
              {{ item.description || '沉浸式旅程，从此刻出发。精选景点、真实日记与智能推荐，为你定制独一无二的旅行灵感。' }}
            </p>
            <div class="search-wrapper">
              <el-input
                v-model="keyword"
                placeholder="输入目的地或关键词搜索"
                class="search-input"
                @input="handleInput"
              >
                <template #prefix>
                  <el-icon class="search-icon">
                    <Search />
                  </el-icon>
                </template>
              </el-input>
              <el-button type="primary" class="search-btn">探索</el-button>
              <div v-if="showDropdown" class="search-dropdown">
                <div
                  v-for="result in searchResults"
                  :key="result.id"
                  class="search-item"
                >
                  {{ result.name }}
                </div>
                <div v-if="!searchResults.length" class="empty">没有找到匹配的景点</div>
              </div>
            </div>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { ElButton, ElCarousel, ElCarouselItem, ElIcon, ElInput } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import debounce from 'lodash-es/debounce';
import { getFeaturedAttractions, searchAttractions, AttractionCard } from '@/api/attractions';

const featuredAttractions = ref<AttractionCard[]>([]);
const keyword = ref('');
const searchResults = ref<AttractionCard[]>([]);

const showDropdown = computed(() => keyword.value.length > 0);

const loadFeatured = async () => {
  try {
    const res = await getFeaturedAttractions();
    if (res?.data?.list) {
      featuredAttractions.value = res.data.list;
    }
  } catch (error) {
    console.error('Failed to load featured attractions', error);
  }
};

const doSearch = debounce(async () => {
  if (!keyword.value.trim()) {
    searchResults.value = [];
    return;
  }
  try {
    const res = await searchAttractions({ q: keyword.value, page: 1, size: 5 });
    searchResults.value = res?.data?.list || [];
  } catch (error) {
    console.error('Search attractions failed', error);
  }
}, 300);

const handleInput = () => {
  doSearch();
};

onMounted(() => {
  loadFeatured();
});
</script>

<style scoped lang="scss">
$gold-color: #d4af37;

.hero-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;

  .carousel-item {
    position: relative;
    width: 100%;
    height: 100%;

    .carousel-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transform: scale(1);
      transition: transform 0.8s ease;
    }

    &:hover .carousel-bg {
      transform: scale(1.05);
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(0, 0, 0, 0.55) 30%, rgba(0, 0, 0, 0.2));
      display: flex;
      align-items: center;
      padding: 0 1.5rem;

      .content {
        max-width: 560px;
        color: #e5e7eb;

        .tagline {
          display: inline-flex;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: $gold-color;
          letter-spacing: 0.04em;
          font-size: 13px;
          margin-bottom: 14px;
        }

        .title {
          margin-bottom: 12px;

          .line {
            line-height: 1.15;
            color: #f9fafb;
          }

          .thin {
            font-size: clamp(24px, 3vw, 36px);
            font-weight: 200;
          }

          .bold {
            font-size: clamp(32px, 4vw, 48px);
            font-weight: 700;
          }
        }

        .desc {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 20px;
          max-width: 520px;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px 10px 10px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          max-width: 520px;

          .search-input {
            flex: 1;

            :deep(.el-input__wrapper) {
              background: transparent;
              box-shadow: none;
              padding-left: 4px;
            }

            :deep(.el-input__inner) {
              color: #f9fafb;
              &::placeholder {
                color: rgba(255, 255, 255, 0.65);
              }
            }
          }

          .search-icon {
            color: rgba(255, 255, 255, 0.8);
          }

          .search-btn {
            border-radius: 999px;
            padding: 0 18px;
            font-weight: 600;

            &:hover {
              background-color: $gold-color;
              border-color: $gold-color;
            }
          }

          .search-dropdown {
            position: absolute;
            left: 0;
            right: 0;
            top: calc(100% + 8px);
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 8px 0;
            max-height: 220px;
            overflow-y: auto;
            box-shadow: 0 24px 40px rgba(0, 0, 0, 0.28);

            .search-item {
              padding: 10px 14px;
              color: #e2e8f0;
              cursor: pointer;
              transition: background 0.2s ease;

              &:hover {
                background: rgba(255, 255, 255, 0.06);
              }
            }

            .empty {
              padding: 10px 14px;
              color: #94a3b8;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>
