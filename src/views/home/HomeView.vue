<template>
  <div class="home-page">
    <HomeHero />
    <CuratedDestinations />
    <TravelerDiaries />
    <GlobalInsight />
  </div>
</template>

<script setup lang="ts">
import CuratedDestinations from '@/components/home/CuratedDestinations.vue';
import GlobalInsight from '@/components/home/GlobalInsight.vue';
import HomeHero from '@/components/home/HomeHero.vue';
import TravelerDiaries from '@/components/home/TravelerDiaries.vue';
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  margin: 0 auto;
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
