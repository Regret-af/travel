<template>
  <section class="state-panel" :class="[`state-panel-${variant}`]">
    <div class="state-emblem" />
    <p class="state-eyebrow">{{ eyebrow }}</p>
    <h2 class="state-title">{{ title }}</h2>
    <p class="state-description">{{ description }}</p>

    <div class="state-actions">
      <el-button v-if="actionLabel" type="primary" round @click="$emit('action')">
        {{ actionLabel }}
      </el-button>
      <RouterLink v-if="secondaryLabel && secondaryTo" :to="secondaryTo" class="secondary-link">
        {{ secondaryLabel }}
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  variant: 'empty' | 'error' | 'auth';
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}>();

defineEmits<{
  (event: 'action'): void;
}>();
</script>

<style scoped lang="scss">
.state-panel {
  min-height: 420px;
  padding: 48px 24px;
  border-radius: 32px;
  border: 1px solid rgba(226, 232, 240, 0.82);
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.1), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.state-panel-error {
  background:
    radial-gradient(circle at top, rgba(248, 113, 113, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
}

.state-panel-auth {
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
}

.state-emblem {
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0) 34%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.24) 0%, rgba(212, 175, 55, 0.22) 100%);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.state-panel-error .state-emblem {
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0) 34%),
    linear-gradient(135deg, rgba(248, 113, 113, 0.22) 0%, rgba(251, 191, 36, 0.2) 100%);
}

.state-panel-auth .state-emblem {
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0) 34%),
    linear-gradient(135deg, rgba(34, 211, 238, 0.24) 0%, rgba(99, 102, 241, 0.18) 100%);
}

.state-eyebrow {
  margin: 22px 0 0;
  color: #c79b1d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.state-title {
  margin: 14px 0 0;
  color: #111827;
  font-size: 38px;
  line-height: 1.12;
}

.state-description {
  margin: 16px 0 0;
  max-width: 560px;
  color: #475569;
  font-size: 15px;
  line-height: 1.9;
}

.state-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.secondary-link {
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.25s ease;

  &:hover {
    color: #111827;
  }
}

@media (max-width: 767px) {
  .state-panel {
    min-height: 360px;
    padding: 36px 18px;
    border-radius: 24px;
  }

  .state-title {
    font-size: 30px;
  }

  .state-description {
    font-size: 14px;
    line-height: 1.8;
  }
}
</style>
