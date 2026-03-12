<script setup lang="ts">
import { createProgram, resizeCanvasToDisplaySize } from '@/lib/webGL/gl-help'
import { Matrix4 } from '@/lib/webGL/Matrix4'
const canvas = ref<HTMLCanvasElement>()

let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null


let modelMatrixLocation: WebGLUniformLocation | null = null
let projectionMatrixLocation: WebGLUniformLocation | null = null
let uUseTextureLocation: WebGLUniformLocation | null = null


let coordinateVAO: WebGLVertexArrayObject | null = null
let triangleVAO: WebGLVertexArrayObject | null = null
let pointsVAO: WebGLVertexArrayObject | null = null
const rectTextureVAO: WebGLVertexArrayObject | null = null

const modelMatrix = new Matrix4()
const projectionMatrix = new Matrix4()
const identityMatrix = new Matrix4()

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
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', requestRender)
})

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

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
async function renderGl() {
  if (!canvas.value) {
    throw new Error('Canvas element not available')
  }
  gl = canvas.value?.getContext('webgl2')
  if (!gl) {
    throw new Error('WebGL2 context not available')
  }
  resizeCanvasToDisplaySize(canvas.value)
  gl.viewport(0, 0, canvas.value.width, canvas.value.height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  program = createProgram(
    gl,
    `#version 300 es
       in vec4 a_Position;
       in vec4 a_Color;
       out vec4 v_Color;
       in vec2 a_TexCoord;
       out vec2 v_TexCoord;
       uniform mat4 u_ModelMatrix;
       uniform mat4 u_ProjectionMatrix;
       void main() {
         gl_Position = u_ProjectionMatrix * u_ModelMatrix * a_Position;
         gl_PointSize = 10.0;
         v_Color = a_Color;
         v_TexCoord = a_TexCoord;
       }
    `,
    `#version 300 es
       precision highp float;
       in vec4 v_Color;
       in vec2 v_TexCoord;
       uniform sampler2D u_Sampler;
       uniform bool u_UseTexture;
       out vec4 fragColor;
       void main() {
          fragColor = u_UseTexture ? texture(u_Sampler, v_TexCoord) : v_Color;
       }
    `,
  )

  gl.useProgram(program)
  await initTextures(gl)
  initVAOs(gl, program)
  requestRender()
}



function initVAOs(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const aPositionLocation = gl.getAttribLocation(program, 'a_Position')
  if (aPositionLocation < 0) {
    throw new Error('a_Position attribute not found')
  }
  const aColorLocation = gl.getAttribLocation(program, 'a_Color')
  if (aColorLocation < 0) {
    throw new Error('a_Color attribute not found')
  }

  const aTexCoordLocation = gl.getAttribLocation(program, 'a_TexCoord')
  if (aTexCoordLocation < 0) {
    throw new Error('a_TexCoord attribute not found')
  }

  modelMatrixLocation = gl.getUniformLocation(program, 'u_ModelMatrix')
  if (!modelMatrixLocation) {
    throw new Error('u_ModelMatrix uniform not found')
  }

  projectionMatrixLocation = gl.getUniformLocation(program, 'u_ProjectionMatrix')
  if (!projectionMatrixLocation) {
    throw new Error('u_ProjectionMatrix uniform not found')
  }

  uUseTextureLocation = gl.getUniformLocation(program, 'u_UseTexture')
  if (!uUseTextureLocation) {
    throw new Error('u_UseTexture uniform not found')
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
    -2, 0, 0, 1, 0,
    2, 0, 0, 1, 0,
    0, -1, 0, 1, 0,
    0, 1, 0, 1, 0,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, coordinateData, gl.STATIC_DRAW)

  const elementBytes = coordinateData.BYTES_PER_ELEMENT
  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5 , 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5 , elementBytes * 2)

  /*---- 绑定点VAO -----*/
  gl.bindVertexArray(pointsVAO)
  const pointsBuffer = gl.createBuffer()
  if (!pointsBuffer) {
    throw new Error('pointsBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -0, 0, 0, 1,
    1, 0, 0, 0, 1,
    0, 0.5, 0, 0, 1,
    0, -0.5, 0, 0, 1,
  ]), gl.STATIC_DRAW)

  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)

  /*---- 绑定三角形VAO -----*/
  gl.bindVertexArray(triangleVAO)
  const triangleBuffer = gl.createBuffer()
  if (!triangleBuffer) {
    throw new Error('triangleBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.25, -0.25, 1, 0, 0,
    0.25, -0.25, 0, 1, 0,
    0.0, 0.25, 0, 0, 1,
  ]), gl.STATIC_DRAW)

  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 5, 0)
  // 颜色属性
  gl.enableVertexAttribArray(aColorLocation)
  gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, elementBytes * 5, elementBytes * 2)

  /**---- 绑定纹理图片VAO -----*/
  gl.bindVertexArray(rectTextureVAO)
  const rectTextureBuffer = gl.createBuffer()
  if (!rectTextureBuffer) {
    throw new Error('rectTextureBuffer not created')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, rectTextureBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5, -0.5, 0, 0,
    0.5, 0.5, 1, 1,
    -0.5, 0.5, 0, 1,
    -0.5, -0.5, 0, 0,
    0.5, -0.5, 1, 0,
    0.5, 0.5, 1, 1,
  ]), gl.STATIC_DRAW)
  // 位置属性
  gl.enableVertexAttribArray(aPositionLocation)
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, elementBytes * 4, 0)
  // 纹理坐标属性
  gl.enableVertexAttribArray(aTexCoordLocation)
  gl.vertexAttribPointer(aTexCoordLocation, 2, gl.FLOAT, false, elementBytes * 4, elementBytes * 2)
}
function loadImages(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = (err) => reject(err)
    image.src = url
  })
}
async function initTextures(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture()
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const images = await loadImages('./imgs/child.png')
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images)
}

