<script setup lang="ts">
import { createProgram } from '@/lib/webGL/gl-help'
const canvas = ref<HTMLCanvasElement | null>(null)
const gl = shallowRef<WebGL2RenderingContext | null | undefined>(null)
const init3dGl = () => {
  gl.value = canvas.value?.getContext('webgl2')
  if (!gl.value) {
    console.error('WebGL not supported')
    return
  }
  // Set the viewport size
  gl.value.viewport(0, 0, canvas.value?.width || 0, canvas.value?.height || 0)
  // Clear the color buffer with specified clear color
  gl.value.clearColor(0.0, 0.0, 0.0, 0.0)
  // Clear the color buffer
  gl.value.clear(gl.value.COLOR_BUFFER_BIT)

  const program = createProgram(gl.value) as WebGLProgram

  const positionAttrLoc = gl.value.getAttribLocation(program, 'a_position')
  const positionBuffer = gl.value.createBuffer()
  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer)

  const positions = [0, 0, 0, 0.5, 0.7, 0]
  gl.value.bufferData(gl.value.ARRAY_BUFFER, new Float32Array(positions), gl.value.STATIC_DRAW)

  const vao = gl.value.createVertexArray()
  gl.value.bindVertexArray(vao)
  gl.value.enableVertexAttribArray(positionAttrLoc)
  gl.value.vertexAttribPointer(positionAttrLoc, 2, gl.value.FLOAT, false, 0, 0)
}
onMounted(() => {
  init3dGl()
})
</script>

<template>
  <div class="webgl-demo">
    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>
