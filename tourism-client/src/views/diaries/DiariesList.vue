<template>
  <section class="page">
    <header class="page-header">
      <h1>旅行日记广场</h1>
      <p class="hint">按时间/热度排序展示日记流（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 日记列表、排序切换、空状态文案。</p>
      <p>空状态：还没有人发布日记，去分享你的旅程吧。</p>
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
