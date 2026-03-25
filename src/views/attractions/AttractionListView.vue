<template>
  <div class="attractions-page">
    <section class="page-hero">
      <p class="eyebrow">景点探索</p>
      <div class="hero-row">
        <div class="hero-copy">
          <h1>把下一站目的地放进视野里</h1>
          <p>
            浏览真实景点内容，按关键词或分类快速定位想去的地方。
          </p>
        </div>

        <div class="search-panel">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索景点名称或摘要"
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <el-button type="primary" round class="search-btn" @click="handleSearch">
            搜索景点
          </el-button>
        </div>
      </div>

      <div v-if="categories.length" class="category-strip">
        <button
          class="category-chip"
          :class="{ active: !currentCategoryId }"
          @click="handleCategoryChange('')"
        >
          全部
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-chip"
          :class="{ active: currentCategoryId === category.id }"
          @click="handleCategoryChange(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </section>

    <section class="list-section" v-loading="loading">
      <div class="section-head">
        <div>
          <p class="section-subtitle">景点列表</p>
          <h2>已加载 {{ total }} 个目的地</h2>
        </div>
        <span class="section-meta">第 {{ currentPage }} / {{ totalPages || 1 }} 页</span>
      </div>

      <div v-if="items.length" class="card-grid">
        <div v-for="item in items" :key="item.id" class="card-item">
          <AttractionCard :item="item" :to="`/attractions/${item.id}`" />
        </div>
      </div>

      <div v-else-if="listError && !loading" class="state-card">
        <h3>景点列表加载失败</h3>
        <p>{{ listError }}</p>
        <el-button round @click="fetchList">重新加载</el-button>
      </div>

      <div v-else-if="!loading" class="state-card">
        <h3>暂未找到符合条件的景点</h3>
        <p>可以尝试更换关键词，或切换到其他景点分类。</p>
        <el-button round @click="resetFilters">查看全部景点</el-button>
      </div>

      <div v-if="totalPages > 1" class="pagination-wrap">
        <el-pagination
          background
          layout="prev, pager, next"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import AttractionCard from '@/components/attraction/AttractionCard.vue';
import {
  getAttractionCategories,
  searchAttractions,
  type AttractionCard as AttractionCardType,
  type AttractionCategory
} from '@/api/attractions';

const router = useRouter();
const route = useRoute();
const pageSize = 9;

const loading = ref(false);
const items = ref<AttractionCardType[]>([]);
const categories = ref<AttractionCategory[]>([]);
const searchKeyword = ref('');
const currentKeyword = ref('');
const currentCategoryId = ref('');
const currentPage = ref(1);
const total = ref(0);
const totalPages = ref(0);
const listError = ref('');

const normalizedRoute = computed(() => {
  const routePage = Number(route.query.page || 1);
  return {
    keyword: String(route.query.keyword || '').trim(),
    categoryId: String(route.query.categoryId || '').trim(),
    page: Number.isFinite(routePage) && routePage > 0 ? routePage : 1
  };
});

const syncFromRoute = async () => {
  currentKeyword.value = normalizedRoute.value.keyword;
  currentCategoryId.value = normalizedRoute.value.categoryId;
  currentPage.value = normalizedRoute.value.page;
  searchKeyword.value = normalizedRoute.value.keyword;
  await fetchList();
};

const fetchList = async () => {
  loading.value = true;
  listError.value = '';
  try {
    const res = await searchAttractions({
      keyword: currentKeyword.value || undefined,
      categoryId: currentCategoryId.value || undefined,
      pageNum: currentPage.value,
      pageSize,
      sort: 'hot'
    });

    items.value = res.data.list;
    total.value = res.data.total;
    totalPages.value = res.data.pages;
  } catch (error) {
    console.error('Failed to load attractions', error);
    items.value = [];
    total.value = 0;
    totalPages.value = 0;
    listError.value = '当前无法获取景点列表，请稍后重试。';
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await getAttractionCategories();
    categories.value = res.data;
  } catch (error) {
    console.error('Failed to load attraction categories', error);
    categories.value = [];
  }
};

