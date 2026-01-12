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
                <div class="profile-badge">资深环球旅行家</div>
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
                  <span class="quick-count">({{ item.count }})</span>
                </button>
              </div>
              <div class="profile-actions">
                <button class="action-item" @click="goTo('/account')">账号设置</button>
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
                  <span class="quick-count">({{ item.count }})</span>
                </button>
              </div>
              <div class="profile-actions">
                <button class="action-item" @click="goTo('/account')">账号设置</button>
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
import { getMe } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import AuthDrawer from '@/components/auth/AuthDrawer.vue';

const destinationItems = [
  { label: '热门', value: 'hot' },
  { label: '海滨', value: 'beach' },
  { label: '山川', value: 'mountain' },
  { label: '城市', value: 'city' }
];
const isScrolled = ref(false);
const searchOpen = ref(false);
const drawerOpen = ref(false);
const authDrawerOpen = ref(false);
const isMobile = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const isLoggedIn = computed(() => Boolean(authStore.token));
const userAvatar = computed(() => authStore.user?.avatarUrl);
const userName = computed(() => authStore.user?.username || '旅行者');
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchWrapperRef = ref<HTMLElement | null>(null);
const quickAccessItems = [
  { label: '我的灵感', count: 12, icon: StarFilled, to: '/inspirations' },
  { label: '旅行日记', count: 8, icon: Notebook, to: '/diaries?mine=1' }
];

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
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/');
  drawerOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (!searchOpen.value) return;
  const target = event.target as Node;
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(target)) {
    collapseSearch();
  }
};

const fetchUser = async () => {
  const token = authStore.token || localStorage.getItem('token');
  if (!token) {
    authStore.clearAuth();
    return;
  }

  try {
    const res = await getMe();
    if (res?.data) {
      authStore.setAuth(token, res.data);
      return;
    }
    authStore.clearAuth();
  } catch (error) {
    authStore.clearAuth();
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
  window.addEventListener('resize', updateIsMobile);
  document.addEventListener('click', handleClickOutside);
  handleScroll();
  updateIsMobile();
  fetchUser();
});

watch(
  () => authStore.token,
  (token) => {
    if (token) {
      fetchUser();
    } else {
      authStore.clearAuth();
    }
  }
);

onUnmounted(() => {
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

  .profile-badge {
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(212, 175, 55, 0.1);
    color: #d4af37;
    font-size: 12px;
    font-weight: 600;
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
