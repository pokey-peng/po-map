<script setup lang="ts">
const menus = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-fw pi-home',
    items: [
      { label: 'Home', icon: 'pi pi-fw pi-home', to: '/' },
      { label: 'About', icon: 'pi pi-fw pi-info', to: '/about' },
    ],
  },
  {
    label: 'Map',
    icon: 'pi pi-fw pi-map',
    items: [{ label: 'Map', icon: 'pi pi-fw pi-map', to: '/map' }],
  },
])
</script>

<template>
  <PanelMenu :model="menus" />
</template>

<style lang="scss" scoped></style>
