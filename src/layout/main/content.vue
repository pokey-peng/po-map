<script setup lang="ts">
const aliveList = ref(['MapContainer', 'webgl-demo'])
</script>

<template>
  <section class="content flex-1 p-4 overflow-auto bg-gray-4 relative">
    <router-view v-slot="{ Component }" class="w-full h-full">
      <keep-alive :include="aliveList">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </section>
</template>
