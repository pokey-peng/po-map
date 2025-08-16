import * as twgl from 'twgl.js'
interface GeometryData {
  color?:
    | number[]
    | {
        numComponents?: number
        data?: number[]
        value?: number[]
      }
  normal?: number[]
  position?: number[]
  texcoord?: number[]
}
interface Geometry {
  data: GeometryData
  groups: string[]
  material: string
  object: string
}
export default {
  degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  },
  computeMatrix(
    matrix: twgl.m4.Mat4,
    translation: number[] = [0, 0, 0],
    rotation: number[] = [0, 0, 0],
    scale: number[] = [1, 1, 1],
  ): twgl.m4.Mat4 {
    let mat = twgl.m4.translate(matrix, translation)
    mat = twgl.m4.rotateX(mat, rotation[0])
    mat = twgl.m4.rotateY(mat, rotation[1])
    mat = twgl.m4.rotateZ(mat, rotation[2])
    mat = twgl.m4.scale(mat, scale)
    return mat
  },

  createFlattenedFunc(createVerticesFunc: Function, vertsPerColor: number) {
    function createFlattenedVertices(
      gl: WebGLRenderingContext,
      vertices: any,
      vertsPerColor: number,
    ) {
      let last: number = 128
      return twgl.createBufferInfoFromArrays(
        gl,
        twgl.primitives.makeRandomVertexColors(twgl.primitives.deindexVertices(vertices), {
          vertsPerColor: vertsPerColor || 1,
          rand: function (ndx, channel) {
            if (channel === 0) {
              last = (128 + Math.random() * 128) | 0
            }
            return channel < 3 ? last : 255
          },
        }),
      )
    }
    return function (gl: WebGLRenderingContext, ...args: any[]) {
      const arrays = createVerticesFunc(...args)
      return createFlattenedVertices(gl, arrays, vertsPerColor)
    }
  },
  rand(num1: number, num2: number = num1): number {
    if (num2 === num1) {
      return Math.random() * num1
    }
    return Math.random() * (num2 - num1) + num1
  },
  emod(num: number, mod: number): number {
    return num >= 0 ? num % mod : (mod - (-num % mod)) % mod
  },
  parseObj(text: string) {
    const objPositions = [[0, 0, 0]]
    const objTexcoords = [[0, 0]]
    const objNormals = [[0, 0, 0]]
    const objColors = [[0, 0, 0]]

    const objVertexData = [objPositions, objTexcoords, objNormals, objColors]
    let webglVertexData: number[][] = [
      [], // position
      [], // texcoords
      [], // normals
      [], // colors
    ]
    const materialLibs: string[] = []
    const geometries: Geometry[] = []
    let geometry: Geometry | undefined
    let groups = ['default']
    let material = 'default'
    let object = 'default'

    const noop = () => {}

    function newGeometry() {
      if (geometry && geometry.data.position?.length) {
        geometry = undefined
      }
    }

    function setGeometry() {
      if (!geometry) {
        const position: number[] = []
        const texcoord: number[] = []
        const normal: number[] = []
        const color: number[] = []
        webglVertexData = [position, texcoord, normal, color]
        geometry = {
          object,
          groups,
          material,
          data: {
            position,
            texcoord,
            normal,
            color,
          },
        }
        geometries.push(geometry)
      }
    }

    function addVertex(vert: string) {
      if (!geometry) {
        setGeometry()
      }
      const ptn = vert.split('/')
      ptn.forEach((objIndexStr, i) => {
        if (!objIndexStr) {
          return
        }
        const objIndex = parseInt(objIndexStr)
        const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length)
        webglVertexData[i].push(...objVertexData[i][index])
        if (
          i === 0 &&
          objColors.length > 1 &&
          geometry?.data.color &&
          Array.isArray(geometry.data.color)
        ) {
          geometry.data.color.push(...objColors[objIndex])
        }
      })
    }

    const keywords: Record<
      string,
      ((parts: string[], unparsedArgs: string) => void) | ((parts: string[]) => void)
    > = {
      v(parts: string[]) {
        if (parts.length > 3) {
          objPositions.push(parts.slice(0, 3).map(parseFloat))
          objColors.push(parts.slice(3).map(parseFloat))
        } else {
          objPositions.push(parts.map(parseFloat))
        }
      },
      vn(parts: string[]) {
        objNormals.push(parts.map(parseFloat))
      },
      vt(parts: string[]) {
        objTexcoords.push(parts.slice(0, 2).map(parseFloat))
      },
      f(parts: string[]) {
        setGeometry()
        const numTriangles = parts.length - 2
        for (let tri = 0; tri < numTriangles; ++tri) {
          addVertex(parts[0])
          addVertex(parts[tri + 1])
          addVertex(parts[tri + 2])
        }
      },
      s: noop,
      mtllib(parts: string[], unparsedArgs: string) {
        materialLibs.push(unparsedArgs)
      },
      usemetl(parts: string[], unparsedArgs: string) {
        material = unparsedArgs
        newGeometry()
      },
      g(parts: string[]) {
        groups = parts
      },
      o(parts: string[], unparsedArgs: string) {
        object = unparsedArgs
        newGeometry()
      },
    }

    const keywordRE = /(\w*)(?: )*(.*)/
    const lines = text.split('\n')
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
      const line = lines[lineNo].trim()
      if (line == '' || line.startsWith('#')) {
        continue // skip empty lines and comments
      }
      const m = keywordRE.exec(line)
      if (!m) {
        continue
      }
      const [, keyword, unparsedArgs] = m
      const parts = line
        .split(/\s+/)
        .slice(1)
        .map((s) => s.trim())
      const handler = keywords[keyword]
      if (!handler) {
        console.warn(`Unknown keyword "${keyword}" at line ${lineNo + 1}`)
        continue
      }
      handler(parts, unparsedArgs)
    }
    for (const geometry of geometries) {
      geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([key, array]) => array.length > 0),
      )
    }

    return {
      geometries,
      materialLibs,
    }
  },
  getExtents(positions: number[]): { min: number[]; max: number[] } {
    const min = positions.slice(0, 3)
    const max = positions.slice(0, 3)
    for (let i = 3; i < positions.length; i += 3) {
      for (let j = 0; j < 3; ++j) {
        const v = positions[i + j]
        min[j] = Math.min(v, min[j])
        max[j] = Math.max(v, max[j])
      }
    }
    return { min, max }
  },
  getGeometriesExtents(geometries: Geometry[]): { min: number[]; max: number[] } {
    return geometries.reduce(
      ({ min, max }, { data }) => {
        if (!data.position || data.position.length === 0) {
          return { min, max }
        }
        const minMax = this.getExtents(data.position)
        return {
          min: min.map((v, i) => Math.min(v, minMax.min[i])),
          max: max.map((v, i) => Math.max(v, minMax.max[i])),
        }
      },
      {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
      },
    )
  },
}
