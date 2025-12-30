<template>
  <section class="page">
    <header class="page-header">
      <h1>景点详情</h1>
      <p class="hint">展示景点信息、关联旅记和评论入口（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 景点详情内容、相关推荐、评论列表与发布区。</p>
      <p>空状态：未找到对应景点。</p>
    </div>
  </section>
</template>

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
</style>
