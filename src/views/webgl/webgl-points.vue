<script setup lang="ts">
import { createProgram, resizeCanvasToDisplaySize } from '@/lib/webGL/gl-help'
const canvas = ref<HTMLCanvasElement>()

onMounted(() => {
  if (!canvas.value) {
    throw new Error('Canvas element not available')
  }
  const gl = canvas.value?.getContext('webgl2')
  if (!gl) {
    throw new Error('WebGL2 context not available')
  }
  resizeCanvasToDisplaySize(canvas.value)
  gl.viewport(0, 0, canvas.value.width, canvas.value.height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  const program = createProgram(
    gl,
    `#version 300 es
       in vec4 a_Position;
       void main() {
          gl_Position = a_Position;
          gl_PointSize = 10.0;
       }
    `,
    `#version 300 es
       precision highp float;
       uniform vec4 u_Color;
       out vec4 fragColor;
       void main() {
          fragColor = u_Color;
       }
    `,
  )
  const a_Position = gl.getAttribLocation(program, 'a_Position')
  if (a_Position < 0) {
    throw new Error('a_Position attribute not found')
  }
  const a_Buffer = gl.createBuffer()
  if (!a_Buffer) {
    throw new Error('a_Buffer buffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, a_Buffer)


  const u_Color = gl.getUniformLocation(program, 'u_Color')
  if (!u_Color) {
    throw new Error('u_Color uniform not found')
  }
  const gl_Points: number[] = []
  const gl_Colors: number[] = []
  gl.useProgram(program)
  canvas.value.addEventListener('click', (e) => {
    if (!canvas.value) {
      return
    }
    handleClick(e, canvas.value, gl, a_Position, u_Color, gl_Points, gl_Colors)
  })
  // canvas.value.addEventListener('mousemove', (e) => {
  //   if (!canvas.value) {
  //     return
  //   }
  //   handleClick(e, canvas.value, gl, a_Position, u_Color, gl_Points, gl_Colors)
  // })
})

function handleClick(
  e: MouseEvent,
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  a_Position: number,
  u_Color: WebGLUniformLocation,
  gl_Points: number[],
  gl_Colors: number[],
) {
  const rect = canvas.getBoundingClientRect()
  const x = (e.clientX - rect.left - canvas.width / 2) / (canvas.width / 2)
  const y = (canvas.height / 2 - (e.clientY - rect.top)) / (canvas.height / 2)
  gl_Points.push(x, y)
  gl_Colors.push(Math.abs(x), Math.abs(y), Math.random())
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl_Points), gl.STATIC_DRAW)
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(a_Position)
  for (let i = 0;  i< gl_Points.length; i += 2) {
    gl.uniform4f(u_Color, gl_Colors[i], gl_Colors[i + 1], gl_Colors[i + 2], 1)
    // gl.drawArrays(gl.POINTS, i / 2 , 1)
    gl.drawArrays(gl.LINES, i / 2-1, 2)
  }
  //gl.drawArrays(gl.LINES, 0 , gl_Points.length / 2)
}

onUnmounted(() => {
  canvas.value?.remove()
})
</script>

<template>
  <div class="webgl-points">
    <canvas ref="canvas" class="w-full h-full" />
  </div>
</template>

<style lang="scss" scoped></style>
