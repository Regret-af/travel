<template>
  <div class="app-shell">
    <TheHeader />
    <main class="page-body" :class="{ 'page-body-home': isHomeRoute }">
      <RouterView />
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import TheFooter from './components/layout/TheFooter.vue';
import TheHeader from './components/layout/TheHeader.vue';

const route = useRoute();
const isHomeRoute = computed(() => route.name === 'home');
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.page-body {
  flex: 1;
  padding: 88px 24px 32px;
}

.page-body-home {
  padding-top: 0;
}
</style>
