const vertexShaderSource = `#version 300 es
    in vec4 a_position;

    void main() {
      gl_Position = a_position;
    }
`

const fragmentShaderSource = `#version 300 es
    precision highp float;

    out vec4 outColor;

    void main() {
        outColor = vec4(1.0, 0.0, 0.5, 1.0);
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
