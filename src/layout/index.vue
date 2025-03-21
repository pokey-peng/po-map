<script setup lang="ts">
import sidebar from '@/layout/sidebar/sidebar.vue'
import topbar from '@/layout/header/topbar.vue'
</script>

<template>
  <div class="layout">
    <header>
      <topbar />
    </header>
    <main>
      <!--侧边栏-->
      <aside>
        <sidebar />
      </aside>
      <!--主体内容-->
      <section>
        <router-view />
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
header {
  background-color: #fff;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
main {
  display: flex;
  flex: 1;
}
aside {
  width: 200px;
  background-color: #f0f2f5;
}
section {
  flex: 1;
  padding: 20px;
}
</style>
