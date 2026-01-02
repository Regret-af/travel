<template>
  <section class="hero-container">
    <el-carousel v-if="featuredAttractions.length" height="100vh" trigger="click" arrow="always"
      indicator-position="none" :interval="6000" :autoplay="true">
      <el-carousel-item v-for="item in featuredAttractions" :key="item.id" class="carousel-item">
        <div class="carousel-bg" :style="{ backgroundImage: `url(${item.image_url || item.imageUrl || ''})` }" />

        <div class="overlay">
          <div class="content">
            <p class="tagline">探索全球精选</p>
            <div class="title">
              <div class="line thin">{{ item.name }}</div>
              <div class="line bold">{{ item.location || '发现灵感' }}</div>
            </div>
            <p class="desc">
              {{ item.description || '沉浸式旅程，从此刻出发。精选景点、真实日记与智能推荐，为你定制独一无二的旅行灵感。' }}
            </p>

            <div ref="searchRef" class="search-wrapper">
              <el-input v-model="keyword" placeholder="搜索目的地、景点或攻略..." class="search-input" @input="handleInput"
                @focus="handleInput" @keyup.enter="handleSearchSubmit">
                <template #prefix>
                  <el-icon class="search-icon">
                    <Search />
                  </el-icon>
                </template>
              </el-input>

              <el-button type="primary" class="search-btn" @click="handleSearchSubmit">
                探索
              </el-button>

              <transition name="fade-slide">
                <div v-if="showDropdown" class="search-dropdown">
                  <ul v-if="searchResults.length" class="result-list">
                    <li v-for="result in searchResults" :key="result.id" class="search-item"
                      @click="handleSelectResult(result)">
                      <el-icon>
                        <Location />
                      </el-icon>
                      <span class="name">{{ result.name }}</span>
                      <span class="location-tag">{{ result.location }}</span>
                    </li>
                  </ul>
                  <div v-else class="empty-state">
                    未找到相关目的地，换个词试试？
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElButton, ElCarousel, ElCarouselItem, ElIcon, ElInput } from 'element-plus';
import { Search, Location } from '@element-plus/icons-vue';
import debounce from 'lodash-es/debounce';

import { getFeaturedAttractions, searchAttractions } from '@/api/attractions';

const router = useRouter();
const searchRef = ref<HTMLElement | null>(null);
const featuredAttractions = ref<any[]>([]);
const keyword = ref('');
const searchResults = ref<any[]>([]);
const isDropdownVisible = ref(false);

const showDropdown = computed(() => {
  return isDropdownVisible.value && keyword.value.trim().length > 0;
});

const loadFeatured = async () => {
  try {
    const res = await getFeaturedAttractions();
    featuredAttractions.value = res?.data?.list || [];
  } catch (error) {
    console.error('加载精选景点失败', error);
  }
};

const doSearch = debounce(async () => {
  if (!keyword.value.trim()) {
    searchResults.value = [];
    return;
  }
  try {
    // const res = await searchAttractions({ q: keyword.value, page: 1, size: 5 });
    // searchResults.value = res?.data?.list || [];
  } catch (error) {
    console.error('搜索接口异常', error);
  }
}, 300);

const handleInput = () => {
  isDropdownVisible.value = true;
  doSearch();
};

const handleSearchSubmit = () => {
  if (!keyword.value.trim()) return;
  isDropdownVisible.value = false;
  router.push({
    path: '/attractions',
    query: { q: keyword.value.trim() }
  });
};

const handleSelectResult = (result: any) => {
  isDropdownVisible.value = false;
  keyword.value = result.name;
  router.push(`/attractions/${result.id}`);
};

const handleClickOutside = (event: MouseEvent) => {
  if (searchRef.value && !searchRef.value.contains(event.target as Node)) {
    isDropdownVisible.value = false;
  }
};

onMounted(() => {
  loadFeatured();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
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
  background: #1a1a1a;

  .carousel-item {
    .carousel-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.6) 20%, transparent);
      }
    }

    &:hover .carousel-bg {
      transform: scale(1.08);
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      padding: 0 10%;

      .content {
        max-width: 600px;
        z-index: 10;

        .tagline {
          display: inline-block;
          font-size: 14px;
          color: $gold-color;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 1rem;
        }

        .title {
          margin-bottom: 1.5rem;

          .line {
            color: $white;
            line-height: 1.2;
          }

          .thin {
            font-size: 2.5rem;
            font-weight: 200;
          }

          .bold {
            font-size: 3.5rem;
            font-weight: 800;
          }
        }

        .desc {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2.5rem;
          line-height: 1.6;
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
            font-weight: bold;

            &:hover {
              background: color.adjust($gold-color, $lightness: 10%);
            }
          }

          /* 下拉框 SCSS 嵌套 */
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
                padding: 12px 20px;
                color: #ddd;
                cursor: pointer;
                transition: all 0.2s;

                .el-icon {
                  margin-right: 10px;
                  color: $gold-color;
                }

                .location-tag {
                  margin-left: auto;
                  font-size: 12px;
                  opacity: 0.5;
                }

                &:hover {
                  background: rgba(212, 175, 55, 0.15);
                  color: white;
                }
              }
            }

            .empty-state {
              padding: 20px;
              text-align: center;
              color: #888;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>