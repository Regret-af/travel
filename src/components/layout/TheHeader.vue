<template>
  <header class="fixed top-0 left-0 z-50 w-full transition-all duration-300" :class="[
    isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent',
    'h-[60px] md:h-20'
  ]">
    <div class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-lg font-bold text-white shadow-lg">
          T
        </div>
        <div class="text-lg font-semibold text-slate-900">旅迹</div>
      </div>

      <nav class="hidden items-center gap-6 text-base text-slate-700 md:flex">
        <el-dropdown trigger="hover">
          <span class="nav-link inline-flex cursor-pointer items-center gap-1">
            景点
            <el-icon class="w-4 h-4">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in destinationItems" :key="item.id" @click="onDestinationClick(item)">
                {{ item.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <RouterLink to="/diaries" class="nav-link">旅行日记</RouterLink>
        <RouterLink to="/attractions" class="nav-link">景点</RouterLink>
      </nav>

      <div class="flex items-center gap-3">
        <div ref="searchWrapperRef"
          class="search-shell hidden md:flex"
          :class="searchOpen ? 'shadow-sm' : ''">
          <el-icon class="h-5 w-5 cursor-pointer text-slate-600" @click.stop="handleSearchIconClick">
            <Search />
          </el-icon>
          <input ref="searchInputRef" type="text" placeholder="快速查找景点..."
            class="w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300"
            :class="searchOpen ? 'w-48 opacity-100' : 'opacity-0 pointer-events-none'"
            v-model="keyword"
            @focus="handleSearchFocus"
            @input="handleSearchInput"
            @keydown.enter.prevent="handleSearchSubmit" />
          <div v-if="showDropdown" class="search-dropdown">
            <ul v-if="searchResults.length" class="result-list">
              <li
                v-for="result in searchResults"
                :key="result.id"
                class="search-item"
                @click="handleSelectResult(result)"
              >
                <span class="result-name">{{ result.name }}</span>
                <span v-if="result.locationText" class="result-location">{{ result.locationText }}</span>
              </li>
            </ul>
            <div v-else-if="searchStatus === 'loading'" class="search-state">
              正在搜索景点...
            </div>
            <div v-else-if="searchStatus === 'error'" class="search-state search-state-error">
              {{ searchErrorMessage }}
            </div>
            <div v-else class="search-state">
              未找到相关景点，请尝试更换关键词
            </div>
          </div>
        </div>

        <template v-if="isLoggedIn">
          <el-popover
            v-if="!isMobile"
            placement="bottom-end"
            trigger="hover"
            :offset="15"
            popper-class="profile-popover"
            :popper-style="{ width: '360px' }"
          >
            <template #reference>
              <el-avatar :size="49" :src="userAvatar" class="cursor-pointer shadow-sm" />
            </template>
            <div class="profile-card">
              <div class="profile-identity">
                <el-avatar :size="64" :src="userAvatar" class="profile-avatar" />
                <div class="profile-name">{{ userName }}</div>
              </div>
              <div class="profile-quick">
                <button
                  v-for="item in quickAccessItems"
                  :key="item.label"
                  class="quick-item"
                  @click="goTo(item.to)"
                >
                  <el-icon class="quick-icon">
                    <component :is="item.icon" />
                  </el-icon>
                  <span class="quick-text">{{ item.label }}</span>
                  <span v-if="item.countLabel" class="quick-count">{{ item.countLabel }}</span>
                </button>
              </div>
              <div class="profile-actions">
                <button class="action-item" @click="goTo('/account')">个人中心</button>
                <button class="action-item action-logout" @click="handleLogout">退出登录</button>
              </div>
            </div>
          </el-popover>
          <el-avatar v-else :size="49" :src="userAvatar" class="cursor-pointer shadow-sm" />
        </template>
        <template v-else>
          <el-button type="primary" round class="hidden md:inline-flex" @click="openAuthDrawer">
            登录 / 注册
          </el-button>
        </template>

        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-700 shadow-sm backdrop-blur-sm md:hidden"
          @click="drawerOpen = true">
          <el-icon class="h-5 w-5">
            <Menu />
          </el-icon>
        </button>
      </div>
    </div>

    <el-drawer v-model="drawerOpen" :with-header="false" size="80%" custom-class="glass-drawer">
      <div class="flex flex-col gap-4 pt-4">
        <div class="flex items-center justify-between px-2">
          <div class="text-lg font-semibold text-slate-900">导航</div>
          <el-icon class="h-6 w-6 cursor-pointer text-slate-700" @click="openMobileSearch">
            <Search />
          </el-icon>
        </div>
        <div v-if="drawerSearchVisible" ref="mobileSearchWrapperRef" class="mobile-search-shell px-2">
          <div class="mobile-search-box">
            <el-icon class="h-5 w-5 text-slate-500">
              <Search />
            </el-icon>
            <input
              ref="mobileSearchInputRef"
              v-model="keyword"
              type="text"
              placeholder="搜索景点名称..."
              class="mobile-search-input"
              @focus="handleSearchFocus"
              @input="handleSearchInput"
              @keydown.enter.prevent="handleSearchSubmit"
            />
          </div>
          <div v-if="showDropdown" class="mobile-search-dropdown">
            <ul v-if="searchResults.length" class="result-list">
              <li
                v-for="result in searchResults"
                :key="result.id"
                class="search-item"
                @click="handleSelectResult(result)"
              >
                <span class="result-name">{{ result.name }}</span>
                <span v-if="result.locationText" class="result-location">{{ result.locationText }}</span>
              </li>
            </ul>
            <div v-else-if="searchStatus === 'loading'" class="search-state">
              正在搜索景点...
            </div>
            <div v-else-if="searchStatus === 'error'" class="search-state search-state-error">
              {{ searchErrorMessage }}
            </div>
            <div v-else class="search-state">
              未找到相关景点，请尝试更换关键词
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3 px-2 text-base text-slate-800">
          <button class="mobile-link text-left" @click="goTo('/attractions')">景点</button>
          <button
            v-for="item in destinationItems.slice(0, 4)"
            :key="item.id"
            class="mobile-link text-left"
            @click="onDestinationClick(item); drawerOpen = false"
          >
            {{ item.name }}
          </button>
          <RouterLink to="/diaries" class="mobile-link" @click="drawerOpen = false">
            旅行日记
          </RouterLink>
          <RouterLink to="/attractions" class="mobile-link" @click="drawerOpen = false">
            景点
          </RouterLink>
        </div>
        <div class="px-2 pt-2">
          <template v-if="isLoggedIn">
            <div class="flex items-center gap-3">
              <el-avatar :size="42" :src="userAvatar" />
              <div>
                <div class="font-semibold text-slate-900">欢迎回来</div>
                <div class="text-sm text-slate-500">进入个人中心</div>
              </div>
            </div>
            <div v-if="isMobile" class="mobile-profile">
              <div class="profile-quick">
                <button
                  v-for="item in quickAccessItems"
                  :key="item.label"
                  class="quick-item"
                  @click="goTo(item.to)"
                >
                  <el-icon class="quick-icon">
                    <component :is="item.icon" />
                  </el-icon>
                  <span class="quick-text">{{ item.label }}</span>
                  <span v-if="item.countLabel" class="quick-count">{{ item.countLabel }}</span>
                </button>
              </div>
              <div class="profile-actions">
                <button class="action-item" @click="goTo('/account')">个人中心</button>
                <button class="action-item action-logout" @click="handleLogout">退出登录</button>
              </div>
            </div>
          </template>
          <template v-else>
            <el-button type="primary" round class="w-full" @click="openAuthDrawer">登录 / 注册</el-button>
          </template>
        </div>
      </div>
    </el-drawer>

    <AuthDrawer v-model="authDrawerOpen" />
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowDown, Menu, Search, StarFilled, Notebook } from '@element-plus/icons-vue';
import debounce from 'lodash-es/debounce';
import { useAuthStore } from '@/stores/auth';
import {
  getAttractionCategories,
  searchAttractionsByQuery,
  type AttractionCard,
  type AttractionCategory
} from '@/api/attractions';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';

const isScrolled = ref(false);
const searchOpen = ref(false);
const drawerOpen = ref(false);
const drawerSearchVisible = ref(false);
const authDrawerOpen = ref(false);
const isMobile = ref(false);
const destinationItems = ref<AttractionCategory[]>([]);
const keyword = ref('');
const searchResults = ref<AttractionCard[]>([]);
const searchStatus = ref<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
const searchErrorMessage = ref('');
const authStore = useAuthStore();
const router = useRouter();
const isLoggedIn = computed(() => Boolean(authStore.token));
const userAvatar = computed(() => authStore.user?.avatarUrl);
const userName = computed(() => authStore.user?.nickname || authStore.user?.username || '旅行者');
const searchInputRef = ref<HTMLInputElement | null>(null);
const mobileSearchInputRef = ref<HTMLInputElement | null>(null);
const mobileSearchWrapperRef = ref<HTMLElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);
let searchFetchSequence = 0;
const quickAccessItems = [
  { label: '个人中心', countLabel: '入口', icon: StarFilled, to: '/account' },
  { label: '旅行日记', countLabel: '列表', icon: Notebook, to: '/diaries' }
];
const showDropdown = computed(
  () =>
    keyword.value.trim().length > 0 &&
    (searchOpen.value || drawerSearchVisible.value) &&
    ['loading', 'success', 'empty', 'error'].includes(searchStatus.value)
);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const openSearch = () => {
  searchOpen.value = true;
  nextTick(() => searchInputRef.value?.focus());
};

