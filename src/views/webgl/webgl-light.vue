<script setup lang="ts">
import RadioButtonGroup from 'primevue/radiobuttongroup';

import { createProgram, resizeCanvasToDisplaySize } from '@/lib/webGL/gl-help'
import { Matrix3, Matrix4, Vector3 } from '@/lib/webGL/Matrix4'
const canvas = ref<HTMLCanvasElement>()

let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null


let mvpMatrixLocation: WebGLUniformLocation | null = null
let normalMatrixLocation: WebGLUniformLocation | null = null
let uLightDirectionLocation: WebGLUniformLocation | null = null


let coordinateVAO: WebGLVertexArrayObject | null = null
let triangleVAO: WebGLVertexArrayObject | null = null
let pointsVAO: WebGLVertexArrayObject | null = null

const viewModelMatrix = new Matrix4()
const modelMatrix = new Matrix4()
const projectionMatrix = new Matrix4()
const mvpMatrix = new Matrix4()
const identityMatrix = new Matrix4()

const eye = ref({ x: -6, y: 2, z: 10 })

const projectionType = ref<'ortho' | 'perspective'>('ortho')

let lastCanvasWidth = 0
let lastCanvasHeight = 0
let renderPending = false

const perfText = ref('')
let perfFrames = 0
let perfTotalCost = 0
let perfWindowStart = 0

const transformParam = reactive({
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  rotateAngle: 0,
})

