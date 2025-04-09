<script setup lang="ts">
const route = useRoute()
const activeMenu = computed(() => {
  // 获取当前路由的path,并与菜单项的path进行匹配
  const matched = menus.value
    .flatMap((menu) => menu.items)
    .find((item) => item.route === route.path)
  return matched ? matched.label : ''
})
const menus = ref([
  {
    label: 'Map',
    icon: 'i-mdi-map text-green-500',
    key: 'Map',
    items: [
      { label: 'Mapbox GL', icon: 'i-mdi-map-marker', route: '/map' },
      { label: 'webgl', icon: 'i-mdi-cube-outline', route: '/webgl-demo' },
      { label: 'Three.js', icon: 'i-mdi-rotate-3d', route: '/threejs-demo' },
    ],
  },
  {
    label: 'Dashboard',
    icon: 'i-mdi-view-dashboard text-blue-500',
    key: 'Dashboard',
    items: [
      {
        label: 'About',
        icon: 'i-mdi-information',
        route: '/about',
      },
    ],
  },
])
const expandedKeys = ref({
  Map: true,
  Dashboard: false,
})
</script>

<template>
  <aside class="p-2 shadow-lg h-full">
    <PanelMenu :model="menus" multiple v-model:expanded-keys="expandedKeys">
      <template #item="{ item }">
        <router-link
          v-if="item.route"
          v-slot="{ isActive, href, navigate }"
          :to="item.route"
          custom
        >
          <a
            class="flex items-center cursor-pointer px-4 py-2 transition-colors duration-200 ease-in-out rounded-lg hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-slate-800 dark:hover:text-primary-400"
            :class="{
              'bg-primary-50 text-primary-600 font-medium dark:bg-slate-800 dark:text-primary-400':
                isActive,
            }"
            @click="navigate"
            :href="href"
          >
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }}</span>
          </a>
        </router-link>
        <a
          v-else
          class="flex items-center cursor-pointer px-4 py-2 transition-colors duration-200 ease-in-out rounded-lg hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-slate-800 dark:hover:text-primary-400"
        >
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <!--菜单展开收起图标 material icon-->
          <i
            v-if="item.items"
            class="i-mdi-chevron-right text-sm ml-auto"
            :class="{ 'rotate-90': !item.expand }"
          ></i>
        </a>
      </template>
    </PanelMenu>
  </aside>
</template>

<style lang="scss" scoped>
aside {
  width: 200px;
}
</style>
