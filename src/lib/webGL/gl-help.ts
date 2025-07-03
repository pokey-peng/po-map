const vertexShaderSource = `#version 300 es
    // 属性 顶点坐标
    in vec4 a_position;
    // 属性 对应纹理坐标
    in vec2 a_texCoord;
    // 属性 对应纹理索引
    in int a_textureIndex;
    // 变量 输出传递到片段着色器的纹理坐标
    out vec2 v_texCoord;
    // 变量 输出传递到片段着色器的纹理索引
    flat out int u_textureIndex;

    // 2D 变换矩阵
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * a_position;
      v_texCoord = a_texCoord;
      u_textureIndex = a_textureIndex;
    }
`
const fragmentShaderSource = `#version 300 es
    precision highp float;
    // 变量 从顶点着色器传递过来的纹理坐标 会进行插值
    in vec2 v_texCoord;
    // 使用的纹理序号
    flat in int u_textureIndex;
    // 纹理数组
    uniform sampler2D u_textureArray[6];
    // 输出颜色
    out vec4 outColor;
    void main() {
        switch (u_textureIndex) {
        case 0:
            outColor = texture(u_textureArray[0], v_texCoord);
            break;
        case 1:
            outColor = texture(u_textureArray[1], v_texCoord);
            break;
        case 2:
            outColor = texture(u_textureArray[2], v_texCoord);
            break;
        case 3:
            outColor = texture(u_textureArray[3], v_texCoord);
            break;
        case 4:
            outColor = texture(u_textureArray[4], v_texCoord);
            break;
        case 5:
            outColor = texture(u_textureArray[5], v_texCoord);
            break;
        default:
            outColor = vec4(0.0, 0.0, 0.0, 0.0);
            break;
        }
        // 如果纹理没有被设置, 则输出透明色
        if (outColor.a < 0.1) {
            outColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
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
) {
  const x1 = x
  const y1 = y
  const x2 = x + width
  const y2 = y + height
  // 矩阵不需要格式化, 设置eslint忽略注释
  //  /* eslint-disable*/
  const positions = new Float32Array([
    x1,
    y1,
    0,
    x2,
    y1,
    0,
    x1,
    y2,
    0,
    x1,
    y2,
    0,
    x2,
    y1,
    0,
    x2,
    y2,
    0,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = positions.length / 2
  gl.drawArrays(primitiveType, offset, count)
}

export function drawCube(
  gl: WebGL2RenderingContext,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
) {
  const positions = new Float32Array([
    // 前面 (正Z方向) - 逆时针顺序
    x,
    y,
    z + depth,
    x + width,
    y,
    z + depth,
    x + width,
    y + height,
    z + depth,
    x,
    y,
    z + depth,
    x + width,
    y + height,
    z + depth,
    x,
    y + height,
    z + depth,

    // 后面 (负Z方向) - 逆时针顺序
    x + width,
    y,
    z,
    x,
    y,
    z,
    x,
    y + height,
    z,
    x + width,
    y,
    z,
    x,
    y + height,
    z,
    x + width,
    y + height,
    z,

    // 左面 (负X方向) - 逆时针顺序
    x,
    y,
    z,
    x,
    y,
    z + depth,
    x,
    y + height,
    z + depth,
    x,
    y,
    z,
    x,
    y + height,
    z + depth,
    x,
    y + height,
    z,

    // 右面 (正X方向) - 逆时针顺序
    x + width,
    y,
    z + depth,
    x + width,
    y,
    z,
    x + width,
    y + height,
    z,
    x + width,
    y,
    z + depth,
    x + width,
    y + height,
    z,
    x + width,
    y + height,
    z + depth,

    // 底面 (负Y方向) - 逆时针顺序
    x,
    y,
    z,
    x + width,
    y,
    z,
    x + width,
    y,
    z + depth,
    x,
    y,
    z,
    x + width,
    y,
    z + depth,
    x,
    y,
    z + depth,

    // 顶面 (正Y方向) - 逆时针顺序
    x,
    y + height,
    z + depth,
    x + width,
    y + height,
    z + depth,
    x + width,
    y + height,
    z,
    x,
    y + height,
    z + depth,
    x + width,
    y + height,
    z,
    x,
    y + height,
    z,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = 36 // 6个面 × 2个三角形 × 3个顶点
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
