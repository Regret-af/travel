<template>
  <section class="page">
    <header class="page-header">
      <h1>景点列表</h1>
      <p class="hint">展示可浏览的景点，支持搜索与排序（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 景点列表、分页与排序控件。</p>
      <p>空状态：当前暂无景点数据。</p>
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
