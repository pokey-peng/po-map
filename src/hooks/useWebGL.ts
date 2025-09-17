import * as twgl from 'twgl.js';
interface UseWebGLOptions {
  backgroundColor?: number[],
  isTransformColor?: boolean
}
function transformToGLColor(colors: number[]) {
  return [
    colors[0] / 255,
    colors[1] / 255,
    colors[2] / 255,
  ]
}
export function useWebGL(options?: UseWebGLOptions) {
  const canvas = ref<HTMLCanvasElement | null>(null);
  let gl: WebGL2RenderingContext | null = null;
  onMounted(() => {
    if (!canvas.value) {
      throw new Error('Canvas element is not available');
    }
    gl = canvas.value.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 is not supported in this browser');
      return;
    }
    twgl.resizeCanvasToDisplaySize(canvas.value, window.devicePixelRatio);
    gl.viewport(0, 0, canvas.value.width, canvas.value.height);
    const { backgroundColor, isTransformColor } = options || {};
    if (backgroundColor) {
      const bgColor = isTransformColor
        ? transformToGLColor(backgroundColor)
        : backgroundColor;
      gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);
    } else {
      gl.clearColor(0.0, 0.0, 0.0, 0.0); // 默认透明背景
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  })
  function getWebGLContext() {
    return gl;
  }
  return {
    canvas,
    getWebGLContext
  }
}
