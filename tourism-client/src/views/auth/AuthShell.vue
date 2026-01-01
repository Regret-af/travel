<template>
  <div class="auth-shell">
    <RouterView />
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background: radial-gradient(circle at 20% 20%, #f1f5f9 0, transparent 30%),
    radial-gradient(circle at 80% 0%, #e0f2fe 0, transparent 26%),
    #ffffff;
}
</style>