const updateRoute = (payload: { keyword?: string; categoryId?: string; page?: number }) => {
  const keyword = payload.keyword ?? currentKeyword.value;
  const categoryId = payload.categoryId ?? currentCategoryId.value;
  const page = payload.page ?? currentPage.value;

  router.push({
    path: '/attractions',
    query: {
      ...(keyword ? { keyword } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(page > 1 ? { page: String(page) } : {})
    }
  });
};

const handleSearch = () => {
  updateRoute({
    keyword: searchKeyword.value.trim(),
    page: 1
  });
};

const handleCategoryChange = (categoryId: string) => {
  updateRoute({
    categoryId,
    page: 1
  });
};

const handlePageChange = (page: number) => {
  updateRoute({ page });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetFilters = () => {
  searchKeyword.value = '';
  router.push('/attractions');
};

watch(
  () => route.fullPath,
  () => {
    syncFromRoute();
  },
  { immediate: true }
);

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped lang="scss">
.attractions-page {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: #1f2937;
}

.page-hero {
  padding: 40px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.12), transparent 28%),
    radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.12), transparent 24%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid rgba(226, 232, 240, 0.8);

  .eyebrow {
    margin: 0 0 12px;
    color: #d4af37;
    letter-spacing: 0.18em;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .hero-row {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
    gap: 28px;
    align-items: end;
  }

  .hero-copy {
    h1 {
      margin: 0;
      font-size: 44px;
      line-height: 1.1;
      color: #111827;
      font-weight: 800;
    }

    p {
      margin: 16px 0 0;
      max-width: 620px;
      color: #4b5563;
      font-size: 16px;
      line-height: 1.8;
    }
  }

  .search-panel {
    padding: 18px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 14px;

    .search-input {
      :deep(.el-input__wrapper) {
        min-height: 48px;
        border-radius: 999px;
        box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.9) inset;
      }
    }

    .search-btn {
      align-self: flex-start;
      min-width: 124px;
    }
  }

  .category-strip {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .category-chip {
    padding: 10px 18px;
    border-radius: 999px;
    border: 1px solid rgba(203, 213, 225, 0.9);
    background: rgba(255, 255, 255, 0.85);
    color: #475569;
    transition: all 0.25s ease;

    &.active,
    &:hover {
      background: rgba(212, 175, 55, 0.1);
      border-color: rgba(212, 175, 55, 0.4);
      color: #b38717;
    }
  }
}

.list-section {
  padding: 34px 28px 40px;
  border-radius: 32px;
  background: #fafafa;

  .section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;

    .section-subtitle {
      margin: 0 0 8px;
      color: #d4af37;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
    }

    h2 {
      margin: 0;
      font-size: 30px;
      color: #111827;
      font-weight: 800;
    }

    .section-meta {
      color: #6b7280;
      font-size: 14px;
    }
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }

  .card-item {
    height: 320px;
  }

  .state-card {
    min-height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #6b7280;

    h3 {
      margin: 0 0 8px;
      color: #111827;
      font-size: 28px;
    }

    p {
      margin: 0 0 20px;
      max-width: 420px;
      line-height: 1.7;
    }
  }

  .pagination-wrap {
    margin-top: 28px;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 1024px) {
  .page-hero {
    padding: 32px 24px;

    .hero-row {
      grid-template-columns: 1fr;
    }

    .hero-copy h1 {
      font-size: 36px;
    }
  }

  .list-section {
    .card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

@media (max-width: 640px) {
  .attractions-page {
    gap: 24px;
  }

  .page-hero {
    padding: 24px 18px;
    border-radius: 24px;

    .hero-copy h1 {
      font-size: 30px;
    }

    .search-panel {
      border-radius: 22px;

      .search-btn {
        width: 100%;
        align-self: stretch;
      }
    }
  }

  .list-section {
    padding: 26px 18px 32px;
    border-radius: 24px;

    .section-head {
      flex-direction: column;
      align-items: flex-start;

      h2 {
        font-size: 24px;
      }
    }

    .card-grid {
      grid-template-columns: 1fr;
    }

    .card-item {
      height: 280px;
    }
  }
}
</style>
