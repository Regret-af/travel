<template>
  <footer class="bg-[#F9FAFB] py-20 text-gray-500">
    <div class="mx-auto max-w-7xl px-4 md:px-8">
      <div class="hidden gap-10 md:grid md:grid-cols-3">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <svg class="h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z" />
            </svg>
            <div>
              <p class="text-lg font-semibold text-gray-900">旅迹</p>
              <p class="text-sm">探索未知，记录精彩</p>
            </div>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="social-dot" />
            <span class="social-dot" />
            <span class="social-dot" />
          </div>
        </div>

        <div>
          <h3 class="mb-3 text-base font-semibold text-gray-900">热门景点</h3>
          <ul class="space-y-2">
            <li v-for="item in destinations" :key="item.label">
              <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="mb-3 text-base font-semibold text-gray-900">帮助支持</h3>
          <ul class="space-y-2">
            <li v-for="item in supports" :key="item.label">
              <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col gap-8 md:hidden">
        <div class="flex items-center gap-3">
          <svg class="h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z" />
          </svg>
          <div>
            <p class="text-lg font-semibold text-gray-900">旅迹</p>
            <p class="text-sm">探索未知，记录精彩</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="social-dot" />
          <span class="social-dot" />
          <span class="social-dot" />
        </div>

        <el-collapse v-model="activeNames" accordion>
          <el-collapse-item name="destinations">
            <template #title>
              <span class="text-base font-semibold text-gray-900">热门景点</span>
            </template>
            <ul class="mt-2 space-y-2 pl-1">
              <li v-for="item in destinations" :key="item.label">
                <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
              </li>
            </ul>
          </el-collapse-item>
          <el-collapse-item name="supports">
            <template #title>
              <span class="text-base font-semibold text-gray-900">帮助支持</span>
            </template>
            <ul class="mt-2 space-y-2 pl-1">
              <li v-for="item in supports" :key="item.label">
                <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
              </li>
            </ul>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const destinations = [
  { label: '巴黎左岸', to: { path: '/attractions', query: { keyword: '巴黎左岸' } } },
  { label: '马尔代夫', to: { path: '/attractions', query: { keyword: '马尔代夫' } } },
  { label: '瑞士阿尔卑斯', to: { path: '/attractions', query: { keyword: '瑞士阿尔卑斯' } } },
  { label: '京都古街', to: { path: '/attractions', query: { keyword: '京都古街' } } },
  { label: '巴塞罗那', to: { path: '/attractions', query: { keyword: '巴塞罗那' } } }
];

const supports = [
  { label: '景点', to: '/attractions' },
  { label: '旅行日记', to: '/diaries' },
  { label: '个人中心', to: '/account' }
];

const activeNames = ref<string | string[]>('destinations');
</script>

<style scoped lang="scss">
.link {
  color: #6b7280;
  transition: color 0.2s ease;

  &:hover {
    color: #6366f1;
  }
}

.social-dot {
  display: inline-block;
  height: 32px;
  width: 32px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  opacity: 0.9;
}
</style>
