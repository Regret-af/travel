<template>
  <section class="page">
    <header class="page-header">
      <h1>个人资料</h1>
      <p class="hint">展示与编辑昵称、头像和个人简介（占位）。</p>
    </header>
    <div class="placeholder">
      <p>TODO: 资料表单、头像上传占位、保存操作。</p>
      <p>空状态：尚未加载到个人资料。</p>
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
