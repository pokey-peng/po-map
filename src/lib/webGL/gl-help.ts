const vertexShaderSource = `#version 300 es
    out vec4 v_color;
    in vec4 a_color;
    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;

    // 3D 变换矩阵
    uniform mat4 u_matrix;
    // 2D 变换矩阵
    uniform mat3 u_matrix2D;
    void main() {
      gl_Position = vec4((u_matrix2D * vec3(a_position, 1.0)).xy, 0.0, 1.0);
      v_color = a_color;
      v_texCoord = a_texCoord;
    }
`
const fragmentShaderSource = `#version 300 es
    precision highp float;
    in vec4 v_color;
    in vec2 v_texCoord;
    out vec4 outColor;
    uniform sampler2D u_texture;
    uniform sampler2D u_texture1;
    void main() {
        vec4 color = texture(u_texture1, v_texCoord);
        vec4 color1 = texture(u_texture, v_texCoord);
        outColor = mix(color, color1, 0.5);
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

  x: number,
  y: number,
  width: number,
  height: number,
  color?: [number, number, number, number],
  program?: WebGLProgram,
) {
  const x1 = x
  const y1 = y
  const x2 = x + width
  const y2 = y + height
  const positions = new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2])
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = positions.length / 2
  gl.drawArrays(primitiveType, offset, count)
}

export function drawTriangle(
  gl: WebGL2RenderingContext,
  position: number[],
  color?: [number, number, number, number],
  program?: WebGLProgram,
) {
  const positions = new Float32Array(position)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = positions.length / 2
  gl.drawArrays(primitiveType, offset, count)
}

export function createAndSetupTexture(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture() as WebGLTexture
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // 设置纹理过滤器
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  return texture
}

export async function loadImages(imgList: string[]) {
  const images: HTMLImageElement[] = []
  const promises = imgList.map((src) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.src = src
      img.onload = () => resolve(img)
      img.onerror = (error) => reject(error)
    })
  })

  return Promise.all(promises).then((loadedImages) => {
    images.push(...loadedImages)
    return images
  })
}
