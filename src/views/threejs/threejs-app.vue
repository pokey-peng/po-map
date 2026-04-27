<script setup lang="ts">
import { World } from '@/lib/World/World'

const threejsContainer = useTemplateRef<HTMLDivElement>('threejsContainer')
function main() {
  const world = new World(threejsContainer.value!)
  world.start()
}
onMounted(() => {
  main()
})
</script>

<template>
  <div class="threejs-demo">
    <div class="threejs-container bg-[skyblue] wh-full" ref="threejsContainer"></div>
  </div>
</template>
