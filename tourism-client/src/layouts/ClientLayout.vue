<template>
  <div class="layout">
    <header class="topbar">
      <div class="brand">Tourism Client</div>
      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item.activeMatch) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

type NavItem = {
  label: string
  to: string
  activeMatch: string
}

const navItems: NavItem[] = [
  { label: '景点', to: '/spots', activeMatch: '/spots' },
  { label: '旅记', to: '/diaries', activeMatch: '/diaries' },
  { label: '我的', to: '/me', activeMatch: '/me' },
]

const route = useRoute()

const isActive = (activeMatch: string) => route.path.startsWith(activeMatch)
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f9fafb 0%, #ffffff 32%);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
}

.brand {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.nav {
  display: flex;
  gap: 12px;
}

.nav-link {
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #1f2937;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-link:hover {
  background-color: #f3f4f6;
}

.nav-link.active {
  background-color: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 24px;
  max-width: 1080px;
  width: 100%;
  margin: 0 auto;
}
</style>