/*------ Animation ------ */
const rotatedSpeed = ref(30) // 度/秒
let lastTime = 0
let animationFrameId: number | null = null
function animateRotate(time: number) {
  if (lastTime === 0) {
    lastTime = time
  }
  const delta = time - lastTime
  lastTime = time

  transformParam.rotateAngle += (rotatedSpeed.value * delta) / 1000
  if (transformParam.rotateAngle >= 360) {
    transformParam.rotateAngle -= 360
  }
  animationFrameId = requestAnimationFrame(animateRotate)
}
function playAnimation() {
  animationFrameId = requestAnimationFrame(animateRotate)
}
function pauseAnimation() {
  lastTime = 0
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}
/*------ Animation ------ */
watch(transformParam, () => {
  requestRender()
})
onMounted(() => {
  renderGl()
  window.addEventListener('resize', requestRender)
  window.addEventListener('keydown', handleKeyDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', requestRender)
  window.removeEventListener('keydown', handleKeyDown)
})
function handleKeyDown(event: KeyboardEvent) {
  if (event.code === 'ArrowLeft') {
    eye.value.x -= 0.05
  } else if (event.code === 'ArrowRight') {
    eye.value.x += 0.05
  } else if (event.code === 'ArrowUp') {
    eye.value.z += 0.05
  } else if (event.code === 'ArrowDown') {
    eye.value.z -= 0.05
  } else {
    return
  }
  requestRender()
}
function requestRender() {
  if (renderPending) {
    return
  }
  renderPending = true
  requestAnimationFrame(() => {
    renderPending = false
    drawScene()
  })
}

function renderGl() {
  if (!canvas.value) {
    throw new Error('Canvas element not available')
  }
  gl = canvas.value?.getContext('webgl2')
  if (!gl) {
    throw new Error('WebGL2 context not available')
  }
  resizeCanvasToDisplaySize(canvas.value)
  gl.viewport(0, 0, canvas.value.width, canvas.value.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.POLYGON_OFFSET_FILL)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  program = createProgram(
    gl,
    `#version 300 es
       in vec4 a_Position;
       in vec4 a_Color;
       in vec4 a_Normal; // 法向量
       out vec4 v_Color;
       uniform mat4 u_MvpMatrix;
       uniform mat3 u_NormalMatrix; // 法向量变换矩阵
       uniform vec3 u_LightColor; // 光线颜色
       uniform vec3 u_LightDirection; // 归一化的光线方向
       void main() {
         gl_Position = u_MvpMatrix * a_Position;
         gl_PointSize = 10.0;
         vec3 normal = normalize((u_NormalMatrix * a_Normal.xyz)); // 归一化法向量
         // 计算光线方向和法向量的点积，得到光照强度，并确保不为负值
         float nDotL = max(dot(normal, u_LightDirection), 0.0);
         // 计算漫反射光的颜色 = 物体颜色 * 光线颜色 * 光照强度
         vec3 diffuse = vec3(a_Color) * u_LightColor * nDotL;
         v_Color = vec4(diffuse, a_Color.a);
       }
    `,
    `#version 300 es
       precision highp float;
       in vec4 v_Color;
      //  uniform vec4 u_Color;
       out vec4 fragColor;
       void main() {
          fragColor = v_Color;
       }
    `,
  )

  gl.useProgram(program)
  initVAOs()
  requestRender()
}



function initVAOs() {
  if (!gl) {
    throw new Error('WebGL context not initialized')
  }
  /* ---- 获取位置 ---- */
  if (!gl || !program) {
    throw new Error('WebGL context or program not initialized')
  }
  const aPositionLocation = gl.getAttribLocation(program, 'a_Position')
  const aColorLocation = gl.getAttribLocation(program, 'a_Color')

  const uLightColorLocation = gl.getUniformLocation(program, 'u_LightColor')
  gl.uniform3f(uLightColorLocation, 1, 1, 1) // 白色光源
  uLightDirectionLocation = gl.getUniformLocation(program, 'u_LightDirection')
  const uLightDirection = new Vector3(0.5, 3.0, 4.0).normalize() // 光线方向向量
  gl.uniform3fv(uLightDirectionLocation, uLightDirection.elements) // 光线方向

  mvpMatrixLocation = gl.getUniformLocation(program, 'u_MvpMatrix')
  if (!mvpMatrixLocation) {
    throw new Error('u_MvpMatrix uniform not found')
  }

  normalMatrixLocation = gl.getUniformLocation(program, 'u_NormalMatrix')
  if (!normalMatrixLocation) {
    throw new Error('u_NormalMatrix uniform not found')
  }



  coordinateVAO = gl.createVertexArray();
  triangleVAO = gl.createVertexArray();
  pointsVAO = gl.createVertexArray();

  /*---- 绑定坐标系VAO -----*/
  gl.bindVertexArray(coordinateVAO)
  const coordinateBuffer = gl.createBuffer()
  if (!coordinateBuffer) {
    throw new Error('coordinateBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, coordinateBuffer)
  const coordinateData = new Float32Array([
    -10, 0, 0, 1, 0,
    10, 0, 0, 1, 0,
    0, -10, 0, 1, 0,
    0, 10, 0, 1, 0,
  ])
  const normal_coordinateData = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  ])

  gl.bufferData(gl.ARRAY_BUFFER, coordinateData, gl.STATIC_DRAW)

  const elementBytes = coordinateData.BYTES_PER_ELEMENT
  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5 , 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5 , elementBytes * 2)
  initArrayBuffer(gl , normal_coordinateData ,3 , gl.FLOAT , 'a_Normal')

  /*---- 绑定正方形VAO -----*/
  gl.bindVertexArray(triangleVAO)

  const vertices = new Float32Array([
    // 前面 (z = 1)
    1, 1, 1, 1, 0, 0,
    -1, 1, 1, 1, 0, 0,
    -1, -1, 1, 1, 0, 0,
    1, -1, 1, 1, 0, 0,
    // 右面 (x = 1)
    1, 1, 1, 0, 1, 0,
    1, -1, 1, 0, 1, 0,
    1, -1, -1, 0, 1, 0,
    1, 1, -1, 0, 1, 0,
    // 上面 (y = 1)
    1, 1, 1, 0, 0, 1,
    1, 1, -1, 0, 0, 1,
    -1, 1, -1, 0, 0, 1,
    -1, 1, 1, 0, 0, 1,
    // 左面 (x = -1)
    -1, 1, 1, 1, 1, 0,
    -1, 1, -1, 1, 1, 0,
    -1, -1, -1, 1, 1, 0,
    -1, -1, 1, 1, 1, 0,
    // 下面 (y = -1)
    -1, -1, -1, 1, 0, 1,
    1, -1, -1, 1, 0, 1,
    1, -1, 1, 1, 0, 1,
    -1, -1, 1, 1, 0, 1,
    // 后面 (z = -1)
    1, 1, -1, 0, 1, 1,
    1, -1, -1, 0, 1, 1,
    -1, -1, -1, 0, 1, 1,
    -1, 1, -1, 0, 1, 1,
  ])

  const indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, // 前
    4, 5, 6, 4, 6, 7, // 右
    8, 9, 10, 8, 10, 11, // 上
    12, 13, 14, 12, 14, 15, // 左
    16, 17, 18, 16, 18, 19, // 下
    20, 21, 22, 20, 22, 23, // 后
  ])
  const normals = new Float32Array([
    // 前面
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    // 右面
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    // 上面
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    // 左面
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    // 下面
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    // 后面
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  ])

  const triangleBuffer = gl.createBuffer()
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, elementBytes * 6, 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 6, elementBytes * 3)
  initArrayBuffer(gl , normals ,3 , gl.FLOAT , 'a_Normal')
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
  /*---- 绑定点VAO -----*/
  gl.bindVertexArray(pointsVAO)
  const pointsBuffer = gl.createBuffer()
  if (!pointsBuffer) {
    throw new Error('pointsBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -5, -0, 0, 0, 1,
    5, 0, 0, 0, 1,
    0, 5, 0, 0, 1,
    0, -5, 0, 0, 1,
  ]), gl.STATIC_DRAW)

  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)
  const normal_pointsData = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  ])
  initArrayBuffer(gl , normal_pointsData ,3 , gl.FLOAT , 'a_Normal')
}
function initArrayBuffer(gl: WebGLRenderingContext, data: ArrayBufferView, num: number, type: number, attribute: string) {
  const buffer = gl.createBuffer()
  if (!buffer) {
    throw new Error('Buffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  const a_attribute = gl.getAttribLocation(program as WebGLProgram, attribute)
  gl.enableVertexAttribArray(a_attribute)
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0)
}
function drawScene() {
  if (!gl || !program) {
    throw new Error('WebGL context or program not initialized')
  }
  const start = import.meta.env.DEV ? performance.now() : 0

  updateViewportAndProjectionIfNeeded()
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  drawCoordinate()
  drawPoints()
  gl.polygonOffset(1, 1) // 设置多边形偏移，避免填充的三角形和线框重叠时出现闪烁

  drawTriangle()


  if (import.meta.env.DEV) {
    const frameCost = performance.now() - start
    perfFrames += 1
    perfTotalCost += frameCost
    if (perfWindowStart === 0) {
      perfWindowStart = start
    }

    const elapsed = performance.now() - perfWindowStart
    if (elapsed >= 1000) {
      const fps = (perfFrames * 1000) / elapsed
      const avgCost = perfTotalCost / perfFrames
      perfText.value = `FPS ${fps.toFixed(1)} · Draw ${avgCost.toFixed(2)}ms`

      perfFrames = 0
      perfTotalCost = 0
      perfWindowStart = performance.now()
    }
  }
}
function updateProjectionMatrix(width: number, height: number) {
  if (!gl ) {
    throw new Error('Required render resources are not initialized')
  }
  if (projectionType.value === 'perspective') {
    const aspect = width / height
    projectionMatrix.setPerspective(30, aspect, 0.1, 100)
  } else {
    projectionMatrix.setOrtho(-20, 20 , -10, 10, 0, 80)
  }
}
function updateViewportAndProjectionIfNeeded() {
  if (!gl || !canvas.value || !mvpMatrixLocation) {
    throw new Error('Required render resources are not initialized')
  }

  resizeCanvasToDisplaySize(canvas.value)
  const { width, height } = canvas.value
  if (width === lastCanvasWidth && height === lastCanvasHeight) {
    return
  }

  lastCanvasWidth = width
  lastCanvasHeight = height

  gl.viewport(0, 0, width, height)
  updateProjectionMatrix(width, height)
}

function drawCoordinate() {
  if (!gl) {
    throw new Error('Coordinate resources not initialized')
  }
  gl.bindVertexArray(coordinateVAO)
  updateNormalMatrix(identityMatrix)
  updateViewModelMatrix(identityMatrix)
  gl.drawArrays(gl.LINES, 0, 4)
}

function drawTriangle() {
  if (!gl) {
    throw new Error('Triangle resources not initialized')
  }
  gl.bindVertexArray(triangleVAO)
  updateModelMatrix()

  updateViewModelMatrix(modelMatrix)
  updateNormalMatrix(modelMatrix)
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0)
}

