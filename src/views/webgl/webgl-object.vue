<script setup lang="ts">
import { onMounted } from 'vue'
import * as twgl from 'twgl.js'
import glShader from '@/lib/webGL/gl-shader.ts'
import glUtils from '@/lib/webGL/gl-utils'
import chroma from 'chroma-js'

const canvas = ref<HTMLCanvasElement | null>(null)
let gl: WebGL2RenderingContext | null = null

const uniformObject = {
  sphereUniforms: {
    u_matrix: twgl.m4.identity(),
    u_colorMult: [0.5, 1, 0.5, 1],
  },
  cubeUniforms: {
    u_matrix: twgl.m4.identity(),
    u_colorMult: [1, 0.5, 0.5, 1],
  },
  coneUniforms: {
    u_matrix: twgl.m4.identity(),
    u_colorMult: [0.5, 0.5, 1, 1],
  },
}
const translationObject = {
  sphere: [0, 0, 0],
  cube: [-40, 0, 0],
  cone: [40, 0, 0],
}
const shapes: Array<{
  bufferInfo: twgl.BufferInfo | null
  vertexArrayObject: WebGLVertexArrayObject | null
}> = []
const objectsToDraw: Array<{
  programInfo: twgl.ProgramInfo | null
  bufferInfo: twgl.BufferInfo | null
  vertexArrayObject: WebGLVertexArrayObject | null
  uniforms: Record<string, any>
}> = [
  {
    programInfo: null,
    bufferInfo: null,
    vertexArrayObject: null,
    uniforms: uniformObject.sphereUniforms,
  },
  {
    programInfo: null,
    bufferInfo: null,
    vertexArrayObject: null,
    uniforms: uniformObject.cubeUniforms,
  },
  {
    programInfo: null,
    bufferInfo: null,
    vertexArrayObject: null,
    uniforms: uniformObject.coneUniforms,
  },
]
const objects: Array<{
  uniforms: Record<string, any>
  translation: number[]
  rotation: number[]
}> = []
// 设置视野角度
const fieldOfViewRadians = glUtils.degToRad(60)
function drawScene(time: number) {
  if (!gl || !canvas.value) return
  time = time * 0.0005

  twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  // 计算投影矩阵
  const aspect = canvas.value.clientWidth / canvas.value.clientHeight
  const projectionMatrix = twgl.m4.perspective(fieldOfViewRadians, aspect, 1, 2000)
  // 使用  计算相机矩阵
  const cameraPosition = [0, 0, 100]
  const target = [0, 0, 0]
  const up = [0, 1, 0]
  const cameraMatrix = twgl.m4.lookAt(cameraPosition, target, up)
  // 从相机矩阵计算视图矩阵
  const viewMatrix = twgl.m4.inverse(cameraMatrix)
  // 计算视图投影矩阵
  const viewProjectionMatrix = twgl.m4.multiply(projectionMatrix, viewMatrix)

  //gl.useProgram(programInfo!.program)

  objects.forEach((object, index) => {
    const translation = object.translation
    const rotation = object.rotation

    // 设置 uniforms
    object.uniforms.u_matrix = glUtils.computeMatrix(
      viewProjectionMatrix,
      translation,
      [
        rotation[0] * time,
        rotation[1] * time,
        rotation[2] * 0, // No rotation around Z-axis
      ],
      [1, 1, 1],
    )
  })
  let lastUsedProgram: WebGLProgram | null = null
  let lastUsedVAO: WebGLVertexArrayObject | null = null
  objectsToDraw.forEach((object) => {
    if (!object.programInfo || !object.bufferInfo || !object.vertexArrayObject) return
    const programInfo = object.programInfo
    if (lastUsedProgram !== programInfo.program) {
      gl?.useProgram(programInfo.program)
      lastUsedProgram = programInfo.program
    }
    if (lastUsedVAO !== object.vertexArrayObject) {
      gl?.bindVertexArray(object.vertexArrayObject)
      lastUsedVAO = object.vertexArrayObject
    }
    twgl.setUniforms(programInfo, object.uniforms)
    twgl.drawBufferInfo(gl as WebGLRenderingContext, object.bufferInfo)
  })
  requestAnimationFrame(drawScene)
}
function main() {
  if (!canvas.value) return
  gl = canvas.value.getContext('webgl2')
  if (!gl) {
    console.error('WebGL 2 not supported')
    return
  }
  twgl.setDefaults({ attribPrefix: 'a_' })
  const createSphereBufferInfo = glUtils.createFlattenedFunc(
    twgl.primitives.createSphereVertices,
    6,
  )
  const createCubeBufferInfo = glUtils.createFlattenedFunc(twgl.primitives.createCubeVertices, 6)
  const createTruncatedConeBufferInfo = glUtils.createFlattenedFunc(
    twgl.primitives.createTruncatedConeVertices,
    6,
  )
  objectsToDraw[0].bufferInfo = createSphereBufferInfo(gl, 10, 12, 6)
  objectsToDraw[1].bufferInfo = createCubeBufferInfo(gl, 20)
  objectsToDraw[2].bufferInfo = createTruncatedConeBufferInfo(gl, 10, 0, 20, 12, 1, true, false)
  const programInfo = twgl.createProgramInfo(gl, [
    glShader.webglObject.vertex,
    glShader.webglObject.fragment,
  ])
  objectsToDraw.forEach((object) => {
    object.programInfo = programInfo
  })

  objectsToDraw[0].vertexArrayObject = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    objectsToDraw[0].bufferInfo,
  )
  objectsToDraw[1].vertexArrayObject = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    objectsToDraw[1].bufferInfo,
  )
  objectsToDraw[2].vertexArrayObject = twgl.createVAOFromBufferInfo(
    gl,
    programInfo,
    objectsToDraw[2].bufferInfo,
  )
  shapes.push({
    bufferInfo: objectsToDraw[0].bufferInfo,
    vertexArrayObject: objectsToDraw[0].vertexArrayObject,
  })
  shapes.push({
    bufferInfo: objectsToDraw[1].bufferInfo,
    vertexArrayObject: objectsToDraw[1].vertexArrayObject,
  })
  shapes.push({
    bufferInfo: objectsToDraw[2].bufferInfo,
    vertexArrayObject: objectsToDraw[2].vertexArrayObject,
  })
  const baseHue = glUtils.rand(360)
  const numObjects = 200
  objectsToDraw.length = 0
  for (let i = 0; i < numObjects; i++) {
    const shape = shapes[glUtils.rand(glUtils.rand(shapes.length)) | 0]
    const object = {
      uniforms: {
        u_matrix: twgl.m4.identity(),
        u_colorMult: chroma
          .hsv(
            glUtils.emod(baseHue + glUtils.rand(360), 360),
            glUtils.rand(0.5, 1),
            glUtils.rand(0.5, 1),
          )
          .gl(),
      },
      translation: [glUtils.rand(-200, 200), glUtils.rand(-200, 200), glUtils.rand(-150, 150)],
      rotation: [glUtils.rand(0.8, 1.2), glUtils.rand(0.8, 1.2), 0],
    }
    objects.push(object)
    objectsToDraw.push({
      programInfo: programInfo,
      bufferInfo: shape.bufferInfo,
      vertexArrayObject: shape.vertexArrayObject,
      uniforms: object.uniforms,
    })
  }
  requestAnimationFrame(drawScene)
}
onMounted(() => {
  main()
  window.addEventListener('resize', () => {
    if (gl) {
      twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)
      drawScene(0)
    }
  })
})
</script>

<template>
  <div class="webgl-object">
    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>