function drawScene() {
  if (!gl || !program) {
    throw new Error('WebGL context or program not initialized')
  }
  const start = import.meta.env.DEV ? performance.now() : 0

  updateViewportAndProjectionIfNeeded()
  gl.clear(gl.COLOR_BUFFER_BIT)
  drawCoordinate()
  drawPoints()
  drawTriangle()
  drawRectTexture()


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

function updateViewportAndProjectionIfNeeded() {
  if (!gl || !canvas.value || !projectionMatrixLocation) {
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

  projectionMatrix.setIdentity()
  if (width > height) {
    projectionMatrix.setScale(height / width, 1, 1)
  } else {
    projectionMatrix.setScale(1, width / height, 1)
  }
  gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix.elements)
}

function drawCoordinate() {
  if (!gl) {
    throw new Error('Coordinate resources not initialized')
  }
  gl.bindVertexArray(coordinateVAO)
  setModelMatrix(identityMatrix)
  gl.drawArrays(gl.LINES, 0, 4)
}

function drawTriangle() {
  if (!gl) {
    throw new Error('Triangle resources not initialized')
  }
  gl.bindVertexArray(triangleVAO)
  setModelMatrix(identityMatrix)
  // updateModelMatrix()
  // setModelMatrix(modelMatrix)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function drawRectTexture() {
  if (!gl) {
    throw new Error('Texture resources not initialized')
  }
  gl.bindVertexArray(rectTextureVAO)
  // setModelMatrix(identityMatrix)
  updateModelMatrix()
  setModelMatrix(modelMatrix)
  gl.uniform1i(uUseTextureLocation, 1)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  gl.uniform1i(uUseTextureLocation, 0)
}

function drawPoints() {
  if (!gl) {
    throw new Error('Points resources not initialized')
  }
  gl.bindVertexArray(pointsVAO)
  setModelMatrix(identityMatrix)
  gl.drawArrays(gl.POINTS, 0, 4)
}

function setModelMatrix(matrix4: Matrix4) {
  if (!gl || !modelMatrixLocation) {
    throw new Error('Model matrix resources not initialized')
  }
  gl.uniformMatrix4fv(modelMatrixLocation, false, matrix4.elements)
}

/**
 * 获取模型变换矩阵
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
    </div>
 </div>
</template>

<style lang="scss" scoped></style>