function drawPoints() {
  if (!gl) {
    throw new Error('Points resources not initialized')
  }
  gl.bindVertexArray(pointsVAO)
  updateViewModelMatrix(identityMatrix)
  updateNormalMatrix(identityMatrix)
  gl.drawArrays(gl.POINTS, 0, 4)
}
function updateNormalMatrix(modelMatrix: Matrix4) {
  if (!gl || !normalMatrixLocation) {
    throw new Error('Normal matrix resources not initialized')
  }
  const modelMatrix3 = new Matrix3()
    modelMatrix3.fromMatrix4(modelMatrix)
  const normalMatrix = new Matrix3()
  modelMatrix3.invertTo(normalMatrix)
  normalMatrix.transpose()
  gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix.elements)
}
/**
 * 更新视图模型变换矩阵
 */
function updateViewModelMatrix(modelMatrix: Matrix4) {
  if (!gl || !mvpMatrixLocation) {
    throw new Error('ViewModel matrix resources not initialized')
  }
  viewModelMatrix.setIdentity()
  viewModelMatrix.setLookAt(eye.value.x, eye.value.y, eye.value.z, 0, 0, -1, 0, 1, 0)
  mvpMatrix.set(projectionMatrix).multiply(viewModelMatrix).multiply(modelMatrix)
  gl.uniformMatrix4fv(mvpMatrixLocation, false, mvpMatrix.elements)
}
/**
 * 更新模型变换矩阵
 */
