<script setup lang="ts">
import RadioButtonGroup from 'primevue/radiobuttongroup'

import { createProgram, resizeCanvasToDisplaySize } from '@/lib/webGL/gl-help'
import { Matrix3, Matrix4, Vector3 } from '@/lib/webGL/Matrix4'
const canvas = ref<HTMLCanvasElement>()

let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null

let mvpMatrixLocation: WebGLUniformLocation | null = null
let modelMatrixLocation: WebGLUniformLocation | null = null
let normalMatrixLocation: WebGLUniformLocation | null = null
let uLightPositionLocation: WebGLUniformLocation | null = null
let uViewPositionLocation: WebGLUniformLocation | null = null

let coordinateVAO: WebGLVertexArrayObject | null = null
let triangleVAO: WebGLVertexArrayObject | null = null
let pointsVAO: WebGLVertexArrayObject | null = null

const viewModelMatrix = new Matrix4()
const modelMatrix = new Matrix4()
const projectionMatrix = new Matrix4()
const mvpMatrix = new Matrix4()
const identityMatrix = new Matrix4()

const eye = ref({ x: -6, y: 2, z: 10 })

const projectionType = ref<'ortho' | 'perspective'>('perspective')

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
  pauseAnimation()
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

/** ----- 鼠标移动控制 -------- */
const currentAngle = [0, 0] // [绕y轴旋转角度, 绕x轴旋转角度]
function initMouseEvent(canvas: HTMLCanvasElement, currentAngle: number[]) {
  let dragging = false
  let lastX = -1
  let lastY = -1

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect()
    if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      dragging = false
      return
    }
    dragging = true
    lastX = event.clientX
    lastY = event.clientY
  })

  canvas.addEventListener('mouseup', () => {
    dragging = false
  })

  canvas.addEventListener('mousemove', (event) => {
    if (dragging) {
      const deltaX = event.clientX - lastX
      const deltaY = event.clientY - lastY
      currentAngle[0] += deltaX * 0.5 // 调整旋转速度
      currentAngle[1] += deltaY * 0.5
      lastX = event.clientX
      lastY = event.clientY
      requestRender()
    }
  })
}
function initPickObjectEvent(canvas: HTMLCanvasElement) {
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect()
    if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      return
    }
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const picked = checkPickObject(x, y)
    if(picked) {
      alert('点中了对象！')
    }
  })
}
function checkPickObject(x: number, y: number) {
  const uClickedLocation = gl?.getUniformLocation(program!, 'u_Clicked')
  gl?.uniform1i(uClickedLocation!, 1) // 设置为点击状态
  drawScene()
  const pixelData = new Uint8Array(4)
  gl?.readPixels(x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)
  gl?.uniform1i(uClickedLocation!, 0) // 恢复为未点击状态
  drawScene()
  // 如果读到的像素颜色为红色（即被点击的对象颜色），则认为点击成功
  return pixelData[0] === 255 && pixelData[1] === 0 && pixelData[2] === 0;
}
function requestRender() {
  if (renderPending) {
    return
  }
  renderPending = true
  requestAnimationFrame(() => {
    drawScene()
    renderPending = false
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
  initMouseEvent(canvas.value, currentAngle)
  initPickObjectEvent(canvas.value)
  program = createProgram(
    gl,
    `#version 300 es
       in vec4 a_Position;
       in vec4 a_Color;
       in vec4 a_Normal; // 法向量
       out vec4 v_Color;
       out vec3 v_Normal; // 传递给片元着色器的法向量
       out vec3 v_FragPos; // 片元在世界空间的坐标
       uniform mat4 u_ModelMatrix; // 模型矩阵
       uniform mat4 u_MvpMatrix;
       uniform mat3 u_NormalMatrix; // 法向量变换矩阵


       void main() {
         gl_Position = u_MvpMatrix * a_Position;
         gl_PointSize = 10.0;
         vec3 normal = u_NormalMatrix * a_Normal.xyz; // 归一化法向量
         v_Normal = normal; // 传递法向量到片元着色器
         v_Color = a_Color;
         v_FragPos = (u_ModelMatrix * a_Position).xyz; // 传递片元在世界空间的坐标
       }
    `,
    `#version 300 es
       precision highp float;
       in vec4 v_Color;
       in vec3 v_Normal; // 接收法向量
       in vec3 v_FragPos; // 接收片元在世界空间的坐标
       uniform vec3 u_LightColor; // 光线颜色
       uniform vec3 u_LightPosition; // 点光源位置
       uniform vec3 u_ViewPosition; // 相机位置
       uniform vec3 u_SpecularColor; // 高光颜色
       uniform vec3 u_AmbientLight; // 环境光颜色
       uniform bool u_Clicked; // 是否被点击
       out vec4 fragColor;
       void main() {
          if(u_Clicked) {
            fragColor = vec4(1.0, 0.0, 0.0, 1.0); // 点击时显示红色
            return;
          }
          vec3 normal = normalize(v_Normal); // 归一化法向量
         vec3 lightVector = u_LightPosition - v_FragPos;
         float distanceToLight = length(lightVector);
         vec3 lightDirection = normalize(lightVector); // 计算光线方向
          float nDotL = max(dot(normal, lightDirection), 0.0);

         // 点光源距离衰减，避免整面亮度过于平均。
         float attenuation = 1.0 / (1.0 + 0.14 * distanceToLight + 0.07 * distanceToLight * distanceToLight);

          // 计算漫反射光的颜色 = 物体颜色 * 光线颜色 * 光照强度
         vec3 diffuse = vec3(v_Color) * u_LightColor * nDotL * attenuation;

         vec3 viewDirection = normalize(u_ViewPosition - v_FragPos);
         vec3 reflectDirection = reflect(-lightDirection, normal);
         float specularFactor = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0);
         vec3 specular = u_SpecularColor * specularFactor * attenuation * step(0.0, nDotL);

          // 计算环境光的颜色 = 物体颜色 * 环境光颜色
          vec3 ambient = vec3(v_Color) * u_AmbientLight;
         // 最终颜色 = 漫反射光 + 高光 + 环境光
         vec3 finalColor = diffuse + specular + ambient;
         fragColor = vec4(finalColor, v_Color.a);
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
  if (!uLightColorLocation) {
    throw new Error('u_LightColor uniform not found')
  }
  gl.uniform3f(uLightColorLocation, 1, 1, 1) // 白色光源

  const uSpecularColorLocation = gl.getUniformLocation(program, 'u_SpecularColor')
  if (!uSpecularColorLocation) {
    throw new Error('u_SpecularColor uniform not found')
  }
  gl.uniform3f(uSpecularColorLocation, 1, 1, 1)

  uLightPositionLocation = gl.getUniformLocation(program, 'u_LightPosition')
  if (!uLightPositionLocation) {
    throw new Error('u_LightPosition uniform not found')
  }
  const uLightPosition = new Vector3(0.5, 1.5, 1.5) // 点光源位置
  gl.uniform3fv(uLightPositionLocation, uLightPosition.elements) // 点光源位置

  uViewPositionLocation = gl.getUniformLocation(program, 'u_ViewPosition')
  if (!uViewPositionLocation) {
    throw new Error('u_ViewPosition uniform not found')
  }
  gl.uniform3f(uViewPositionLocation, eye.value.x, eye.value.y, eye.value.z)

  const uAmbientLightLocation = gl.getUniformLocation(program, 'u_AmbientLight')
  if (!uAmbientLightLocation) {
    throw new Error('u_AmbientLight uniform not found')
  }
  gl.uniform3f(uAmbientLightLocation, 0.2, 0.2, 0.2) // 环境光颜色

  const uClickedLocation = gl.getUniformLocation(program, 'u_Clicked')
  gl.uniform1i(uClickedLocation, 0) // 初始状态未点击

  modelMatrixLocation = gl.getUniformLocation(program, 'u_ModelMatrix')
  if (!modelMatrixLocation) {
    throw new Error('u_ModelMatrix uniform not found')
  }

  mvpMatrixLocation = gl.getUniformLocation(program, 'u_MvpMatrix')
  if (!mvpMatrixLocation) {
    throw new Error('u_MvpMatrix uniform not found')
  }

  normalMatrixLocation = gl.getUniformLocation(program, 'u_NormalMatrix')
  if (!normalMatrixLocation) {
    throw new Error('u_NormalMatrix uniform not found')
  }

  coordinateVAO = gl.createVertexArray()
  triangleVAO = gl.createVertexArray()
  pointsVAO = gl.createVertexArray()

  /*---- 绑定坐标系VAO -----*/
  gl.bindVertexArray(coordinateVAO)
  const coordinateBuffer = gl.createBuffer()
  if (!coordinateBuffer) {
    throw new Error('coordinateBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, coordinateBuffer)
  const coordinateData = new Float32Array([
    -10, 0, 0, 1, 0, 10, 0, 0, 1, 0, 0, -10, 0, 1, 0, 0, 10, 0, 1, 0,
  ])
  const normal_coordinateData = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])

  gl.bufferData(gl.ARRAY_BUFFER, coordinateData, gl.STATIC_DRAW)

  const elementBytes = coordinateData.BYTES_PER_ELEMENT
  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)
  initArrayBuffer(gl, normal_coordinateData, 3, gl.FLOAT, 'a_Normal')

  /*---- 绑定正方形VAO -----*/
  gl.bindVertexArray(triangleVAO)

  const vertices = new Float32Array([
    // 前面 (z = 1)
    1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1,
    // 右面 (x = 1)
    1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1, 1, 1,
    // 上面 (y = 1)
    1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1, 1,
    // 左面 (x = -1)
    -1, 1, 1, 1, 1, 1, -1, 1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, 1,
    // 下面 (y = -1)
    -1, -1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1,
    // 后面 (z = -1)
    1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, -1, -1, -1, 1, 1, 1, -1, 1, -1, 1, 1, 1,
  ])

  const indices = new Uint8Array([
    0,
    1,
    2,
    0,
    2,
    3, // 前
    4,
    5,
    6,
    4,
    6,
    7, // 右
    8,
    9,
    10,
    8,
    10,
    11, // 上
    12,
    13,
    14,
    12,
    14,
    15, // 左
    16,
    17,
    18,
    16,
    18,
    19, // 下
    20,
    21,
    22,
    20,
    22,
    23, // 后
  ])
  const normals = new Float32Array([
    // 前面
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    // 右面
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    // 上面
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    // 左面
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    // 下面
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // 后面
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
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
  initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
  /*---- 绑定点VAO -----*/
  gl.bindVertexArray(pointsVAO)
  const pointsBuffer = gl.createBuffer()
  if (!pointsBuffer) {
    throw new Error('pointsBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-5, -0, 0, 0, 1, 5, 0, 0, 0, 1, 0, 5, 0, 0, 1, 0, -5, 0, 0, 1]),
    gl.STATIC_DRAW,
  )

  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)
  const normal_pointsData = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
  initArrayBuffer(gl, normal_pointsData, 3, gl.FLOAT, 'a_Normal')
}
function initArrayBuffer(
  gl: WebGLRenderingContext,
  data: ArrayBufferView,
  num: number,
  type: number,
  attribute: string,
) {
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
  if (!gl) {
    throw new Error('Required render resources are not initialized')
  }
  if (projectionType.value === 'perspective') {
    const aspect = width / height
    projectionMatrix.setPerspective(30, aspect, 0.1, 100)
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
  updateModelMatrix()
  modelMatrix.rotate(currentAngle[0], 0, 1, 0)
  modelMatrix.rotate(currentAngle[1], 1, 0, 0)
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
  if (!gl || !mvpMatrixLocation || !modelMatrixLocation || !uViewPositionLocation) {
    throw new Error('ViewModel matrix resources not initialized')
  }
  gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements)
  gl.uniform3f(uViewPositionLocation, eye.value.x, eye.value.y, eye.value.z)
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
const isPanelCollapsed = ref(true)

function togglePanel() {
  isPanelCollapsed.value = !isPanelCollapsed.value
}
</script>

<template>
  <div class="webgl-transform relative w-full h-full">
    <canvas ref="canvas" class="w-full h-full" />
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
              :min="-1"
              :max="1"
              :step="0.01"
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
              :min="-1"
              :max="1"
              :step="0.01"
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
              :min="-1"
              :max="1"
              :step="0.01"
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

        <div class="reset mt-5">
          <Button @click="reset">Reset</Button>
        </div>

        <div class="flex flex-col gap-2 mt-5">
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
        <div class="flex flex-col gap-2 mt-5">
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500"
            >Eye Position</span
          >
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
          <span class="text-xs font-medium uppercase tracking-wide text-gray-500"
            >Switch Project</span
          >
          <div class="flex items-center gap-3">
            <RadioButtonGroup
              v-model="projectionType"
              class="flex items-center gap-4"
              @update:model-value="
                () => {
                  updateProjectionMatrix(canvas?.width || 1, canvas?.height || 1)
                  requestRender()
                }
              "
            >
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
