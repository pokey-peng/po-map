<script setup lang="ts">
import { ref, onMounted } from 'vue'
import glUtils from '@/lib/webGL/gl-utils.ts'
import * as twgl from 'twgl.js'

const canvas = ref<HTMLCanvasElement | null>(null)
const selectedModel = ref('CornellBox-Sphere.obj')
const isLoading = ref(false)
let gl: WebGL2RenderingContext | null = null

// 所有模型的数据缓存
interface ModelData {
  parts: Array<{
    material: Record<string, any>
    bufferInfo: twgl.BufferInfo
    vao: WebGLVertexArrayObject
  }>
  extents: { min: number[]; max: number[] }
  meshProgramInfo: twgl.ProgramInfo
}
const modelCache = new Map<string, ModelData>()

// Cornell Box 模型列表
const modelList = [
  'CornellBox-Sphere.obj',
  'CornellBox-Original.obj',
  'CornellBox-Empty-CO.obj',
  'CornellBox-Empty-RG.obj',
  'CornellBox-Empty-Squashed.obj',
  'CornellBox-Empty-White.obj',
  'CornellBox-Glossy-Floor.obj',
  'CornellBox-Glossy.obj',
  'CornellBox-Mirror.obj',
  'CornellBox-Water.obj',
  'water.obj',
]
// 当前渲染状态
let currentRenderFn: ((time: number) => void) | null = null

