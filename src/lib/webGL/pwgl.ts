import * as twgl from 'twgl.js'



export function initRenderState(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext
  if (!gl) {
    throw new Error("无法获取WebGL2上下文")
  }

  twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.POLYGON_OFFSET_FILL)
  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  return gl
}
