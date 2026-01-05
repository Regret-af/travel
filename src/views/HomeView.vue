<template>
  <div class="home-page">
    <HomeHero />
    <CuratedDestinations />
    <TravelerDiaries />
    <GlobalInsight />
    <section class="home">
      <h1>Tourism Client</h1>
      <p class="lead">高级旅游官网</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import HomeHero from '../components/home/HomeHero.vue';
import CuratedDestinations from '@/components/home/CuratedDestinations.vue';
import TravelerDiaries from '@/components/home/TravelerDiaries.vue';
import GlobalInsight from '@/components/home/GlobalInsight.vue';
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