const collapseSearch = () => {
  searchOpen.value = false;
  drawerSearchVisible.value = false;
};

const resetSearchState = () => {
  searchResults.value = [];
  searchStatus.value = 'idle';
  searchErrorMessage.value = '';
};

const doSearch = debounce(async () => {
  const value = keyword.value.trim();

  if (!value) {
    resetSearchState();
    return;
  }

  const requestId = ++searchFetchSequence;
  searchStatus.value = 'loading';
  searchErrorMessage.value = '';

  try {
    const res = await searchAttractionsByQuery(value, { skipErrorToast: true });

    if (requestId !== searchFetchSequence) return;

    searchResults.value = res.data.list || [];
    searchStatus.value = searchResults.value.length ? 'success' : 'empty';
  } catch (error) {
    if (requestId !== searchFetchSequence) return;

    console.error('头部景点搜索失败', error);
    searchResults.value = [];
    searchStatus.value = 'error';
    searchErrorMessage.value = '搜索建议加载失败，请稍后重试。';
  }
}, 250);

const handleSearchFocus = () => {
  if (!searchOpen.value && !isMobile.value) {
    searchOpen.value = true;
  }

  if (keyword.value.trim()) {
    doSearch();
  }
};

const handleSearchInput = () => {
  if (keyword.value.trim()) {
    doSearch();
    return;
  }

  resetSearchState();
};

