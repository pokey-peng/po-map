<script setup lang="ts">
import { PerspectiveCamera, MeshStandardMaterial,MeshBasicMaterial, WebGLRenderer, Mesh, Color, BoxGeometry, Scene } from 'three'

const threejsContainer = ref<HTMLDivElement | null>(null)
function main() {
  const container = threejsContainer.value
  if (!container) return
  const scene = new Scene()
  scene.background = new Color('skyblue')
  const fovY = 75
  const aspect = container.clientWidth / container.clientHeight
  const near = 0.1
  const far = 1000
  const camera = new PerspectiveCamera(fovY, aspect, near, far)
  camera.position.set(0, 0, 5)

  const geometry = new BoxGeometry(2, 2, 2)
  const material = new MeshBasicMaterial({ color: new Color().setRGB(152, 1, 1) })
  const cube = new Mesh(geometry, material)
  scene.add(cube)

  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  function animate() {
    requestAnimationFrame(animate)
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
    renderer.render(scene, camera)
  }
  animate()
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
