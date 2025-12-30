<template>
  <section class="page">
    <h1>页面走丢了 (404)</h1>
    <p class="hint">无法找到请求的内容，请检查链接或返回首页。</p>
    <RouterLink class="link" to="/spots">返回景点列表</RouterLink>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background-color: #f8fafc;
  color: #475569;
}

.hint {
  margin: 0;
}

.link {
  color: #0369a1;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