// 批量加载所有模型
async function loadAllModels(gl: WebGL2RenderingContext) {
  const loadObjFn = glUtils.createLoadObjFn('/models/CornellBox/')

  console.log('开始批量加载模型...')
  isLoading.value = true

  for (const modelName of modelList) {
    try {
      console.log(`加载模型: ${modelName}`)
      const { obj, materials } = await loadObjFn(modelName)

      // 创建着色器程序（所有模型共享）
      twgl.setDefaults({
        attribPrefix: 'a_',
      })

      const vs = `#version 300 es
      in vec4 a_position;
      in vec3 a_normal;
      in vec4 a_color;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_world;
      uniform vec3 u_viewWorldPosition;

      out vec3 v_normal;
      out vec3 v_surfaceToView;
      out vec4 v_color;

      void main() {
        vec4 worldPosition = u_world * a_position;
        gl_Position = u_projection * u_view * worldPosition;
        v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
        v_normal = mat3(u_world) * a_normal;
        v_color = a_color;
      }
      `
      const fs = `
      #version 300 es
      precision highp float;

      in vec3 v_normal;
      in vec3 v_surfaceToView;
      in vec4 v_color;

      uniform vec3 diffuse;
      uniform vec3 ambient;
      uniform vec3 emissive;
      uniform vec3 specular;
      uniform float shininess;
      uniform float opacity;
      uniform vec3 u_lightDirection;
      uniform vec3 u_ambientLight;

      out vec4 outColor;

      void main () {
        vec3 normal = normalize(v_normal);
        vec3 surfaceToViewDirection = normalize(v_surfaceToView);

        // 计算漫反射光照
        float ndotl = max(dot(normal, u_lightDirection), 0.0);

        // 计算镜面反射
        vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);
        float ndoth = max(dot(normal, halfVector), 0.0);
        float specularIntensity = pow(ndoth, max(shininess, 1.0));

        // 检查是否为高反射材质（球体）
        float reflectivity = length(specular);
        bool isReflective = reflectivity > 0.8;

        vec3 color;

        if (isReflective) {
          // 球体的特殊处理 - 模拟环境反射
          vec3 reflectDir = reflect(-surfaceToViewDirection, normal);

          // 根据反射方向模拟环境颜色，使用更强烈的颜色
          vec3 environmentColor = vec3(0.15, 0.15, 0.15); // 基础灰色

          // 左侧反射红色 (X < 0)
          if (reflectDir.x < -0.1) {
            float intensity = min(abs(reflectDir.x) * 2.0, 1.0);
            environmentColor = mix(environmentColor, vec3(0.9, 0.2, 0.2), intensity);
          }
          // 右侧反射蓝色 (X > 0)
          else if (reflectDir.x > 0.1) {
            float intensity = min(reflectDir.x * 2.0, 1.0);
            environmentColor = mix(environmentColor, vec3(0.2, 0.2, 0.9), intensity);
          }

          // 底部反射白色 (Y < 0)
          if (reflectDir.y < 0.0) {
            float intensity = min(abs(reflectDir.y) * 1.5, 1.0);
            environmentColor = mix(environmentColor, vec3(0.8, 0.8, 0.8), intensity);
          }

          // 顶部也有一些白色反射
          if (reflectDir.y > 0.5) {
            float intensity = min((reflectDir.y - 0.5) * 2.0, 1.0);
            environmentColor = mix(environmentColor, vec3(0.7, 0.7, 0.7), intensity * 0.8);
          }

          // 组合球体颜色
          vec3 reflectionColor = environmentColor * reflectivity * 1.2;
          vec3 baseReflection = diffuse * 0.05;
          vec3 specularComponent = specular * specularIntensity * 4.0;

          color = emissive + baseReflection + reflectionColor + specularComponent;
        } else {
          // 普通材质的处理
          vec3 baseColor = max(diffuse, vec3(0.08));
          vec3 ambientComponent = ambient * u_ambientLight * 1.5;
          vec3 diffuseComponent = baseColor * max(ndotl, 0.3) * 1.2;
          vec3 specularComponent = specular * specularIntensity * 2.5;

          color = emissive + ambientComponent + diffuseComponent + specularComponent;
        }

        // 确保颜色在合理范围内，但允许一些过曝来增强亮度
        color = clamp(color, 0.0, 1.5);        outColor = vec4(color, opacity * v_color.a);
      }
      `
      const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs])

      // 处理几何体
      const parts = obj.geometries.map(
        ({ material, data }: { material: string; data: Record<string, any> }) => {
          if (data.color && Array.isArray(data.color)) {
            if (data.position?.length === data.color?.length) {
              data.color = { numComponents: 3, data: data.color }
            }
          } else {
            data.color = { value: [1, 1, 1, 1] }
          }
          const bufferInfo = twgl.createBufferInfoFromArrays(gl, data as twgl.Arrays)
          const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo)

          // 获取材质信息并保留材质名称
          const materialData = materials[material as keyof typeof materials] || {}
          materialData.name = material // 确保材质名称被保留

          return {
            material: materialData,
            bufferInfo,
            vao: vao!,
          }
        },
      )

      const extents = glUtils.getGeometriesExtents(obj.geometries)

      // 缓存模型数据
      modelCache.set(modelName, {
        parts,
        extents,
        meshProgramInfo,
      })

      console.log(`模型 ${modelName} 加载完成`)
    } catch (error) {
      console.error(`加载模型 ${modelName} 失败:`, error)
    }
  }

  isLoading.value = false
  console.log('所有模型加载完成')

  // 渲染默认模型
  renderModel(selectedModel.value)
}
let then = 0;
let rotateY = glUtils.degToRad(0);
// 渲染指定模型
function renderModel(modelName: string) {
  const modelData = modelCache.get(modelName)
  if (!modelData || !gl) {
    console.warn(`模型 ${modelName} 未找到或 WebGL 未初始化`)
    return
  }

  const { parts, extents, meshProgramInfo } = modelData
  const range = twgl.v3.subtract(extents.max, extents.min)
  const objOffset = twgl.v3.mulScalar(twgl.v3.add(extents.min, twgl.v3.mulScalar(range, 0.5)), -1)
  const cameraTarget = [0, 0, 0]
  const radius = twgl.v3.length(range)
  // 调整相机位置以获得更好的Cornell Box视角
  const cameraPosition = twgl.v3.add(cameraTarget, [0, 0, radius * 0.8])

  const zNear = radius / 100
  const zFar = radius * 3
  requestAnimationFrame(render)
  function render(time: number) {
    const delay = time * 0.001;
    const delayTime = delay - then;
    then = delay;
    twgl.resizeCanvasToDisplaySize(gl!.canvas as HTMLCanvasElement)
    gl!.viewport(0, 0, gl!.canvas.width, gl!.canvas.height)
    gl!.enable(gl!.DEPTH_TEST)
    gl!.clearColor(0.05, 0.05, 0.05, 1.0) // 深灰色背景而不是纯黑
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT)

    const fieldOfViewRadians = glUtils.degToRad(45) // 稍微缩小视野角度
    const aspect = gl!.canvas.width / gl!.canvas.height
    const projection = twgl.m4.perspective(fieldOfViewRadians, aspect, zNear, zFar)

    const up = [0, 1, 0]
    const camera = twgl.m4.lookAt(cameraPosition, cameraTarget, up)
    const view = twgl.m4.inverse(camera)

    const sharedUniforms = {
      u_lightDirection: twgl.v3.normalize([0.3, 1, 0.8]), // 调整光源方向
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
      u_ambientLight: [0.4, 0.4, 0.4], // 增强环境光
    }

    gl!.useProgram(meshProgramInfo.program)
    twgl.setUniforms(meshProgramInfo, sharedUniforms)

    // 移除旋转，保持静态显示
    rotateY += -0.7 * delayTime;
    let u_world = twgl.m4.rotateZ(twgl.m4.identity(),rotateY)
    u_world = twgl.m4.translate(u_world, objOffset)

    for (const { bufferInfo, vao, material } of parts) {
      gl!.bindVertexArray(vao)

      // 基础材质参数
      const baseMaterial = {
        u_world,
        diffuse: material.diffuse || [0.75, 0.75, 0.75],
        ambient: material.ambient || [0.3, 0.3, 0.3],
        emissive: material.emissive || [0, 0, 0],
        specular: material.specular || [0.2, 0.2, 0.2],
        shininess: material.shininess || 10,
        opacity: material.opacity || 1,
      }

      // 对球体材质进行特殊处理以增强反射效果
      if (material.name && (material.name.toLowerCase().includes('sphere'))) {
        baseMaterial.diffuse = [0.01, 0.01, 0.01]  // 几乎黑色的漫反射
        baseMaterial.ambient = [0.02, 0.02, 0.02]  // 很少的环境光
        baseMaterial.specular = [1.0, 1.0, 1.0]    // 最大镜面反射，确保 length > 0.8
        baseMaterial.shininess = 1000               // 高光泽度
      }

      twgl.setUniforms(meshProgramInfo, baseMaterial)
      twgl.drawBufferInfo(gl!, bufferInfo)
    }
    requestAnimationFrame(render)

  }

  // 更新当前渲染函数
  currentRenderFn = render
}