function updateModelMatrix() {
  modelMatrix.setIdentity()
  modelMatrix.translate(transformParam.translateX, transformParam.translateY, transformParam.translateZ)
  modelMatrix.rotate(transformParam.rotateAngle, 0, 0, 1)
  modelMatrix.scale(transformParam.scaleX, transformParam.scaleY, transformParam.scaleZ)
}

function reset() {
  transformParam.translateX = 0
  transformParam.translateY = 0
  transformParam.translateZ = 0
  transformParam.scaleX = 1
  transformParam.scaleY = 1
  transformParam.scaleZ = 1
  transformParam.rotateAngle = 0
}
</script>

<template>
  <div class="webgl-transform relative w-full h-full">
    <canvas ref="canvas" class="w-full h-full" />
    <div
      class="transform-controlbox absolute top-4 right-4 w-80 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm"
    >
      <div class="mb-5 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-800">Transform</span>
        <span v-if="perfText" class="text-xs text-gray-500">{{ perfText }}</span>
      </div>

      <div class="mb-5 flex flex-col gap-2">
        <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Translate</span>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">X</span>
          <Slider v-model="transformParam.translateX" class="flex-1" :min="-1" :max="1" :step="0.01" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.translateX.toFixed(2) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">Y</span>
          <Slider v-model="transformParam.translateY" class="flex-1" :min="-1" :max="1" :step="0.01" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.translateY.toFixed(2) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">Z</span>
          <Slider v-model="transformParam.translateZ" class="flex-1" :min="-1" :max="1" :step="0.01" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.translateZ.toFixed(2) }}</span>
        </div>
      </div>

      <div class="mb-5 flex flex-col gap-2">
        <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Scale</span>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">X</span>
          <Slider v-model="transformParam.scaleX" class="flex-1" :min="0.1" :max="2" :step="0.01" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.scaleX.toFixed(2) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">Y</span>
          <Slider v-model="transformParam.scaleY" class="flex-1" :min="0.1" :max="2" :step="0.01" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.scaleY.toFixed(2) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">Z</span>
          <Slider v-model="transformParam.scaleZ" class="flex-1" :min="0.1" :max="2" :step="0.01" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.scaleZ.toFixed(2) }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Rotate</span>
        <div class="flex items-center gap-3">
          <span class="w-4 text-xs font-medium text-gray-500">Z</span>
          <Slider v-model="transformParam.rotateAngle" class="flex-1" :min="0" :max="360" :step="1" />
          <span class="w-12 text-right text-xs text-gray-600">{{ transformParam.rotateAngle.toFixed(0) }}°</span>
        </div>
      </div>

      <div class="reset mt-5">
        <Button @click="reset">Reset</Button>
      </div>

      <div class="flex flex-col gap-2 mt-5">
        <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Rotate Animate</span>
        <div class="flex items-center gap-3">
          <span class="w-10 text-xs font-medium text-gray-500">Speed</span>
          <Slider v-model="rotatedSpeed" class="flex-1" :min="0" :max="100" :step="1" />
          <span class="w-12 text-right text-xs text-gray-600">{{ rotatedSpeed }}°/s</span>
        </div>

        <div class="flex items-center gap-3">
          <Button @click="playAnimation">Play</Button>
          <Button @click="pauseAnimation">Pause</Button>
        </div>
      </div>
      <div class="flex flex-col gap-2 mt-5">
        <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Eye Position</span>
        <div class="flex items-center gap-3">
          <div class="">
            <span class="w-10 text-xs font-medium text-gray-500">X: </span>
            <span class="w-12 text-right text-xs text-gray-600">{{ eye.x.toFixed(2) }}</span>
          </div>
          <div class="">
            <span class="w-10 text-xs font-medium text-gray-500">Z: </span>
            <span class="w-12 text-right text-xs text-gray-600">{{ eye.z.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 mt-5">
        <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Switch Project</span>
        <div class="flex items-center gap-3">
          <RadioButtonGroup v-model="projectionType" class="flex items-center gap-4" @update:model-value="() => { updateProjectionMatrix(canvas?.width || 1, canvas?.height || 1);  requestRender() }">
            <RadioButton value="ortho" inputId="ortho" />
            <label class="text-sm text-gray-700" for="ortho">Orthographic</label>
            <RadioButton value="perspective" inputId="perspective" />
             <label class="text-sm text-gray-700" for="perspective">Perspective</label>
          </RadioButtonGroup>
        </div>
      </div>
    </div>
 </div>
</template>

<style lang="scss" scoped></style>
