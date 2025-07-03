<script setup lang="ts">
import {
  createProgram,
  resizeCanvasToDisplaySize,
  drawRectangle,
  createAndSetupTexture,
  loadImages,
  drawCube,
} from '@/lib/webGL/gl-help'
import { M3, M4 } from '@/lib/webGL/m3'
const canvas = ref<HTMLCanvasElement | null>(null)
let gl: WebGL2RenderingContext | null | undefined = null

const translate = reactive({ x: 0, y: 0, z: 0 })
const scale = reactive({ x: 1, y: 1, z: 1 })
const rotation = ref({
  x: 0,
  y: 0,
  z: 0,
})
const imgList: HTMLImageElement[] = []
let positionBuffer2: WebGLBuffer | null = null

let matrixLoc: WebGLUniformLocation | null = null

const getTransformMatrix = (): Float32Array => {
  //console.log('getTransformMatrix', translate, rotation.value, scale)
  let matrix = M4.orthographic(
    0,
    canvas.value?.clientWidth || 0,
    canvas.value?.clientHeight || 0,
    0,
    200, // near: 近裁剪平面距离（小的正值）
    -200, // far: 远裁剪平面距离（大的正值，必须 > near）
  )
  matrix = M4.translate(matrix, translate.x, translate.y, translate.z)
  matrix = M4.rotateX(matrix, (rotation.value.x * Math.PI) / 180)
  matrix = M4.rotateY(matrix, (rotation.value.y * Math.PI) / 180)
  matrix = M4.rotateZ(matrix, (rotation.value.z * Math.PI) / 180)
  matrix = M4.scale(matrix, scale.x, scale.y, scale.z)
  return matrix
}
const init3dGl = () => {
  gl = canvas.value?.getContext('webgl2')
  if (!gl) {
    console.error('WebGL not supported')
    return
  }
  resizeCanvasToDisplaySize(canvas.value as HTMLCanvasElement)
  // Set the viewport size
  gl.viewport(0, 0, canvas.value?.width || 0, canvas.value?.height || 0)
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // 编译着色器
  const program = createProgram(gl) as WebGLProgram

  // 定义绑定点数组
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  // 绑定a_position属到缓冲区
  const positionAttrLoc = gl.getAttribLocation(program, 'a_position')
  const positionBuffer = gl.createBuffer()
  positionBuffer2 = positionBuffer as WebGLBuffer
  // 绑定缓冲区到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2)
  // 开启顶点属性数组，并指定属性从缓冲区读取数据的方式，2 个分量，类型为浮点数，是否归一化，步长，偏移量
  gl.enableVertexAttribArray(positionAttrLoc)
  gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, false, 0, 0)

  const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord')
  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // 前面
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // 后面
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // 左面
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // 右面
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // 底面
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // 顶面
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ]),
    gl.STATIC_DRAW,
  )
  gl.enableVertexAttribArray(texCoordLoc)
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0)

  const textureIndexLoc = gl.getAttribLocation(program, 'a_textureIndex')
  const textureIndexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureIndexBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Int32Array([
      // 前面
      0,
      0,
      0,
      0,
      0,
      0, // 前面纹理索引
      // 后面
      1,
      1,
      1,
      1,
      1,
      1,
      // 左面
      2,
      2,
      2,
      2,
      2,
      2,
      // 右面
      3,
      3,
      3,
      3,
      3,
      3,
      // 底面
      4,
      4,
      4,
      4,
      4,
      4,
      // 顶面
      5,
      5,
      5,
      5,
      5,
      5,
    ]),
    gl.STATIC_DRAW,
  )
  gl.enableVertexAttribArray(textureIndexLoc)
  gl.vertexAttribIPointer(textureIndexLoc, 1, gl.INT, 0, 0)

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.useProgram(program)

  // 设置变换矩阵
  matrixLoc = gl.getUniformLocation(program, 'u_matrix')
  gl.uniformMatrix4fv(matrixLoc, false, getTransformMatrix())

  // 设置纹理
  const imageLoc = gl.getUniformLocation(program, 'u_textureArray[0]')
  const imageLoc1 = gl.getUniformLocation(program, 'u_textureArray[1]')
  const imageLoc2 = gl.getUniformLocation(program, 'u_textureArray[2]')
  const imageLoc3 = gl.getUniformLocation(program, 'u_textureArray[3]')
  const imageLoc4 = gl.getUniformLocation(program, 'u_textureArray[4]')
  const imageLoc5 = gl.getUniformLocation(program, 'u_textureArray[5]')
  gl.uniform1i(imageLoc, 0) // 纹理单元 0
  gl.uniform1i(imageLoc1, 1) // 纹理单元 1
  gl.uniform1i(imageLoc2, 2) // 纹理单元 2
  gl.uniform1i(imageLoc3, 3) // 纹理单元 3
  gl.uniform1i(imageLoc4, 4) // 纹理单元 4
  gl.uniform1i(imageLoc5, 5) // 纹理单元 5

  function getImgUrl(name: string): string {
    return `${window.location.origin}/imgs/${name}`
  }
  const img1 = getImgUrl('ex.jpg')
  const img2 = getImgUrl('face.png')
  const img3 = getImgUrl('child.png')
  const img4 = getImgUrl('man.png')
  const img5 = getImgUrl('simple_abstract.png')
  const img6 = getImgUrl('WuKong.png')
  loadImages([img1, img2, img3, img4, img5, img6]).then((images) => {
    if (!gl) return
    imgList.push(...images)
    const textures = []
    for (let i = 0; i < imgList.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i)
      const texture = createAndSetupTexture(gl)

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgList[i])
      textures.push(texture)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2)
    drawCube(gl, 0, 0, 0, 100, 100, 100) // 将立方体放在 Z=-50 到 Z=50，这样 translate.z=0 时就能看到
    //drawImage()
  })
}
function drawImage() {
  if (!gl) return
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.uniformMatrix4fv(matrixLoc, false, getTransformMatrix())
  drawCube(gl, 0, 0, 0, 100, 100, 100) // 保持一致的立方体位置
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
        <Slider v-model="translate.x" class="w-[50%]" :min="0" :max="1000" />
        <span class="inline-block w-10">{{ translate.x }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">Y</span>
        <Slider v-model="translate.y" class="w-[50%]" :min="0" :max="1000" />
        <span class="inline-block w-10">{{ translate.y }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">Z</span>
        <Slider v-model="translate.z" class="w-[50%]" :min="-300" :max="300" :step="1" />
        <span class="inline-block w-10">{{ translate.z }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">angleX</span>
        <Slider v-model="rotation.x" class="w-[50%]" :min="-360" :max="360" />
        <span class="inline-block w-10">{{ `${rotation.x}°` }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">angleY</span>
        <Slider v-model="rotation.y" class="w-[50%]" :min="-360" :max="360" />
        <span class="inline-block w-10">{{ `${rotation.y}°` }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">angleZ</span>
        <Slider v-model="rotation.z" class="w-[50%]" :min="-360" :max="360" />
        <span class="inline-block w-10">{{ `${rotation.z}°` }}</span>
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
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">scaleZ</span>
        <Slider v-model="scale.z" class="w-[50%]" :min="-5" :max="5" :step="0.01" />
        <span class="inline-block w-10">{{ scale.z }}</span>
      </div>
    </div>
    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>
