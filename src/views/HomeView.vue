<template>
  <div class="home-page">
    <HomeHero />
    <section class="home">
      <h1>Tourism Client</h1>
      <p class="lead">高级旅游官网</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import HomeHero from '../components/home/HomeHero.vue';
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
}

.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.lead {
  margin-top: 12px;
  color: #4b5563;
}
</style>
