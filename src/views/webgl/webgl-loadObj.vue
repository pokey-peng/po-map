<script setup lang="ts">
import { ref } from 'vue'
import glUtils from '@/lib/webGL/gl-utils.ts'
import * as twgl from 'twgl.js'

const canvas = ref<HTMLCanvasElement | null>(null)
let gl: WebGL2RenderingContext | null = null
async function main(gl: WebGL2RenderingContext) {
  const loadObjFn = glUtils.createLoadObjFn('/models/CornellBox/')
  const { obj, materials } = await loadObjFn('CornellBox-Sphere.obj')
  twgl.setDefaults({
    attribPrefix: 'a_',
  })
  console.log(obj, materials)
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
    vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

    vec3 effectiveDiffuse = diffuse.rgb * v_color.rgb;
    float effectiveOpacity = v_color.a * opacity;

    outColor = vec4(
        emissive +
        ambient * u_ambientLight +
        effectiveDiffuse * fakeLight +
        specular * pow(specularLight, shininess),
        effectiveOpacity);
  }
  `
  const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs])
  const parts = obj.geometries.map(({ material, data }) => {
    if (data.color && Array.isArray(data.color)) {
      if (data.position?.length === data.color?.length) {
        data.color = { numComponents: 3, data: data.color }
      }
    } else {
      data.color = { value: [1, 1, 1, 1] }
      // 随机颜色
      // const r = glUtils.rand(0.1, 0.9)
      // const g = glUtils.rand(0.1, 0.9)
      // const b = glUtils.rand(0.1, 0.9)
      // data.color = { numComponents: 3, data: [r, g, b] }
    }
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, data as any)
    const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo)
    return {
      material: materials[material as keyof typeof materials],
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
      u_viewWorldPosition: cameraPosition,
    }
    gl?.useProgram(meshProgramInfo.program)
    twgl.setUniforms(meshProgramInfo, sharedUniforms)
    let u_world = twgl.m4.rotationY(time)
    u_world = twgl.m4.translate(u_world, objOffset)

    for (const { bufferInfo, vao, material } of parts) {
      gl?.bindVertexArray(vao)
      twgl.setUniforms(meshProgramInfo, {
        u_world,
        ...material,
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
