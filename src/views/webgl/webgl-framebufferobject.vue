<script setup lang="ts">
import RadioButtonGroup from 'primevue/radiobuttongroup'
import { Matrix3, Matrix4 } from '@/lib/webGL/Matrix4'
import { initRenderState } from '@/lib/webGL/pwgl'
import twgl from '@/lib/webGL/twgl'
const canvas = ref<HTMLCanvasElement>()

let gl: WebGL2RenderingContext | null = null

let textureProgram: twgl.ProgramInfo | null = null
let textureVao: WebGLVertexArrayObject | null = null
let textureBufferInfo: twgl.BufferInfo | null = null

let framebuffer: WebGLFramebuffer | null = null
let frameTexture: WebGLTexture | null = null
let renderTexture: WebGLTexture | null = null
let renderDepthBuffer: WebGLRenderbuffer | null = null
let renderTargetWidth = 0
let renderTargetHeight = 0

const viewModelMatrix = new Matrix4()
const modelMatrix = new Matrix4()
const normalMatrix = new Matrix3()
const projectionMatrix = new Matrix4()
const mvpMatrix = new Matrix4()

const eye = ref({ x: -6, y: 2, z: 10 })

const projectionType = ref<'ortho' | 'perspective'>('perspective')

let renderPending = false

const transformParam = reactive({
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  rotateAngle: 0,
})
const textureCube = {
  shader: {
    vertex: `#version 300 es
       in vec4 a_Position;
       in vec2 a_TexCoord;
       in vec4 a_Normal; // 法向量
       out vec2 v_TexCoord;
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
         v_TexCoord = a_TexCoord;
         v_FragPos = (u_ModelMatrix * a_Position).xyz; // 传递片元在世界空间的坐标
       }
    `,
    fragment: `#version 300 es
       precision highp float;
       in vec2 v_TexCoord;
       in vec3 v_Normal; // 接收法向量
       in vec3 v_FragPos; // 接收片元在世界空间的坐标
       uniform vec3 u_LightColor; // 光线颜色
       uniform vec3 u_LightPosition; // 点光源位置
       uniform vec3 u_ViewPosition; // 相机位置
       uniform vec3 u_SpecularColor; // 高光颜色
       uniform vec3 u_AmbientLight; // 环境光颜色
       uniform bool u_Clicked; // 是否被点击
       uniform sampler2D u_Sampler; // 纹理采样器
       uniform float u_LightIntensity; // 光照强度
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

         vec4 v_Color = texture(u_Sampler, v_TexCoord);
          // 计算漫反射光的颜色 = 物体颜色 * 光线颜色 * 光照强度
         vec3 diffuse = vec3(v_Color) * u_LightColor * u_LightIntensity * nDotL * attenuation;

         vec3 viewDirection = normalize(u_ViewPosition - v_FragPos);
         vec3 reflectDirection = reflect(-lightDirection, normal);
         float specularFactor = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0);
         vec3 specular = u_SpecularColor * specularFactor * u_LightIntensity * attenuation * step(0.0, nDotL);

          // 计算环境光的颜色 = 物体颜色 * 环境光颜色
          vec3 ambient = vec3(v_Color) * u_AmbientLight;
         // 最终颜色 = 漫反射光 + 高光 + 环境光
         vec3 finalColor = diffuse + specular + ambient;
         fragColor = vec4(finalColor, v_Color.a);
       }
    `,
  },
  MeshArrays: {
    Normal: {
      data: [
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
      ],
      numComponents: 3,
    },
    indices: {
      data: new Uint8Array([
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18,
        16, 18, 19, 20, 21, 22, 20, 22, 23,
      ]),
      numComponents: 1,
    },
    Position: {
      data: [
        // 前面 (z = 1)
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
        // 右面 (x = 1)
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,
        // 上面 (y = 1)
        1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,
        // 左面 (x = -1)
        -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,
        // 下面 (y = -1)
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
        // 后面 (z = -1)
        1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1,
      ],
      numComponents: 3,
    },
    TexCoord: {
      data: [
        // 前面
        1, 1, 0, 1, 0, 0, 1, 0,
        // 右面
        1, 1, 1, 0, 0, 0, 0, 1,
        // 上面
        1, 1, 1, 0, 0, 0, 0, 1,
        // 左面
        1, 1, 1, 0, 0, 0, 0, 1,
        // 下面
        1, 1, 1, 0, 0, 0, 0, 1,
        // 后面
        1, 1, 1, 0, 0, 0, 0, 1,
      ],
      numComponents: 2,
    },
  },
  uniforms: {
    u_ModelMatrix: modelMatrix.elements,
    u_MvpMatrix: mvpMatrix.elements,
    u_NormalMatrix: normalMatrix.elements,
    u_LightColor: [1, 1, 1],
    u_LightPosition: [3, 3, 3],
    u_ViewPosition: [eye.value.x, eye.value.y, eye.value.z],
    u_SpecularColor: [1, 1, 1],
    u_AmbientLight: [0.2, 0.2, 0.2],
    u_Clicked: false,
    u_Sampler: null as WebGLTexture | null,
    u_LightIntensity: 4.0,
  },
}
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
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
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
function drawScene() {
  if (!gl) {
    return
  }
  if (!canvas.value) {
    return
  }

  ensureRenderTarget(gl, canvas.value.width, canvas.value.height)

  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    textureCube.uniforms.u_Sampler = frameTexture
    gl.viewport(0, 0, renderTargetWidth, renderTargetHeight)
    gl.clearColor(0.5, 0.7, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    updateProjectionMatrix(renderTargetWidth, renderTargetHeight)
    drawTextureCube(gl)
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, canvas.value!.width, canvas.value!.height)
  if (renderTexture) {
    gl.bindTexture(gl.TEXTURE_2D, renderTexture)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }
  textureCube.uniforms.u_Sampler = renderTexture
  updateProjectionMatrix(canvas.value.width, canvas.value.height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  drawTextureCube(gl)
}
async function renderGl() {
  if (!canvas.value) {
    throw new Error('Canvas element not available')
  }
  initMouseEvent(canvas.value, currentAngle)
  const image = await loadImage('/imgs/child.png')
  gl = initRenderState(canvas.value)
  twgl.setDefaults({ attribPrefix: 'a_' })
  textureProgram = twgl.createProgramInfo(gl, [
    textureCube.shader.vertex,
    textureCube.shader.fragment,
  ])

  const texture = createTexture(gl, image)
  frameTexture = texture
  textureCube.uniforms.u_Sampler = texture
  textureBufferInfo = twgl.createBufferInfoFromArrays(gl, textureCube.MeshArrays)
  textureVao = twgl.createVAOFromBufferInfo(gl, textureProgram, textureBufferInfo)

  drawScene()
}
function ensureRenderTarget(gl: WebGL2RenderingContext, width: number, height: number) {
  if (
    framebuffer &&
    renderTexture &&
    renderDepthBuffer &&
    width === renderTargetWidth &&
    height === renderTargetHeight
  ) {
    return
  }

  if (framebuffer) {
    gl.deleteFramebuffer(framebuffer)
    framebuffer = null
  }
  if (renderTexture) {
    gl.deleteTexture(renderTexture)
    renderTexture = null
  }
  if (renderDepthBuffer) {
    gl.deleteRenderbuffer(renderDepthBuffer)
    renderDepthBuffer = null
  }

  renderTargetWidth = width
  renderTargetHeight = height

  renderTexture = createRendererTexture(gl, width, height)
  renderDepthBuffer = gl.createRenderbuffer()
  if (!renderDepthBuffer) {
    throw new Error('Renderbuffer not created')
  }

  gl.bindRenderbuffer(gl.RENDERBUFFER, renderDepthBuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)

  framebuffer = gl.createFramebuffer()
  if (!framebuffer) {
    throw new Error('Framebuffer not created')
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    renderTexture,
    0,
  )
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderDepthBuffer)

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer is incomplete: ${status.toString(16)}`)
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindRenderbuffer(gl.RENDERBUFFER, null)
}
function createRendererTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat = gl.RGBA8,
  format = gl.RGBA,
  type = gl.UNSIGNED_BYTE,
) {
  const rendererTexture = gl.createTexture();
  if (!rendererTexture) {
    throw new Error('rendererTexture not created')
  }
  gl.bindTexture(gl.TEXTURE_2D, rendererTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    width,
    height,
    0,
    format,
    type,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return rendererTexture;
}
function drawTextureCube(gl: WebGL2RenderingContext) {
  if (!textureProgram || !textureVao || !textureBufferInfo) {
    return
  }
  gl.useProgram(textureProgram.program)

  gl.bindVertexArray(textureVao)
  updateModelMatrix()
  updateMatrix()
  twgl.setUniforms(textureProgram, {
    ...textureCube.uniforms,
  })
  twgl.drawBufferInfo(gl, textureBufferInfo)
}
function updateMatrix() {
  updateViewModelMatrix(modelMatrix)
  updateNormalMatrix(modelMatrix)
  textureCube.uniforms.u_ModelMatrix = modelMatrix.elements
  textureCube.uniforms.u_MvpMatrix = mvpMatrix.elements
  textureCube.uniforms.u_NormalMatrix = normalMatrix.elements
  textureCube.uniforms.u_ViewPosition = [eye.value.x, eye.value.y, eye.value.z]
}
function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = (err) => reject(err)
    image.src = url
  })
}
function createTexture(gl: WebGLRenderingContext, image: HTMLImageElement) {
  const texture = gl.createTexture()
  if (!texture) {
    throw new Error('Texture not created')
  }
  //像素翻转
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
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
function updateNormalMatrix(modelMatrix: Matrix4) {
  const modelMatrix3 = new Matrix3()
  modelMatrix3.fromMatrix4(modelMatrix)
  normalMatrix.setIdentity()
  modelMatrix3.invertTo(normalMatrix)
  normalMatrix.transpose()
  return normalMatrix
}
/**
 * 更新视图模型变换矩阵
 */
function updateViewModelMatrix(modelMatrix: Matrix4) {
  viewModelMatrix.setIdentity()
  viewModelMatrix.setLookAt(eye.value.x, eye.value.y, eye.value.z, 0, 0, -1, 0, 1, 0)
  mvpMatrix.set(projectionMatrix).multiply(viewModelMatrix).multiply(modelMatrix)
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
        :class="isPanelCollapsed ? 'opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'"
      >
        <div class="mb-5 flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-800">Transform</span>
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
