<template>
  <section class="page">
    <header class="page-header">
      <h1>日记详情</h1>
      <p class="hint">展示日记内容、关联景点与评论互动（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 日记正文、图片列表、关联景点入口、评论列表与发布区。</p>
      <p>空状态：未找到该日记或已被删除。</p>
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