// 切换模型
function switchModel(newModelName: string) {
  selectedModel.value = newModelName
  renderModel(newModelName)
}

async function main(gl: WebGL2RenderingContext) {
  // 批量加载所有模型
  await loadAllModels(gl)

  // 默认显示Cornell Box Sphere模型
  renderModel('CornellBox-Sphere.obj')
}

onMounted(() => {
  if (!canvas.value) return
  gl = canvas.value.getContext('webgl2')
  if (!gl) {
    console.error('WebGL2 not supported')
    return
  }
  main(gl)
})
</script>

<template>
  <div class="webgl-loadObj">
    <!-- 模型选择器 -->
    <div class="model-selector">
      <label for="model-select">选择模型:</label>
      <select v-model="selectedModel" @change="switchModel(selectedModel)" :disabled="isLoading">
        <option v-for="modelName in modelList" :key="modelName" :value="modelName">
          {{ modelName.replace('.obj', '').replace('CornellBox-', '') }}
        </option>
      </select>
      <div v-if="isLoading" class="loading">正在加载模型...</div>
    </div>

    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>

<style lang="scss" scoped>
.webgl-loadObj {
  position: relative;

  .model-selector {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 100;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;

    label {
      font-size: 14px;
    }

    select {
      padding: 5px;
      border-radius: 3px;
      border: none;
      background: white;
      color: black;
      min-width: 150px;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .loading {
      font-size: 12px;
      color: #ffeb3b;
    }
  }
}
</style>
