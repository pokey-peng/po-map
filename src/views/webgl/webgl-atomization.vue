<script setup lang="ts">
import RadioButtonGroup from 'primevue/radiobuttongroup'

import { createProgram, resizeCanvasToDisplaySize } from '@/lib/webGL/gl-help'
import { Matrix3, Matrix4, Vector3 } from '@/lib/webGL/Matrix4'

const canvas = ref<HTMLCanvasElement | null>(null)

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

const eye = ref({ x: 20, y: 20, z: 30 })
const projectionType = ref<'ortho' | 'perspective'>('perspective')
const isPanelCollapsed = ref(true)

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

const rotatedSpeed = ref(30)
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
  if (animationFrameId) {
    return
  }

  animationFrameId = requestAnimationFrame(animateRotate)
}

function pauseAnimation() {
  lastTime = 0

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function togglePanel() {
  isPanelCollapsed.value = !isPanelCollapsed.value
}

watch(transformParam, () => {
  requestRender()
})

watch(projectionType, () => {
  if (!gl || !canvas.value) {
    return
  }

  updateProjectionMatrix(canvas.value.width, canvas.value.height)
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
  pauseAnimation()
  mapCleanup()
})

function mapCleanup() {
  if (gl) {
    gl.bindVertexArray(null)
  }

  coordinateVAO = null
  triangleVAO = null
  pointsVAO = null
  program = null
  gl = null
}

const ANGLE_STEP = 3
let g_arm1Angle = 90
let g_joint1Angle = 0

function handleKeyDown(event: KeyboardEvent) {
  if (event.code === 'ArrowLeft') {
    eye.value.x -= 1
  } else if (event.code === 'ArrowRight') {
    eye.value.x += 1
  } else if (event.code === 'ArrowUp') {
    eye.value.z += 1
  } else if (event.code === 'ArrowDown') {
    eye.value.z -= 1
  } else if (event.code === 'KeyA') {
    g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360
  } else if (event.code === 'KeyD') {
    g_arm1Angle = (g_arm1Angle - ANGLE_STEP + 360) % 360
  } else if (event.code === 'KeyW') {
    g_joint1Angle = Math.min(g_joint1Angle + ANGLE_STEP, 135)
  } else if (event.code === 'KeyS') {
    g_joint1Angle = Math.max(g_joint1Angle - ANGLE_STEP, -135)
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

  gl = canvas.value.getContext('webgl2')
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
       in vec4 a_Normal;
       out vec4 v_Color;
       out vec3 v_Normal;
       out float v_Dist;
       uniform mat4 u_MvpMatrix;
       uniform mat3 u_NormalMatrix;

       void main() {
         gl_Position = u_MvpMatrix * a_Position;
         gl_PointSize = 10.0;
         vec3 normal = u_NormalMatrix * a_Normal.xyz;
         v_Normal = normal;
         v_Color = a_Color;
         v_Dist = gl_Position.w;
       }
    `,
    `#version 300 es
       precision highp float;
       in vec4 v_Color;
       in vec3 v_Normal;
       in float v_Dist;
       uniform vec3 u_LightColor;
       uniform vec3 u_LightDirection;
       uniform vec3 u_AmbientLight;
       uniform vec3 u_FogColor; // 雾的颜色
       uniform vec2 u_FogDist; // 雾的起止距离
       out vec4 fragColor;
       void main() {
         vec3 normal = normalize(v_Normal);
         float nDotL = max(dot(normal, u_LightDirection), 0.0);
         vec3 diffuse = vec3(v_Color) * u_LightColor * nDotL;
         vec3 ambient = vec3(v_Color) * u_AmbientLight;
         diffuse += ambient;
         // 计算雾化因子
          float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
          // 将物体颜色与雾的颜色混合
          diffuse = mix(u_FogColor, diffuse, fogFactor);
         fragColor = vec4(diffuse, v_Color.a);
       }
    `,
  )

  gl.useProgram(program)
  initVAOs()
  requestRender()
}

function initVAOs() {
  if (!gl || !program) {
    throw new Error('WebGL context or program not initialized')
  }

  const aPositionLocation = gl.getAttribLocation(program, 'a_Position')
  const aColorLocation = gl.getAttribLocation(program, 'a_Color')

  const uLightColorLocation = gl.getUniformLocation(program, 'u_LightColor')
  if (!uLightColorLocation) {
    throw new Error('u_LightColor uniform not found')
  }
  gl.uniform3f(uLightColorLocation, 1, 1, 1)

  uLightDirectionLocation = gl.getUniformLocation(program, 'u_LightDirection')
  if (!uLightDirectionLocation) {
    throw new Error('u_LightDirection uniform not found')
  }
  const uLightDirection = new Vector3(0.5, 3.0, 4.0).normalize()
  gl.uniform3fv(uLightDirectionLocation, uLightDirection.elements)

  const uAmbientLightLocation = gl.getUniformLocation(program, 'u_AmbientLight')
  if (!uAmbientLightLocation) {
    throw new Error('u_AmbientLight uniform not found')
  }
  gl.uniform3f(uAmbientLightLocation, 0.08, 0.08, 0.08)

  mvpMatrixLocation = gl.getUniformLocation(program, 'u_MvpMatrix')
  if (!mvpMatrixLocation) {
    throw new Error('u_MvpMatrix uniform not found')
  }

  normalMatrixLocation = gl.getUniformLocation(program, 'u_NormalMatrix')
  if (!normalMatrixLocation) {
    throw new Error('u_NormalMatrix uniform not found')
  }
  const uFogColorLocation = gl.getUniformLocation(program, 'u_FogColor')
  gl.uniform3f(uFogColorLocation, 1, 0.5, 0.5)
  const uFogDistLocation = gl.getUniformLocation(program, 'u_FogDist')
  gl.uniform2f(uFogDistLocation, 20, 100)

  coordinateVAO = gl.createVertexArray()
  triangleVAO = gl.createVertexArray()
  pointsVAO = gl.createVertexArray()

  gl.bindVertexArray(coordinateVAO)
  const coordinateBuffer = gl.createBuffer()
  if (!coordinateBuffer) {
    throw new Error('coordinateBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, coordinateBuffer)
  const coordinateData = new Float32Array([
    -10, 0, 0, 1, 0, 10, 0, 0, 1, 0, 0, -10, 0, 1, 0, 0, 10, 0, 1, 0,
  ])
  const normalCoordinateData = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])

  gl.bufferData(gl.ARRAY_BUFFER, coordinateData, gl.STATIC_DRAW)
  const elementBytes = coordinateData.BYTES_PER_ELEMENT
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)
  initArrayBuffer(gl, normalCoordinateData, 3, gl.FLOAT, 'a_Normal')

  gl.bindVertexArray(triangleVAO)
  const vertices = new Float32Array([
   // 前面 (z = 2)
    2, 10, 2, 1, 1, 1, -2, 10, 2, 1, 1, 1, -2, 0, 2, 1, 1, 1, 2, 0, 2, 1, 1, 1,
    // 右面 (x = 2)
    2, 10, 2, 1, 1, 1, 2, 0, 2, 1, 1, 1, 2, 0, -2, 1, 1, 1, 2, 10, -2, 1, 1, 1,
    // 上面 (y = 10)
    2, 10, 2, 1, 1, 1, 2, 10, -2, 1, 1, 1, -2, 10, -2, 1, 1, 1, -2, 10, 2, 1, 1, 1,
    // 左面 (x = -2)
    -2, 10, -2, 1, 1, 1,-2, 0, -2,  1, 1, 1, -2, 0, 2,1, 1, 1,-2, 10, 2, 1, 1, 1,
    // 下面 (y = 0)
    -2, 0, -2, 1, 1, 1, 2, 0, -2, 1, 1, 1, 2, 0, 2, 1, 1, 1, -2, 0, 2, 1, 1, 1,
    // 后面 (z = -2)
    -2, 10, -2, 1, 1, 1,2, 10, -2, 1, 1, 1, 2, 0, -2, 1, 1, 1, -2, 0, -2, 1, 1, 1,
  ])
  const indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16,
    18, 19, 20, 21, 22, 20, 22, 23,
  ])
  const normals = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    0,0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  ])
  const triangleBuffer = gl.createBuffer()
  const indexBuffer = gl.createBuffer()
  if (!triangleBuffer || !indexBuffer) {
    throw new Error('triangle buffers not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, elementBytes * 6, 0)
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 6, elementBytes * 3)
  initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  gl.bindVertexArray(pointsVAO)
  const pointsBuffer = gl.createBuffer()
  if (!pointsBuffer) {
    throw new Error('pointsBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-5, 0, 0, 0, 1, 5, 0, 0, 0, 1, 0, 5, 0, 0, 1, 0, -5, 0, 0, 1]),
    gl.STATIC_DRAW,
  )
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)
  const normalPointsData = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
  initArrayBuffer(gl, normalPointsData, 3, gl.FLOAT, 'a_Normal')
}

function initArrayBuffer(
  renderGlContext: WebGL2RenderingContext,
  data: ArrayBufferView,
  num: number,
  type: number,
  attribute: string,
) {
  if (!program) {
    throw new Error('Program not initialized')
  }

  const buffer = renderGlContext.createBuffer()
  if (!buffer) {
    throw new Error('Buffer not created')
  }

  renderGlContext.bindBuffer(renderGlContext.ARRAY_BUFFER, buffer)
  renderGlContext.bufferData(renderGlContext.ARRAY_BUFFER, data, renderGlContext.STATIC_DRAW)
  const attributeLocation = renderGlContext.getAttribLocation(program, attribute)
  renderGlContext.enableVertexAttribArray(attributeLocation)
  renderGlContext.vertexAttribPointer(attributeLocation, num, type, false, 0, 0)
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
  gl.polygonOffset(1, 1)
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
  if (!gl) {
    throw new Error('Required render resources are not initialized')
  }

  if (projectionType.value === 'perspective') {
    const aspect = width / height
    projectionMatrix.setPerspective(50, aspect, 1, 100)
  } else {
    projectionMatrix.setOrtho(-20, 20, -10, 10, 0, 80)
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
  // updateModelMatrix()
  // updateViewModelMatrix(modelMatrix)
  // updateNormalMatrix(modelMatrix)
  // gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0)

  // arm1
  const arm1Length = 10
  modelMatrix.setIdentity()
  modelMatrix.translate(0, -12, 0)
  modelMatrix.rotate(g_arm1Angle, 0, 1, 0)
  updateViewModelMatrix(modelMatrix)
  updateNormalMatrix(modelMatrix)
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0)

  // arm2
  modelMatrix.translate(0, arm1Length, 0)
  modelMatrix.rotate(g_joint1Angle, 0, 0, 1)
  modelMatrix.scale(1.3, 1, 1.3)
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

function updateNormalMatrix(currentModelMatrix: Matrix4) {
  if (!gl || !normalMatrixLocation) {
    throw new Error('Normal matrix resources not initialized')
  }

  const modelMatrix3 = new Matrix3()
  modelMatrix3.fromMatrix4(currentModelMatrix)
  const normalMatrix = new Matrix3()
  modelMatrix3.invertTo(normalMatrix)
  normalMatrix.transpose()
  gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix.elements)
}

function updateViewModelMatrix(currentModelMatrix: Matrix4) {
  if (!gl || !mvpMatrixLocation) {
    throw new Error('ViewModel matrix resources not initialized')
  }

  viewModelMatrix.setIdentity()
  viewModelMatrix.setLookAt(eye.value.x, eye.value.y, eye.value.z, 0, 0, 0, 0, 1, 0)
  mvpMatrix.set(projectionMatrix).multiply(viewModelMatrix).multiply(currentModelMatrix)
  gl.uniformMatrix4fv(mvpMatrixLocation, false, mvpMatrix.elements)
}

function updateModelMatrix() {
  modelMatrix.setIdentity()
  modelMatrix.translate(
    transformParam.translateX,
    transformParam.translateY,
    transformParam.translateZ,
  )
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
  <div class="webgl-transform relative h-full w-full">
    <canvas ref="canvas" class="h-full w-full" />

    <div
      class="transform-controlbox absolute top-4 right-4 overflow-hidden rounded-xl border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out"
      :class="isPanelCollapsed ? 'w-12 max-h-12' : 'w-80 max-h-[1200px] translate-x-0 opacity-100'"
    >
      <button
        type="button"
        class="collapse-btn cursor-pointer z-10 absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-300 ease-out hover:bg-gray-50 hover:text-gray-900"
        :aria-expanded="!isPanelCollapsed"
        aria-label="收缩或展开面板"
        @click="togglePanel"
      >
        <span
          class="i-mdi-chevron-right text-lg transition-transform duration-300 ease-out"
          :class="isPanelCollapsed ? 'rotate-180' : 'rotate-0'"
        />
      </button>

      <div
        :class="
          isPanelCollapsed
            ? 'opacity-0 pointer-events-none'
            : 'translate-x-0 opacity-100'
        "
      >
        <div class="mb-5 flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-800">Transform</span>
          <span v-if="perfText" class="text-xs text-gray-500">{{ perfText }}</span>
        </div>

        <div class="mb-5 flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Translate</span>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">X</span>
            <Slider
              v-model="transformParam.translateX"
              class="flex-1"
              :min="-10"
              :max="10"
              :step="0.1"
            />
            <span class="w-12 text-right text-xs text-gray-600">{{
              transformParam.translateX.toFixed(2)
            }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">Y</span>
            <Slider
              v-model="transformParam.translateY"
              class="flex-1"
              :min="-10"
              :max="10"
              :step="0.1"
            />
            <span class="w-12 text-right text-xs text-gray-600">{{
              transformParam.translateY.toFixed(2)
            }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">Z</span>
            <Slider
              v-model="transformParam.translateZ"
              class="flex-1"
              :min="-10"
              :max="10"
              :step="0.1"
            />
            <span class="w-12 text-right text-xs text-gray-600">{{
              transformParam.translateZ.toFixed(2)
            }}</span>
          </div>
        </div>

        <div class="mb-5 flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Scale</span>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">X</span>
            <Slider
              v-model="transformParam.scaleX"
              class="flex-1"
              :min="0.1"
              :max="2"
              :step="0.01"
            />
            <span class="w-12 text-right text-xs text-gray-600">{{
              transformParam.scaleX.toFixed(2)
            }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">Y</span>
            <Slider
              v-model="transformParam.scaleY"
              class="flex-1"
              :min="0.1"
              :max="2"
              :step="0.01"
            />
            <span class="w-12 text-right text-xs text-gray-600">{{
              transformParam.scaleY.toFixed(2)
            }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">Z</span>
            <Slider
              v-model="transformParam.scaleZ"
              class="flex-1"
              :min="0.1"
              :max="2"
              :step="0.01"
            />
            <span class="w-12 text-right text-xs text-gray-600">{{
              transformParam.scaleZ.toFixed(2)
            }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500">Rotate</span>
          <div class="flex items-center gap-3">
            <span class="w-4 text-xs font-medium text-gray-500">Z</span>
            <Slider
              v-model="transformParam.rotateAngle"
              class="flex-1"
              :min="0"
              :max="360"
              :step="1"
            />
            <span class="w-12 text-right text-xs text-gray-600"
              >{{ transformParam.rotateAngle.toFixed(0) }}°</span
            >
          </div>
        </div>

        <div class="mt-5">
          <Button @click="reset">Reset</Button>
        </div>

        <div class="mt-5 flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500"
            >Rotate Animate</span
          >
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

        <div class="mt-5 flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500"
            >Eye Position</span
          >
          <div class="flex items-center gap-3">
            <div>
              <span class="w-10 text-xs font-medium text-gray-500">X: </span>
              <span class="w-12 text-right text-xs text-gray-600">{{ eye.x.toFixed(2) }}</span>
            </div>
            <div>
              <span class="w-10 text-xs font-medium text-gray-500">Z: </span>
              <span class="w-12 text-right text-xs text-gray-600">{{ eye.z.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500"
            >Switch Project</span
          >
          <div class="flex items-center gap-3">
            <RadioButtonGroup v-model="projectionType" class="flex items-center gap-4">
              <RadioButton value="ortho" inputId="ortho" />
              <label class="text-sm text-gray-700" for="ortho">Orthographic</label>
              <RadioButton value="perspective" inputId="perspective" />
              <label class="text-sm text-gray-700" for="perspective">Perspective</label>
            </RadioButtonGroup>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
