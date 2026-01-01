<template>
  <section class="page">
    <header class="page-header">
      <h1>我的日记</h1>
      <p class="hint">管理已发布的日记，支持查看与删除（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 我的日记列表、删除/跳转详情操作。</p>
      <p>空状态：你还没有发布任何日记。</p>
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
