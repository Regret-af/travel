<template>
  <footer class="site-footer py-20">
    <div class="mx-auto max-w-7xl px-4 md:px-8">
      <div class="hidden gap-10 md:grid md:grid-cols-3">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <svg class="footer-brand-icon h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z" />
            </svg>
            <div>
              <p class="footer-brand-name">旅迹</p>
              <p class="footer-tagline">探索未知，记录精彩</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="footer-section-title mb-3">热门景点</h3>
          <ul class="space-y-2">
            <li v-for="item in destinations" :key="item.label">
              <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="footer-section-title mb-3">站内入口</h3>
          <ul class="space-y-2">
            <li v-for="item in supports" :key="item.label">
              <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col gap-8 md:hidden">
        <div class="flex items-center gap-3">
          <svg class="footer-brand-icon h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z" />
          </svg>
          <div>
            <p class="footer-brand-name">旅迹</p>
            <p class="footer-tagline">探索未知，记录精彩</p>
          </div>
        </div>

        <el-collapse v-model="activeNames" accordion>
          <el-collapse-item name="destinations">
            <template #title>
              <span class="footer-collapse-title">热门景点</span>
            </template>
            <ul class="mt-2 space-y-2 pl-1">
              <li v-for="item in destinations" :key="item.label">
                <RouterLink :to="item.to" class="link">{{ item.label }}</RouterLink>
              </li>
            </ul>
          </el-collapse-item>
          <el-collapse-item name="supports">
            <template #title>
              <span class="footer-collapse-title">站内入口</span>
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
.site-footer {
  background: #f9fafb;
  color: var(--color-text-muted);
}

.footer-brand-icon {
  color: var(--color-brand-iris);
}

.footer-brand-name {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.footer-tagline {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.footer-section-title,
.footer-collapse-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.link {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: 1.7;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-brand-iris);
  }
}
</style>
