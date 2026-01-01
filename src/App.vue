<template>
  <div class="app-shell">
    <TheHeader />
    <main class="page-body">
      <RouterView />
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import TheFooter from './components/layout/TheFooter.vue';
import TheHeader from './components/layout/TheHeader.vue';
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
</style>