const handleSearchSubmit = () => {
  const value = keyword.value.trim();

  if (!value) return;

  collapseSearch();
  drawerOpen.value = false;
  router.push({
    path: '/attractions',
    query: { keyword: value }
  });
  keyword.value = value;
};

const handleSelectResult = (result: AttractionCard) => {
  collapseSearch();
  drawerOpen.value = false;
  keyword.value = result.name;
  router.push(`/attractions/${result.id}`);
};

const handleSearchIconClick = () => {
  if (!searchOpen.value) {
    openSearch();
    return;
  }

  handleSearchSubmit();
};

const openMobileSearch = () => {
  drawerSearchVisible.value = true;
  nextTick(() => mobileSearchInputRef.value?.focus());
};

const openAuthDrawer = () => {
  authDrawerOpen.value = true;
  drawerOpen.value = false;
};

const goTo = (path: string) => {
  router.push(path);
  drawerOpen.value = false;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/');
  drawerOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;

  if (searchWrapperRef.value && searchWrapperRef.value.contains(target)) {
    return;
  }

  if (mobileSearchWrapperRef.value && mobileSearchWrapperRef.value.contains(target)) {
    return;
  }

  if (searchOpen.value || drawerSearchVisible.value) {
    collapseSearch();
  }
};

const syncAuthUser = async () => {
  if (!authStore.token) return;

  try {
    await authStore.fetchMe();
  } catch (error) {
    console.error('获取用户信息失败', error);
  }
};

