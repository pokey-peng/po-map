<script setup lang="ts">
import {
  createProgram,
  resizeCanvasToDisplaySize,
  drawRectangle,
  randomInt,
} from '@/lib/webGL/gl-help'
const canvas = ref<HTMLCanvasElement | null>(null)
const gl = shallowRef<WebGL2RenderingContext | null | undefined>(null)
const init3dGl = () => {
  gl.value = canvas.value?.getContext('webgl2')
  if (!gl.value) {
    console.error('WebGL not supported')
    return
  }
  resizeCanvasToDisplaySize(canvas.value as HTMLCanvasElement)
  // Set the viewport size
  gl.value.viewport(0, 0, canvas.value?.width || 0, canvas.value?.height || 0)
  // Clear the color buffer with specified clear color
  gl.value.clearColor(0.0, 0.0, 0.0, 0.0)
  // Clear the color buffer
  gl.value.clear(gl.value.COLOR_BUFFER_BIT)

  // 编译着色器
  const program = createProgram(gl.value) as WebGLProgram

  // 绑定a_position属到缓冲区
  const positionAttrLoc = gl.value.getAttribLocation(program, 'a_position')
  const positionBuffer = gl.value.createBuffer()

  // 定义绑定点数组
  const vao = gl.value.createVertexArray()
  gl.value.bindVertexArray(vao)
  gl.value.enableVertexAttribArray(positionAttrLoc)
  gl.value.vertexAttribPointer(positionAttrLoc, 2, gl.value.FLOAT, false, 0, 0)

  gl.value.useProgram(program)
  gl.value.bindVertexArray(vao)

  const colorAttrLoc = gl.value.getAttribLocation(program, 'a_color')
  const colorBuffer = gl.value.createBuffer()
  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, colorBuffer)
  gl.value.enableVertexAttribArray(colorAttrLoc)
  gl.value.vertexAttribPointer(colorAttrLoc, 4, gl.value.FLOAT, false, 0, 0)

  // 设置分辨率，转化像素坐标到WebGL坐标
  const resolutionUniformLoc = gl.value.getUniformLocation(program, 'u_resolution')
  gl.value.uniform2f(resolutionUniformLoc, canvas.value?.width || 0, canvas.value?.height || 0)

  for (let i = 0; i < 100; i++) {
    const x = randomInt(canvas.value?.width || 0)
    const y = randomInt(canvas.value?.height || 0)
    const width = randomInt(50)
    const height = randomInt(50)
    const color1 = [Math.random(), Math.random(), Math.random(), 1]
    const color2 = [Math.random(), Math.random(), Math.random(), 1]
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, colorBuffer)
    gl.value.bufferData(
      gl.value.ARRAY_BUFFER,
      new Float32Array([...color1, ...color1, ...color1, ...color2, ...color2, ...color2]),
      gl.value.STATIC_DRAW,
    )
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer)
    drawRectangle(gl.value, program, x, y, width, height, [
      Math.random(),
      Math.random(),
      Math.random(),
      1,
    ])
  }
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
