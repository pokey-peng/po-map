const vertexShaderSource = `#version 300 es
    out vec4 v_color;
    in vec4 a_color;
    in vec2 a_position;
    uniform vec2 u_resolution;

    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1,-1), 0, 1);
      v_color = a_color;
    }
`

const fragmentShaderSource = `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    in vec4 v_color;
    out vec4 outColor;

    void main() {
        outColor = v_color;
    }
`
function createShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
  const shader = gl.createShader(type) as WebGLShader
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  const isSuccess = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (isSuccess) {
    return shader
  }
  console.error('着色器编译失败:', gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

export function createProgram(gl: WebGL2RenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource) as WebGLShader
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource) as WebGLShader
  const program = gl.createProgram() as WebGLProgram
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const isSuccess = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (isSuccess) {
    return program
  }
  console.error('程序链接失败:', gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
  // 获取浏览器显示的画布的CSS像素值
  const displayWidth = canvas.clientWidth
  const displayHeight = canvas.clientHeight

  // 检查画布大小是否相同。
  const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

  if (needResize) {
    // 使画布大小相同
    canvas.width = displayWidth
    canvas.height = displayHeight
  }

  return needResize
}

export function randomInt(range: number): number {
  // 返回0-range范围内的随机整数
  return Math.floor(Math.random() * range)
}

/**
 *
 * @param gl webGL上下文
 * @param program 着色器程序
 * @param x 矩形左上角x坐标
 * @param y 矩形左上角坐标
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param color 矩形颜色
 */
export function drawRectangle(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number, number],
) {
  const x1 = x
  const y1 = y
  const x2 = x + width
  const y2 = y + height
  const positions = new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2])
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  gl.uniform4f(gl.getUniformLocation(program, 'u_color'), color[0], color[1], color[2], color[3])

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = positions.length / 2
  gl.drawArrays(primitiveType, offset, count)
}

export function drawTriangle(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  position: number[],
  color: [number, number, number, number],
) {
  const positions = new Float32Array(position)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  gl.uniform4f(gl.getUniformLocation(program, 'u_color'), color[0], color[1], color[2], color[3])

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = positions.length / 2
  gl.drawArrays(primitiveType, offset, count)
}