const loadDestinationItems = async () => {
  try {
    const res = await getAttractionCategories({ skipErrorToast: true });
    destinationItems.value = res.data || [];
  } catch (error) {
    console.error('获取景点分类失败', error);
    destinationItems.value = [];
  }
};

const onDestinationClick = (item: AttractionCategory) => {
  router.push({
    path: '/attractions',
    query: {
      categoryId: item.id
    }
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', updateIsMobile);
  document.addEventListener('click', handleClickOutside);
  handleScroll();
  updateIsMobile();
  syncAuthUser();
  loadDestinationItems();
});

watch(
  () => authStore.token,
  (token) => {
    if (token && !authStore.user) {
      syncAuthUser();
    }
  }
);

watch(drawerOpen, (visible) => {
  if (!visible) {
    drawerSearchVisible.value = false;
  }
});

onUnmounted(() => {
  doSearch.cancel();
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', updateIsMobile);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.nav-link {
  position: relative;
  font-weight: 500;
  padding: 0.25rem 0;
  transition: color 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -6px;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #22d3ee, #6366f1);
    transform: translateX(-50%) scaleX(0);
    transform-origin: center;
    transition: transform 0.25s ease;
  }

  &:hover {
    color: #0f172a;

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }
}

.glass-drawer {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(16px);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.search-shell {
  position: relative;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgb(226 232 240);
  background: rgb(255 255 255 / 0.7);
  padding: 0.25rem 0.75rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.search-dropdown,
.mobile-search-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 10px);
  z-index: 80;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

.mobile-search-shell {
  position: relative;
}

.mobile-search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.92);
  padding: 0.75rem 0.875rem;
}

.mobile-search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 0.95rem;
  outline: none;
}

.result-list {
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(248, 250, 252, 0.95);
  }
}

.result-name {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
}

.result-location {
  color: #64748b;
  font-size: 0.8rem;
}

.search-state {
  padding: 1rem;
  color: #64748b;
  font-size: 0.875rem;
  text-align: center;
}

.search-state-error {
  color: #dc2626;
}

.mobile-link {
  display: block;
  padding: 0.4rem 0.6rem;
  border-radius: 0.65rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #0f172a;
  }
}

.profile-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;

  .profile-avatar {
    border: 2px solid #d4af37;
  }

  .profile-name {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
}

.profile-quick {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 14px;
  color: #4b5563;
  transition: all 0.2s ease;

  .quick-icon {
    color: #9ca3af;
  }

  &:hover {
    background: #fdfbf7;
    color: #d4af37;

    .quick-icon {
      color: #d4af37;
    }
  }
}

.profile-actions {
  border-top: 1px solid rgba(243, 244, 246, 0.5);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .action-item {
    text-align: left;
    color: #374151;
    transition: color 0.2s ease, background 0.2s ease;
    padding: 6px 8px;
    border-radius: 10px;

    &:hover {
      background: #fdfbf7;
      color: #d4af37;
    }
  }

  .action-logout {
    color: #9ca3af;

    &:hover {
      color: #f87171;
      background: transparent;
    }
  }
}

.mobile-profile {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

:deep(.el-dropdown),
:deep(.el-tooltip__trigger) {
  font-size: inherit;
  line-height: inherit;
}
</style>
