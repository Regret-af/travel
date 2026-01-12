<template>
  <el-drawer v-model="drawerVisible" size="35%" :with-header="false" direction="rtl" class="auth-drawer">
    <div class="hero">
      <img :src="heroImage" alt="旅行背景" />
      <div class="slogan">让远方成为日常</div>
    </div>

    <div class="content">
      <div class="mode-header">
        <h3 class="headline">{{ isLogin ? '欢迎回来' : '开启下一段旅程' }}</h3>
        <p class="subline">登录或注册，开启你的专属旅行灵感。</p>
      </div>

      <div class="form">
        <div v-if="!isLogin" class="field">
          <label>用户名</label>
          <el-input v-model="form.username" class="auth-input" placeholder="输入用户名" />
        </div>

        <div class="field">
          <label>邮箱</label>
          <el-input v-model="form.email" class="auth-input" placeholder="name@example.com" />
        </div>

        <div class="field">
          <label>密码</label>
          <el-input v-model="form.password" class="auth-input" placeholder="至少 6 位" show-password type="password" />
        </div>

        <div v-if="isLogin" class="forgot">忘记密码？</div>

        <el-button class="primary-btn" :loading="loading" :disabled="loading" @click="handleSubmit">
          {{ isLogin ? '登录' : '注册' }}
        </el-button>
      </div>

      <div class="mode-switch">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <button type="button" @click="toggleMode">{{ isLogin ? '立即注册' : '去登录' }}</button>
      </div>

      <div class="socials">
        <span class="social-label">第三方登录</span>
        <div class="icons">
          <button class="social-btn" type="button" aria-label="微信登录">
            <el-icon>
              <svg viewBox="0 0 1024 1024">
                <path
                  d="M382 222c-109 0-198 73-198 163 0 49 27 94 72 126l-16 48 61-26c25 7 52 11 81 11 109 0 198-73 198-163S491 222 382 222z"
                  fill="currentColor"
                />
                <path
                  d="M664 402c-93 0-169 63-169 140 0 42 23 81 61 108l-13 41 52-22c21 6 44 9 69 9 93 0 169-63 169-140S757 402 664 402z"
                  fill="currentColor"
                />
              </svg>
            </el-icon>
          </button>
          <button class="social-btn" type="button" aria-label="GitHub 登录">
            <el-icon>
              <svg viewBox="0 0 1024 1024">
                <path
                  d="M512 64C264.6 64 64 265.2 64 513.5c0 198.8 128.7 367.4 307.1 426.9 22.4 4.2 30.6-9.8 30.6-21.7 0-10.7-.4-39-0.6-76.5-125 27.2-151.4-60.3-151.4-60.3-20.4-52.1-49.8-66-49.8-66-40.7-27.9 3.1-27.3 3.1-27.3 45 3.2 68.7 46.6 68.7 46.6 40 69 104.9 49.1 130.5 37.6 4-29.1 15.6-49 28.4-60.2-99.9-11.4-204.9-50.1-204.9-223.1 0-49.3 17.6-89.6 46.5-121.2-4.6-11.4-20.1-57.4 4.5-119.6 0 0 37.9-12.2 124.2 46.3 36-10 74.6-15 112.9-15.2 38.3 0.2 76.9 5.2 112.9 15.2 86.2-58.5 124-46.3 124-46.3 24.7 62.2 9.2 108.2 4.5 119.6 28.9 31.6 46.4 71.9 46.4 121.2 0 173.4-105.2 211.5-205.5 222.7 16.1 13.9 30.5 41.5 30.5 83.7 0 60.4-0.5 109.1-0.5 124 0 12 8 26.1 30.8 21.7 178.2-59.6 306.8-228.2 306.8-426.9C960 265.2 759.4 64 512 64z"
                  fill="currentColor"
                />
              </svg>
            </el-icon>
          </button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import 'element-plus/theme-chalk/el-message.css';
import { login, register } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/api/auth';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const authStore = useAuthStore();
const isLogin = ref(true);
const loading = ref(false);

const form = reactive({
  username: '',
  email: '',
  password: ''
});

const heroImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toggleMode = () => {
  isLogin.value = !isLogin.value;
};

const validateForm = () => {
  if (!isLogin.value && !form.username.trim()) {
    ElMessage.warning('请输入用户名');
    return false;
  }
  if (!emailRegex.test(form.email.trim())) {
    ElMessage.warning('请输入有效邮箱');
    return false;
  }
  if (form.password.trim().length < 6) {
    ElMessage.warning('密码长度至少 6 位');
    return false;
  }
  return true;
};

const extractAuth = (payload: { accessToken?: string; token?: string; user?: AuthUser }) => {
  const token = payload.accessToken || payload.token || '';
  const user = payload.user || null;
  return { token, user };
};

const handleSubmit = async () => {
  if (!validateForm() || loading.value) return;
  loading.value = true;

  try {
    if (isLogin.value) {
      const res = await login({ account: form.email.trim(), password: form.password.trim() });
      const { token, user } = extractAuth(res.data || {});
      if (!token) {
        ElMessage.error('登录失败，请稍后再试');
        return;
      }
      authStore.setAuth(token, user);
      ElMessage.success('登录成功');
      drawerVisible.value = false;
    } else {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim()
      });
      ElMessage.success('注册成功，请登录');
      isLogin.value = true;
    }
  } catch (error) {
    if (isLogin.value) {
      console.error('登录失败，请检查用户名和密码', error);
    } else {
      console.error('注册失败，请稍后再试', error);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
$gold: #d4af37;

.auth-drawer {
  :deep(.el-drawer) {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
  }

  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.hero {
  position: relative;
  height: 200px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.55));
  }

  .slogan {
    position: absolute;
    bottom: 18px;
    left: 20px;
    z-index: 2;
    color: $gold;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.2em;
  }
}

.content {
  padding: 28px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mode-header {
  .headline {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 6px;
    color: #111827;
  }

  .subline {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      color: #6b7280;
      font-size: 13px;
    }
  }
}

.auth-input {
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
    border-bottom: 2px solid #e5e7eb;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-bottom-color: $gold;
  }

  :deep(.el-input__inner) {
    padding: 10px 0 8px;
    color: #111827;
  }
}

.forgot {
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
}

.primary-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  background: #1a1a1a;
  color: #ffffff;
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: $gold;
    color: #1a1a1a;
  }
}

.mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;

  button {
    border: none;
    background: none;
    color: $gold;
    font-weight: 600;
    cursor: pointer;
  }
}

.socials {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .social-label {
    font-size: 12px;
    color: #9ca3af;
  }

  .icons {
    display: flex;
    gap: 12px;
  }

  .social-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.8);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: $gold;
      color: $gold;
    }

    :deep(svg) {
      width: 22px;
      height: 22px;
    }
  }
}

@media (max-width: 1200px) {
  .auth-drawer {
    :deep(.el-drawer) {
      width: 100% !important;
    }
  }
}
</style>
