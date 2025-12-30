<template>
  <section class="card">
    <h1>登录</h1>
    <p class="hint">登录后可发布/管理旅行日记与评论。</p>
    <div class="placeholder">
      <p>TODO: 登录表单（账号、密码、提交）。</p>
    </div>
    <RouterLink class="link" to="/auth/register">还没有账号？去注册</RouterLink>
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
