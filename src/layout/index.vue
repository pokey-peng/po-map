<script setup lang="ts">
import sidebar from '@/layout/sidebar/sidebar.vue'
import topbar from '@/layout/header/topbar.vue'
import content from '@/layout/main/content.vue'
</script>

<template>
  <div class="layout">
    <topbar />
    <main>
      <!--侧边栏-->
      <sidebar />
      <!--主体内容-->
      <content />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

main {
  display: flex;
  flex: 1;
}

section {
  flex: 1;
  padding: 20px;
}
</style>
