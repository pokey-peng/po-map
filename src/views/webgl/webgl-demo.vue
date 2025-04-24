<script setup lang="ts">
import {
  createProgram,
  resizeCanvasToDisplaySize,
  drawRectangle,
  createAndSetupTexture,
  loadImages,
} from '@/lib/webGL/gl-help'
import m3 from '@/lib/webGL/m3'
const canvas = ref<HTMLCanvasElement | null>(null)
const gl = shallowRef<WebGL2RenderingContext | null | undefined>(null)

const translate = reactive({ x: 0, y: 0 })
const scale = reactive({ x: 1, y: 1 })
const rotation = ref(0)
const rotationVec = computed(() => {
  return [Math.cos((rotation.value * Math.PI) / 180), Math.sin((rotation.value * Math.PI) / 180)]
})
const rotationText = computed(() => `${rotation.value}°`)
const imgList: HTMLImageElement[] = []
let positionBuffer2: WebGLBuffer = gl.value?.createBuffer() as WebGLBuffer

let matrix2DLoc: WebGLUniformLocation | null = null

const getTransformMatrix = (): Float32Array => {
  const projectionMatrix = m3.projection(canvas.value?.width || 0, canvas.value?.height || 0)
  const translationMatrix = m3.translation(translate.x, translate.y)
  const rotationMatrix = m3.rotation(rotation.value)
  const scaleMatrix = m3.scaling(scale.x, scale.y)
  return m3.multiplyMany(projectionMatrix, translationMatrix, rotationMatrix, scaleMatrix)
}
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
  positionBuffer2 = positionBuffer

  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer)

  // 定义绑定点数组
  const vao = gl.value.createVertexArray()
  gl.value.bindVertexArray(vao)
  gl.value.enableVertexAttribArray(positionAttrLoc)
  gl.value.vertexAttribPointer(positionAttrLoc, 2, gl.value.FLOAT, false, 0, 0)

  const colorAttrLoc = gl.value.getAttribLocation(program, 'a_color')
  const colorBuffer = gl.value.createBuffer()

  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, colorBuffer)
  gl.value.enableVertexAttribArray(colorAttrLoc)
  gl.value.vertexAttribPointer(colorAttrLoc, 4, gl.value.FLOAT, false, 0, 0)

  const texCoordLoc = gl.value.getAttribLocation(program, 'a_texCoord')
  const texCoordBuffer = gl.value.createBuffer()
  gl.value.bindBuffer(gl.value.ARRAY_BUFFER, texCoordBuffer)
  gl.value.bufferData(
    gl.value.ARRAY_BUFFER,
    new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
    gl.value.STATIC_DRAW,
  )
  gl.value.enableVertexAttribArray(texCoordLoc)
  gl.value.vertexAttribPointer(texCoordLoc, 2, gl.value.FLOAT, false, 0, 0)

  gl.value.useProgram(program)

  // 设置分辨率，转化像素坐标到WebGL坐标
  matrix2DLoc = gl.value.getUniformLocation(program, 'u_matrix2D')
  gl.value.uniformMatrix3fv(matrix2DLoc, false, getTransformMatrix())

  const imageLoc = gl.value.getUniformLocation(program, 'u_texture')
  const imageLoc1 = gl.value.getUniformLocation(program, 'u_texture1')
  gl.value.uniform1i(imageLoc, 0)
  gl.value.uniform1i(imageLoc1, 1)

  const img1 = window.location.origin + '/ex.jpg'
  const img2 = window.location.origin + '/face.png'
  loadImages([img1, img2]).then((images) => {
    if (!gl.value) return
    imgList.push(...images)
    const textures = []
    for (let i = 0; i < imgList.length; i++) {
      gl.value.activeTexture(gl.value.TEXTURE0 + i)
      const texture = createAndSetupTexture(gl.value)

      gl.value.texImage2D(
        gl.value.TEXTURE_2D,
        0,
        gl.value.RGBA,
        gl.value.RGBA,
        gl.value.UNSIGNED_BYTE,
        imgList[i],
      )
      textures.push(texture)
    }
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer2)
    drawRectangle(gl.value, 0, 0, 400, 400)
    //drawImage()
  })
}
function drawImage() {
  if (!gl.value) return
  gl.value.clearColor(0, 0, 0, 0)
  gl.value.clear(gl.value.COLOR_BUFFER_BIT | gl.value.DEPTH_BUFFER_BIT)
  // gl.value.viewport(
  //   translate.x as number,
  //   translate.y as number,
  //   canvas.value?.width || 0,
  //   canvas.value?.height || 0,
  // )
  gl.value.uniformMatrix3fv(matrix2DLoc, false, getTransformMatrix())
  const primitiveType = gl.value.TRIANGLES
  const offset = 0
  const count = 6
  gl.value.drawArrays(primitiveType, offset, count)
}
watch(
  () => [translate, rotation, scale],
  () => {
    requestAnimationFrame(() => {
      drawImage()
    })
  },
  { deep: true },
)
onMounted(() => {
  init3dGl()
})
</script>

<template>
  <div class="webgl-demo">
    <div
      class="card absolute right-4 top-4 bg-white flex flex-col gap-4 border-rd-md p-4 w-80 color-black"
    >
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">X</span>
        <Slider v-model="translate.x" class="w-[50%]" :min="0" :max="800" />
        <span class="inline-block w-10">{{ translate.x }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">Y</span>
        <Slider v-model="translate.y" class="w-[50%]" :min="0" :max="800" />
        <span class="inline-block w-10">{{ translate.y }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">angle</span>
        <Slider v-model="rotation" class="w-[50%]" :min="0" :max="360" />
        <span class="inline-block w-10">{{ rotationText }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">scaleX</span>
        <Slider v-model="scale.x" class="w-[50%]" :min="-5" :max="5" :step="0.01" />
        <span class="inline-block w-10">{{ scale.x }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">scaleY</span>
        <Slider v-model="scale.y" class="w-[50%]" :min="-5" :max="5" :step="0.01" />
        <span class="inline-block w-10">{{ scale.y }}</span>
      </div>
    </div>
    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>
