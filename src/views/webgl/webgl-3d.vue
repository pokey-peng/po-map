<script setup lang="ts">
import { useWebGL } from '@/hooks/useWebGL';
import {initGL} from './webgl-3d.ts'
const { canvas, getWebGLContext } = useWebGL({
  backgroundColor: [255, 0, 0],
  isTransformColor: true
});
const gl = getWebGLContext();

onMounted(() => {
  initGL(gl as WebGL2RenderingContext);
})
</script>

<template>
  <div class="webgl-3d">
    <canvas ref="canvas" class="w-full h-full"></canvas>
  </div>
</template>

<style lang="scss" scoped></style>
