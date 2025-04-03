<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null)
const gl = shallowRef<WebGLRenderingContext | null | undefined>(null)
const init3dGl = () => {
  gl.value = canvas.value?.getContext('webgl')
  if (!gl.value) {
    console.error('WebGL not supported')
    return
  }
  // Set the viewport size
  gl.value.viewport(0, 0, canvas.value?.width || 0, canvas.value?.height || 0)
  // Clear the color buffer with specified clear color
  gl.value.clearColor(127.0, 0.0, 0.0, 1.0)
  // Clear the color buffer
  gl.value.clear(gl.value.COLOR_BUFFER_BIT)
}
onMounted(() => {
  init3dGl()
})
</script>

<template>
  <div class="webgl-demo">
    <canvas id="webgl-canvas" class="w-full h-full" ref="canvas"></canvas>
  </div>
</template>
