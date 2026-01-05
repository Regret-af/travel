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
        <div class="text-lg font-semibold text-slate-900">Tourism</div>
      </div>

      <nav class="hidden items-center gap-6 text-base text-slate-700 md:flex">
        <el-dropdown trigger="hover">
          <span class="nav-link inline-flex cursor-pointer items-center gap-1">
            目的地
            <el-icon class="w-4 h-4">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in destinationItems" :key="item.value" @click="onDestinationClick(item)">
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <RouterLink to="/diaries" class="nav-link">旅行日记</RouterLink>
        <RouterLink to="/about" class="nav-link">关于我们</RouterLink>
      </nav>

      <div class="flex items-center gap-3">
        <div ref="searchWrapperRef"
          class="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 transition-all duration-300 backdrop-blur-sm md:flex"
          :class="searchOpen ? 'shadow-sm' : ''">
          <el-icon class="h-5 w-5 cursor-pointer text-slate-600" @click.stop="openSearch">
            <Search />
          </el-icon>
          <input ref="searchInputRef" type="text" placeholder="搜索目的地或日记..."
            class="w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300"
            :class="searchOpen ? 'w-48 opacity-100' : 'opacity-0 pointer-events-none'" @blur="collapseSearch" />
        </div>

        <template v-if="isLoggedIn">
          <el-avatar :size="36" :src="userAvatar" class="cursor-pointer shadow-sm" />
        </template>
        <template v-else>
          <el-button type="primary" round class="hidden md:inline-flex">
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
          <el-icon class="h-6 w-6 cursor-pointer text-slate-700" @click="openSearch">
            <Search />
          </el-icon>
        </div>
        <div class="flex flex-col gap-3 px-2 text-base text-slate-800">
          <button class="mobile-link text-left" @click="drawerOpen = false">目的地</button>
          <button class="mobile-link text-left" @click="drawerOpen = false">热门</button>
          <button class="mobile-link text-left" @click="drawerOpen = false">海滨</button>
          <button class="mobile-link text-left" @click="drawerOpen = false">山川</button>
          <button class="mobile-link text-left" @click="drawerOpen = false">城市</button>
          <RouterLink to="/diaries" class="mobile-link" @click="drawerOpen = false">
            旅行日记
          </RouterLink>
          <RouterLink to="/about" class="mobile-link" @click="drawerOpen = false">
            关于我们
          </RouterLink>
        </div>
        <div class="px-2 pt-2">
          <template v-if="isLoggedIn">
            <div class="flex items-center gap-3">
              <el-avatar :size="42" :src="userAvatar" />
              <div>
                <div class="font-semibold text-slate-900">欢迎回来</div>
                <div class="text-sm text-slate-500">查看个人主页</div>
              </div>
            </div>
          </template>
          <template v-else>
            <el-button type="primary" round class="w-full">登录 / 注册</el-button>
          </template>
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowDown, Menu, Search } from '@element-plus/icons-vue';
import { getMe } from '../../api/user';

const destinationItems = [
  { label: '热门', value: 'hot' },
  { label: '海滨', value: 'beach' },
  { label: '山川', value: 'mountain' },
  { label: '城市', value: 'city' }
];
const isScrolled = ref(false);
const searchOpen = ref(false);
const drawerOpen = ref(false);
const isLoggedIn = ref(false);
const userAvatar = ref<string | undefined>();
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const openSearch = () => {
  searchOpen.value = true;
  nextTick(() => searchInputRef.value?.focus());
};

const collapseSearch = () => {
  searchOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (!searchOpen.value) return;
  const target = event.target as Node;
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(target)) {
    collapseSearch();
  }
};

const fetchUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    isLoggedIn.value = false;
    userAvatar.value = undefined;
    return;
  }

  try {
    const res = await getMe();
    if (res?.data) {
      isLoggedIn.value = true;
      userAvatar.value = res.data.avatarUrl;
      return;
    }
    isLoggedIn.value = false;
    userAvatar.value = undefined;
  } catch (error) {
    isLoggedIn.value = false;
    userAvatar.value = undefined;
    console.error("获取用户信息失败", error);
  }
};

const onDestinationClick = (item: { label: string; value: string }) => {
  console.log(item.value); // hot / beach / mountain / city
  // 后续你可以：
  // router.push(`/destinations/${item.value}`)
  // 或 emit 事件
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', handleClickOutside);
  handleScroll();
  fetchUser();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
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

:deep(.el-dropdown),
:deep(.el-tooltip__trigger) {
  font-size: inherit;
  line-height: inherit;
}
</style>
