<script setup lang="ts">
import { World } from '@/lib/World/World'
import { PerspectiveCamera, MeshStandardMaterial,MeshBasicMaterial, WebGLRenderer, Mesh, Color, BoxGeometry, Scene } from 'three'

const threejsContainer = useTemplateRef<HTMLDivElement>('threejsContainer')
function main() {
  const world = new World(threejsContainer.value!)
  world.render()
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
