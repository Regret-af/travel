<template>
  <footer class="bg-[#F9FAFB] py-20 text-gray-500">
    <div class="mx-auto max-w-7xl px-4 md:px-8">
      <!-- Desktop Grid -->
      <div class="hidden gap-10 md:grid md:grid-cols-4">
        <!-- 品牌 -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <svg class="h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z" />
            </svg>
            <div>
              <p class="text-lg font-semibold text-gray-900">Tourism</p>
              <p class="text-sm">探索未知，记录精彩</p>
            </div>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="social-dot" />
            <span class="social-dot" />
            <span class="social-dot" />
          </div>
        </div>

        <!-- 热门目的地 -->
        <div>
          <h3 class="mb-3 text-base font-semibold text-gray-900">热门目的地</h3>
          <ul class="space-y-2">
            <li v-for="item in destinations" :key="item">
              <a href="#" class="link">{{ item }}</a>
            </li>
          </ul>
        </div>

        <!-- 帮助支持 -->
        <div>
          <h3 class="mb-3 text-base font-semibold text-gray-900">帮助支持</h3>
          <ul class="space-y-2">
            <li v-for="item in supports" :key="item">
              <a href="#" class="link">{{ item }}</a>
            </li>
          </ul>
        </div>

        <!-- 订阅 -->
        <div class="flex flex-col gap-3">
          <h3 class="text-base font-semibold text-gray-900">订阅最新旅讯</h3>
          <p class="text-sm">获取灵感、优惠和精选攻略。</p>
          <div class="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">
            <el-input
              v-model="email"
              placeholder="输入邮箱"
              class="flex-1"
              size="large"
              :border="false"
            />
            <el-button type="primary" size="large" round @click="handleSubscribe">订阅</el-button>
          </div>
        </div>
      </div>

      <!-- Mobile Stack -->
      <div class="flex flex-col gap-8 md:hidden">
        <div class="flex items-center gap-3">
          <svg class="h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4zm0 8l9 4-9 4-9-4 9-4z" />
          </svg>
          <div>
            <p class="text-lg font-semibold text-gray-900">Tourism</p>
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
              <span class="text-base font-semibold text-gray-900">热门目的地</span>
            </template>
            <ul class="mt-2 space-y-2 pl-1">
              <li v-for="item in destinations" :key="item">
                <a href="#" class="link">{{ item }}</a>
              </li>
            </ul>
          </el-collapse-item>
          <el-collapse-item name="supports">
            <template #title>
              <span class="text-base font-semibold text-gray-900">帮助支持</span>
            </template>
            <ul class="mt-2 space-y-2 pl-1">
              <li v-for="item in supports" :key="item">
                <a href="#" class="link">{{ item }}</a>
              </li>
            </ul>
          </el-collapse-item>
        </el-collapse>

        <div class="flex flex-col gap-3">
          <h3 class="text-base font-semibold text-gray-900">订阅最新旅讯</h3>
          <p class="text-sm">获取灵感、优惠和精选攻略。</p>
          <div class="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">
            <el-input
              v-model="email"
              placeholder="输入邮箱"
              size="large"
              :border="false"
            />
            <el-button type="primary" size="large" round @click="handleSubscribe">订阅</el-button>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElCollapse, ElCollapseItem, ElInput, ElMessage } from 'element-plus';

const destinations = ['巴黎左岸', '马尔代夫', '瑞士阿尔卑斯', '京都古街', '巴塞罗那'];
const supports = ['帮助中心', '隐私政策', '服务条款'];

const email = ref('');
const activeNames = ref<string | string[]>('destinations');

const handleSubscribe = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value || !emailRegex.test(email.value)) {
    ElMessage.warning('请输入正确的邮箱地址');
    return;
  }
  // 模拟 API 调用
  ElMessage.success('订阅成功！感谢关注探索旅讯');
  email.value = '';
};
</script>

<style scoped>
.link {
  color: #6b7280;
  transition: color 0.2s ease;
}

.link:hover {
  color: #6366f1;
}

.social-dot {
  display: inline-block;
  height: 32px;
  width: 32px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  opacity: 0.9;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
}
</style>
