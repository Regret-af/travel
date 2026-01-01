<template>
  <section class="card">
    <h1>注册</h1>
    <p class="hint">创建账号以保存偏好并发布你的旅行日记。</p>
    <div class="placeholder">
      <p>TODO: 注册表单（昵称、邮箱/手机、密码、提交）。</p>
    </div>
    <RouterLink class="link" to="/auth/login">已有账号？去登录</RouterLink>
  </section>
</template>

<style scoped>
.card {
  width: min(480px, 90vw);
  padding: 24px;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
}

.hint {
  color: #6b7280;
  margin: 6px 0 16px;
}

.placeholder {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 16px;
  background-color: #f8fafc;
  color: #475569;
}

.link {
  display: inline-block;
  margin-top: 16px;
  color: #0369a1;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
