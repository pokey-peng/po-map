<script setup lang="ts">
import {
  createProgram,
  resizeCanvasToDisplaySize,
  createAndSetupTexture,
  loadImages,
  drawCube,
  setNormals,
} from '@/lib/webGL/gl-help'
import glUtils from '@/lib/webGL/gl-utils.ts'
import { M4 } from '@/lib/webGL/m3'
// import { gsap } from 'gsap'
// import { twgl } from '@/lib/webGL/twgl.ts'
const canvas = ref<HTMLCanvasElement | null>(null)
let gl: WebGL2RenderingContext | null | undefined = null

//twgl.createProgram()
const translate = reactive({ x: -150, y: 0, z: -380 })
const scale = reactive({ x: 1, y: 1, z: 1 })
const rotation = ref({
  x: 0,
  y: -15,
  z: 0,
})
const cameraAngle = ref(0) // 相机角度
function getRadians(angle: number): number {
  return (angle * Math.PI) / 180
}
const imgList: HTMLImageElement[] = []
let positionBuffer2: WebGLBuffer | null = null

let matrixLoc: WebGLUniformLocation | null = null
let wordUniformsLoc: WebGLUniformLocation | null = null
let worldUniformInvTransLoc: WebGLUniformLocation | null = null
let cameraPositionLoc: WebGLUniformLocation | null = null
let lightLoc: WebGLUniformLocation | null = null
const lightPosition = [100, 0, -200] // 调整光源位置：更接近场景中心，稍微偏上方
const getTransformMatrix = (): Float32Array => {
  //console.log('getTransformMatrix', translate, rotation.value, scale)
  // let matrix = M4.orthographic(
  //   0,
  //   canvas.value?.clientWidth || 0,
  //   canvas.value?.clientHeight || 0,
  //   0,
  //   200, // near: 近裁剪平面距离（小的正值）
  //   -200, // far: 远裁剪平面距离（大的正值，必须 > near）
  // )
  //console.log('view
  let matrix = getPerspectiveMatrix()

  matrix = M4.translate(matrix, translate.x, translate.y, translate.z)
  matrix = M4.rotateX(matrix, (rotation.value.x * Math.PI) / 180)
  matrix = M4.rotateY(matrix, (rotation.value.y * Math.PI) / 180)
  matrix = M4.rotateZ(matrix, (rotation.value.z * Math.PI) / 180)
  matrix = M4.scale(matrix, scale.x, scale.y, scale.z)
  //console.log(cameraAngle.value, matrix)
  return matrix
}
function getPerspectiveMatrix(): Float32Array {
  if (!canvas.value) return new Float32Array(16)
  const fov = (60 * Math.PI) / 180 // 45度视场角
  const aspect = canvas.value?.clientWidth / (canvas.value?.clientHeight || 1)
  const near = 1 // 近裁剪平面
  const far = 2000.0 // 远裁剪平面
  return M4.perspective(fov, aspect, near, far)
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

  const normalLoc = gl.getAttribLocation(program, 'a_normal')
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  setNormals(gl)
  gl.enableVertexAttribArray(normalLoc)
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.useProgram(program)

  // 设置变换矩阵
  matrixLoc = gl.getUniformLocation(program, 'u_matrix')
  gl.uniformMatrix4fv(matrixLoc, false, getTransformMatrix())

  // 设置世界矩阵
  wordUniformsLoc = gl.getUniformLocation(program, 'u_worldMatrix')
  gl.uniformMatrix4fv(wordUniformsLoc, false, M4.identity())

  worldUniformInvTransLoc = gl.getUniformLocation(program, 'u_worldInverseTransposeMatrix')
  gl.uniformMatrix4fv(worldUniformInvTransLoc, false, M4.identity())
  const lightPositionLoc = gl.getUniformLocation(program, 'u_lightWorldPosition')
  gl.uniform3fv(lightPositionLoc, lightPosition)
  cameraPositionLoc = gl.getUniformLocation(program, 'u_cameraPosition')
  gl.uniform3fv(cameraPositionLoc, [0, 0, 0]) // 初始化相机位置

  const uInnerLimtLoc = gl.getUniformLocation(program, 'u_innerLimit')
  console.log(Math.cos(glUtils.degToRad(10)), Math.cos(glUtils.degToRad(20)))
  gl.uniform1f(uInnerLimtLoc, Math.cos(glUtils.degToRad(30))) // 内角：30度完全亮
  const uOuterLimitLoc = gl.getUniformLocation(program, 'u_outerLimit')
  gl.uniform1f(uOuterLimitLoc, Math.cos(glUtils.degToRad(80))) // 外角：80度开始衰减
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

  lightLoc = gl.getUniformLocation(program, 'u_lightDirection')
  // 聚光灯从光源位置指向场景中心的方向
  const target = [0, 0, 0]
  const lightDir = M4.normalize([
    target[0] - lightPosition[0],
    target[1] - lightPosition[1],
    target[2] - lightPosition[2],
  ])
  console.log('光源位置:', lightPosition)
  console.log('聚光灯方向:', lightDir)
  console.log('内角20度余弦:', Math.cos(glUtils.degToRad(10)))
  console.log('外角60度余弦:', Math.cos(glUtils.degToRad(20)))
  gl.uniform3fv(lightLoc, lightDir) // 设置光照方向
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
    drawCube(gl, -50, -50, -50, 100, 100, 100) // 将立方体放在 Z=-50 到 Z=50，这样 translate.z=0 时就能看到
    drawImage()
    // const aim = gsap.to(cameraAngle, {
    //   value: 360,
    //   duration: 10,
    //   ease: 'linear',
    //   repeat: -1,
    //   //循环往复
    //   yoyo: true,
    //   //delay: 2,
    //   onRepeat: () => {
    //     aim.pause()
    //     setTimeout(() => {
    //       aim.resume()
    //     }, 2000) // 暂停2秒后继续
    //   },
    // })
  })
}
function drawImage() {
  if (!gl) return
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const nums = 5
  const radius = 200
  const targetPos = [0, 0, 0]
  // 相机绕 Y 轴旋转并后移
  const cameraMatrix = M4.translate(M4.rotationY(getRadians(cameraAngle.value)), 0, 0, radius * 2.2)
  const cameraPos = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]]
  gl.uniform3fv(cameraPositionLoc, cameraPos)
  const lookAtMatrix = M4.lookAt(cameraPos, targetPos, [0, 1, 0])
  const viewMatrix = M4.inverse(lookAtMatrix) as Float32Array
  const projectionMatrix = getPerspectiveMatrix()
  const viewProjectionMatrix = M4.multiply(projectionMatrix, viewMatrix) as Float32Array

  for (let i = 0; i < nums; i++) {
    const angle = (i * 2 * Math.PI) / nums
    const x = radius * Math.cos(angle)
    const z = radius * Math.sin(angle)
    // 每个物体独立模型矩阵: 平移 -> 全局 UI 控制的旋转缩放 -> 初始 translate
    let model = M4.identity()
    model = M4.translate(model, translate.x + x, translate.y, translate.z + z)
    model = M4.rotateX(model, getRadians(rotation.value.x))
    model = M4.rotateY(model, getRadians(rotation.value.y))
    model = M4.rotateZ(model, getRadians(rotation.value.z))
    model = M4.scale(model, scale.x, scale.y, scale.z)

    const mvp = M4.multiply(viewProjectionMatrix, model) as Float32Array
    gl.uniformMatrix4fv(matrixLoc, false, mvp)
    gl.uniformMatrix4fv(wordUniformsLoc, false, model)

    // 法线矩阵: model 的逆转置 (不含投影/视图)
    const inv = M4.inverse(model) as Float32Array
    const invT = M4.transpose(inv) as Float32Array
    gl.uniformMatrix4fv(worldUniformInvTransLoc, false, invT)

    gl.drawArrays(gl.TRIANGLES, 0, 36)
  }
}
watch(
  () => [translate, rotation, scale, cameraAngle],
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
        <Slider v-model="translate.x" class="w-[50%]" :min="-1000" :max="1000" />
        <span class="inline-block w-10">{{ translate.x }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">Y</span>
        <Slider v-model="translate.y" class="w-[50%]" :min="-1000" :max="1000" />
        <span class="inline-block w-10">{{ translate.y }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">Z</span>
        <Slider v-model="translate.z" class="w-[50%]" :min="-1000" :max="1000" :step="1" />
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
      <div class="flex items-center justify-between">
        <span class="inline-block w-10 text-right">相机角度</span>
        <Slider v-model="cameraAngle" class="w-[50%]" :min="-360" :max="360" :step="1" />
        <span class="inline-block w-10">{{ cameraAngle }}</span>
      </div>
    </div>
    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>
