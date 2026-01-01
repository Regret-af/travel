<template>
  <section class="page">
    <header class="page-header">
      <h1>发布日记</h1>
      <p class="hint">创建新的旅行日记并可关联景点（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 日记创建表单（标题、正文、图片URL列表、关联景点、发布按钮）。</p>
      <p>空状态：尚未填写内容。</p>
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
