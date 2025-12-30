<template>
  <section class="page">
    <header class="page-header">
      <h1>景点列表</h1>
      <p class="hint">展示可浏览的景点，支持搜索与排序（占位）。</p>
    </header>

    <div v-if="loading" class="placeholder">加载中...</div>
    <div v-else-if="error" class="placeholder error">{{ error }}</div>
    <div v-else-if="spots.length === 0" class="placeholder">当前暂无景点数据。</div>
    <div v-else class="grid">
      <article v-for="spot in spots" :key="spot.id" class="card">
        <img class="cover" :src="spot.cover" :alt="spot.name" loading="lazy" />
        <div class="card-body">
          <h3>{{ spot.name }}</h3>
          <p class="city">{{ spot.city }}</p>
          <p class="desc">{{ spot.description }}</p>
          <RouterLink :to="`/spots/${spot.id}`" class="link">查看详情</RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchSpots } from '../../api/spots'
import type { Spot } from '../../types/api'

const spots = ref<Spot[]>([])
const loading = ref(false)
const error = ref('')

const loadSpots = async () => {
  try {
    loading.value = true
    const res = await fetchSpots()
    if (res.code === 0) {
      spots.value = res.data
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = '网络异常或服务不可用'
  } finally {
    loading.value = false
  }
}

onMounted(loadSpots)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0 0 6px;
}

.hint {
  margin: 0;
  color: #6b7280;
}

.placeholder {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 18px;
  background-color: #f8fafc;
  color: #475569;
}

.placeholder.error {
  color: #b91c1c;
  background-color: #fef2f2;
  border-color: #fecaca;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
}

.cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.card-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.city {
  margin: 0;
  color: #0369a1;
  font-weight: 600;
}

.desc {
  margin: 0;
  color: #4b5563;
}

.link {
  color: #0ea5e9;
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}
</style>
