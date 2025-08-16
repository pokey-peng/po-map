<script setup lang="ts">
import { ref } from 'vue'
import { loadStaticFile } from '@/utils'
import glUtils from '@/lib/webGL/gl-utils.ts'
import * as twgl from 'twgl.js'

const canvas = ref<HTMLCanvasElement | null>(null)
let gl: WebGL2RenderingContext | null = null
async function main(gl: WebGL2RenderingContext) {
  const objText = await loadStaticFile('/models/CornellBox/CornellBox-Sphere.obj')
  const obj = glUtils.parseObj(objText)
  twgl.setDefaults({
    attribPrefix: 'a_',
  })
  console.log(obj)
  const vs = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;
  in vec4 a_color;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  out vec3 v_normal;
  out vec4 v_color;

  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_normal = mat3(u_world) * a_normal;
    v_color = a_color;
  }
  `
  const fs = `
  #version 300 es
  precision highp float;

  in vec3 v_normal;
  in vec4 v_color;

  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;

  out vec4 outColor;

  void main () {
    vec3 normal = normalize(v_normal);
    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    vec4 diffuse = u_diffuse * v_color;
    outColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
  }
  `
  const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs])
  const parts = obj.geometries.map(({ data }) => {
    if (data.color && Array.isArray(data.color)) {
      if (data.position?.length === data.color?.length) {
        data.color = { numComponents: 3, data: data.color }
      }
    } else {
      data.color = { value: [1, 1, 1, 1] }
    }
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, data as any)
    const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo)
    return {
      material: {
        u_diffuse: [1, 1, 1, 1],
      },
      bufferInfo,
      vao,
    }
  })

  const extents = glUtils.getGeometriesExtents(obj.geometries)
  const range = twgl.v3.subtract(extents.max, extents.min)
  const objOffset = twgl.v3.mulScalar(twgl.v3.add(extents.min, twgl.v3.mulScalar(range, 0.5)), -1)
  const cameraTarget = [0, 0, 0]
  const radius = twgl.v3.length(range) * 1.2
  const cameraPosition = twgl.v3.add(cameraTarget, [0, 0, radius])

  const zNear = radius / 100
  const zFar = radius * 3

  function render(time: number) {
    time *= 0.001

    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)
    gl?.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl?.enable(gl.DEPTH_TEST)

    const fieldOfViewRadians = glUtils.degToRad(60)
    const aspect = gl.canvas.width / gl.canvas.height
    const projection = twgl.m4.perspective(fieldOfViewRadians, aspect, zNear, zFar)

    const up = [0, 1, 0]
    const camera = twgl.m4.lookAt(cameraPosition, cameraTarget, up)

    const view = twgl.m4.inverse(camera)

    const sharedUniforms = {
      u_lightDirection: twgl.v3.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    }
    gl?.useProgram(meshProgramInfo.program)
    twgl.setUniforms(meshProgramInfo, sharedUniforms)
    let u_world = twgl.m4.rotationY(time)
    u_world = twgl.m4.translate(u_world, objOffset)

    for (const { bufferInfo, vao, material } of parts) {
      gl?.bindVertexArray(vao)
      twgl.setUniforms(meshProgramInfo, {
        u_world,
        u_diffuse: material.u_diffuse,
      })
      twgl.drawBufferInfo(gl, bufferInfo)
    }
    //requestAnimationFrame(render)
  }
  // requestAnimationFrame(render)
  render(1)
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
    <canvas id="webgl-canvas" class="wh-full" ref="canvas"></canvas>
  </div>
</template>

<style lang="scss" scoped>
.webgl-loadObj {
}
</style>
