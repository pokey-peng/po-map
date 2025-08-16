const vertexShaderSource = `#version 300 es
    // 属性 顶点坐标
    in vec4 a_position;
    // 属性 对应纹理坐标
    in vec2 a_texCoord;
    // 属性 对应纹理索引
    in int a_textureIndex;
    // 属性 对应法线向量
    in vec3 a_normal;
    // 变量 输出传递到片段着色器的纹理坐标
    out vec2 v_texCoord;
    // 变量 输出传递到片段着色器的法线向量
    out vec3 v_normal;
    // 变量 输出传递到片段着色器的纹理索引
    flat out int u_textureIndex;
    // 变量 输出表面到光源的向量
    out vec3 v_surfaceToLight;
    out vec3 v_surfaceToView;

    // 2D 变换矩阵
    uniform mat4 u_matrix;
    // 3d 世界矩阵
    uniform mat4 u_worldMatrix;
    // 点光源位置
    uniform vec3 u_lightWorldPosition;
    // 3d 世界转置逆矩阵
    uniform mat4 u_worldInverseTransposeMatrix;
    // 相机位置
    uniform vec3 u_cameraPosition;
    void main() {
      gl_Position = u_matrix * a_position;
      v_texCoord = a_texCoord;
      u_textureIndex = a_textureIndex;
      v_normal = mat3(u_worldInverseTransposeMatrix) * a_normal; // 将法线向量传递到片段着色器
      vec3 surfaceWorldPosition =(u_worldMatrix * a_position).xyz;
      v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition; // 计算表面到光源的向量
      v_surfaceToView = u_cameraPosition - surfaceWorldPosition; // 计算表面到视点的向量
    }
`
const fragmentShaderSource = `#version 300 es
    precision highp float;
    // 变量 从顶点着色器传递过来的纹理坐标 会进行插值
    in vec2 v_texCoord;
    // 变量 从顶点着色器传递过来的法线向量
    in vec3 v_normal;
    in vec3 v_surfaceToLight;
    in vec3 v_surfaceToView;
    // 使用的纹理序号
    flat in int u_textureIndex;
    // 纹理数组
    uniform sampler2D u_textureArray[6];
    // 光照反向射向量
    uniform vec3 u_lightDirection;
    // uniform vec3 u_lightColor; // 可选：光照颜色
    uniform float u_innerLimit;
    uniform float u_outerLimit;
    // 输出颜色
    out vec4 outColor;
    void main() {
        // 采样纹理
        vec4 texColor;
        if (u_textureIndex == 0) {
            texColor = texture(u_textureArray[0], v_texCoord);
        } else if (u_textureIndex == 1) {
            texColor = texture(u_textureArray[1], v_texCoord);
        } else if (u_textureIndex == 2) {
            texColor = texture(u_textureArray[2], v_texCoord);
        } else if (u_textureIndex == 3) {
            texColor = texture(u_textureArray[3], v_texCoord);
        } else if (u_textureIndex == 4) {
            texColor = texture(u_textureArray[4], v_texCoord);
        } else if (u_textureIndex == 5) {
            texColor = texture(u_textureArray[5], v_texCoord);
        } else {
            texColor = vec4(1.0, 1.0, 1.0, 1.0); // 默认白色
        }

        // 归一化向量
        vec3 normal = normalize(v_normal);
        vec3 lightDirection = normalize(v_surfaceToLight);
        vec3 viewDirection = normalize(v_surfaceToView);

        // 聚光灯计算
        // 计算光线方向与聚光灯方向的夹角余弦值
        float dotFromDirection = dot(-lightDirection, normalize(u_lightDirection));

        // 使用smoothstep实现平滑的聚光灯衰减
        float spotFactor = smoothstep(u_outerLimit, u_innerLimit, dotFromDirection);

        // 简单高光效果
        vec3 halfVector = normalize(lightDirection + viewDirection);
        float specular = pow(max(dot(normal, halfVector), 0.0), 64.0);

        float light = dot(normal, -lightDirection);
        // 应用聚光灯效果：基础纹理 * 聚光灯强度 + 高光
        vec3 finalColor = texColor.rgb * spotFactor*light + specular * spotFactor * vec3(1.0);

        outColor = vec4(finalColor, texColor.a);

        // Alpha测试
        if (outColor.a < 0.05) discard;
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

  // const primitiveType = gl.TRIANGLES
  // const offset = 0
  // const count = 36 // 6个面 × 2个三角形 × 3个顶点
  // gl.drawArrays(primitiveType, offset, count)
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

export function setNormals(gl: WebGL2RenderingContext) {
  const normals = new Float32Array([
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1, // 前面法线
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1, // 后面法线
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0, // 左面法线
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0, // 右面法线
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0, // 底面法线
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0, // 顶面法线
  ])
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
}
