/**
 * WebGL 中 2D 和 3D 操作的矩阵工具类。
 *
 * 本模块提供两个工具类：
 * - M3: 用于使用 3x3 变换矩阵进行 2D 矩阵操作
 * - M4: 用于使用 4x4 变换矩阵进行 3D 矩阵操作
 *
 * 两个类都提供静态方法来创建和操作 WebGL 应用程序中常用的变换矩阵。
 * 所有矩阵都以列主序形式表示为 Float32Array。
 *
 * 使用示例：
 * ```typescript
 * // 2D 变换
 * const matrix2D = M3.multiplyMany(
 *   M3.translation(100, 50),
 *   M3.rotation(Math.PI / 4),
 *   M3.scaling(2, 2)
 * );
 *
 * // 3D 变换
 * const matrix3D = M4.multiplyMany(
 *   M4.translation(100, 50, 25),
 *   M4.rotationY(Math.PI / 4),
 *   M4.scaling(2, 2, 2)
 * );
 * ```
 */
class M3 {
  static identity(): Float32Array {
    return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
  }
  /**
   * 为 WebGL 创建 2D 投影矩阵。
   *
   * 此函数生成一个 3x3 矩阵，将像素坐标转换为 WebGL 中的裁剪空间坐标，
   * 其中裁剪空间坐标在 x 和 y 方向上的范围都是 -1 到 1。
   *
   * @param width - 渲染区域的宽度（像素）
   * @param height - 渲染区域的高度（像素）
   * @returns 长度为 9 的 Float32Array 形式的 3x3 投影矩阵
   *
   */
  static projection(width: number, height: number): Float32Array {
    return new Float32Array([2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1])
  }
  /**
   * 为 2D 变换创建平移矩阵。
   *
   * 此函数生成一个 3x3 矩阵，通过指定的 x 和 y 偏移量在 2D 空间中平移点。
   *
   * @param tx - x 方向的平移偏移量
   * @param ty - y 方向的平移偏移量
   * @returns 长度为 9 的 Float32Array 形式的 3x3 平移矩阵
   *
   */
  static translation(tx: number, ty: number): Float32Array {
    return new Float32Array([1, 0, 0, 0, 1, 0, tx, ty, 1])
  }
  /**
   * 为 2D 变换创建旋转矩阵。
   *
   * 此函数生成一个 3x3 矩阵，通过指定的角度在 2D 空间中旋转点（以弧度为单位）。
   *
   * @param angle - 旋转角度（弧度）
   * @returns 长度为 9 的 Float32Array 形式的 3x3 旋转矩阵
   *
   * @example
   * const rotationMatrix = M3.rotation(45);
   * // rotationMatrix 将是一个表示旋转矩阵的 Float32Array
   * [
   *   cos(angle), -sin(angle), 0,
   *   sin(angle), cos(angle), 0,
   *   0, 0, 1
   * ]
   */
  static rotation(angle: number): Float32Array {
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    return new Float32Array([cos, -sin, 0, sin, cos, 0, 0, 0, 1])
  }
  /**
   * 为 2D 变换创建缩放矩阵。
   *
   * 此函数生成一个 3x3 矩阵，通过指定的 x 和 y 缩放因子在 2D 空间中缩放点。
   *
   * @param sx - x 方向的缩放因子
   * @param sy - y 方向的缩放因子
   * @returns 长度为 9 的 Float32Array 形式的 3x3 缩放矩阵
   */
  static scaling(sx: number, sy: number): Float32Array {
    return new Float32Array([sx, 0, 0, 0, sy, 0, 0, 0, 1])
  }
  /**
   * 乘以两个 3x3 矩阵。
   *
   * 此函数接受两个表示为 Float32Array 的 3x3 矩阵，并返回它们的乘积作为新的 Float32Array。
   *
   * @param a - 长度为 9 的 Float32Array 形式的第一个矩阵
   * @param b - 长度为 9 的 Float32Array 形式的第二个矩阵
   * @returns 两个矩阵的乘积作为新的长度为 9 的 Float32Array
   */
  static multiply(b: Float32Array, a: Float32Array): Float32Array {
    const result = new Float32Array(9)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i * 3 + j] =
          a[i * 3 + 0] * b[0 * 3 + j] + a[i * 3 + 1] * b[1 * 3 + j] + a[i * 3 + 2] * b[2 * 3 + j]
      }
    }
    return result
  }
  /**
   * 乘以多个 3x3 矩阵。
   *
   * 此函数接受一个基础矩阵和任意数量的附加矩阵，并返回它们的乘积作为新的 Float32Array。
   *
   * @param a - 长度为 9 的 Float32Array 形式的基础矩阵
   * @param b - 长度为 9 的 Float32Array 形式的附加矩阵
   * @returns 矩阵的乘积作为新的长度为 9 的 Float32Array
   */
  static multiplyMany(a: Float32Array, ...b: Float32Array[]): Float32Array {
    let result = a
    for (let i = 0; i < b.length; i++) {
      result = M3.multiply(result, b[i])
    }
    return result
  }

  /**
   * 使用 3x3 变换矩阵变换一个点。
   *
   * 此函数接受一个变换矩阵和一个表示为 Float32Array 的点，并返回变换后的点作为新的 Float32Array。
   *
   * @param matrix - 长度为 9 的 Float32Array 形式的变换矩阵
   * @param point - 要变换的点，长度为 3 的 Float32Array
   * @returns 变换后的点，长度为 3 的 Float32Array
   */
  static transformPoint(matrix: Float32Array, point: Float32Array): Float32Array {
    const x = point[0]
    const y = point[1]
    const transformedPoint = new Float32Array(3)
    transformedPoint[0] = matrix[0] * x + matrix[3] * y + matrix[6]
    transformedPoint[1] = matrix[1] * x + matrix[4] * y + matrix[7]
    transformedPoint[2] = 1
    return transformedPoint
  }

  static translate(matrix: Float32Array, tx: number, ty: number): Float32Array {
    return M3.multiply(matrix, M3.translation(tx, ty))
  }

  static rotate(matrix: Float32Array, angle: number): Float32Array {
    return M3.multiply(matrix, M3.rotation(angle))
  }

  static scale(matrix: Float32Array, sx: number, sy: number): Float32Array {
    return M3.multiply(matrix, M3.scaling(sx, sy))
  }
}

/**
 * WebGL 中 3D 矩阵操作的工具类。
 *
 * 此类提供静态方法来创建和操作 3D WebGL 应用程序中常用的 4x4 变换矩阵。
 * 所有矩阵都以列主序形式表示为长度为 16 的 Float32Array。
 *
 * 主要功能包括：
 * - 创建投影矩阵（透视、正交）
 * - 创建视图矩阵（lookAt、相机定位）
 * - 创建变换矩阵（平移、旋转、缩放）
 * - 矩阵乘法来组合变换
 * - 使用矩阵变换点和向量
 *
 * 使用示例：
 * ```typescript
 * // 创建一个先缩放、再旋转、最后平移的变换矩阵
 * const matrix = M4.multiplyMany(
 *   M4.translation(100, 50, 25),     // 第三步：平移 (100, 50, 25)
 *   M4.rotationY(45),                // 第二步：绕 Y 轴旋转 45 度
 *   M4.scaling(2, 2, 2)              // 第一步：缩放 2 倍
 * );
 *
 * // 使用矩阵变换一个点
 * const transformedPoint = M4.transformPoint(matrix, new Float32Array([10, 20, 30, 1]));
 * ```
 */
class M4 {
  /**
   * 创建 4x4 单位矩阵。
   * @returns 长度为 16 的 Float32Array 形式的 4x4 单位矩阵
   */
  static identity(): Float32Array {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  }

  /**
   * 创建透视投影矩阵。
   * @param fov - 视野角度（弧度）
   * @param aspect - 宽高比（宽度/高度）
   * @param near - 近裁剪平面距离
   * @param far - 远裁剪平面距离
   * @returns 4x4 透视投影矩阵
   */
  static perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov) // 计算焦距
    const rangeInv = 1 / (near - far) // 计算近远裁剪平面的范围倒数, 用来归一化深度值

    return new Float32Array([
      f / aspect, // 水平缩放
      0,
      0,
      0,
      0,
      f, // 垂直缩放
      0,
      0,
      0,
      0,
      (near + far) * rangeInv, // 深度归一化
      -1, // 透视除法
      0,
      0,
      near * far * rangeInv * 2, // 深度归一化
      0,
    ])
  }

  /**
   * 创建正交投影矩阵。
   * @param left - 视锥体左边界
   * @param right - 视锥体右边界
   * @param bottom - 视锥体底边界
   * @param top - 视锥体顶边界
   * @param near - 近裁剪平面距离
   * @param far - 远裁剪平面距离
   * @returns 4x4 正交投影矩阵
   */
  static orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Float32Array {
    return new Float32Array([
      2 / (right - left),
      0,
      0,
      0,
      0,
      2 / (top - bottom),
      0,
      0,
      0,
      0,
      2 / (near - far),
      0,
      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      (near + far) / (near - far),
      1,
    ])
  }

  /**
   * 为 3D 变换创建平移矩阵。
   * @param tx - x 方向的平移偏移量
   * @param ty - y 方向的平移偏移量
   * @param tz - z 方向的平移偏移量
   * @returns 4x4 平移矩阵
   */
  static translation(tx: number, ty: number, tz: number): Float32Array {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1])
  }

  /**
   * 创建绕 X 轴的旋转矩阵。
   * @param angle - 旋转角度（弧度）
   * @returns 4x4 旋转矩阵
   */
  static rotationX(angle: number): Float32Array {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    return new Float32Array([1, 0, 0, 0, 0, cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1])
  }

  /**
   * 创建绕 Y 轴的旋转矩阵。
   * @param angle - 旋转角度（弧度）
   * @returns 4x4 旋转矩阵
   */
  static rotationY(angle: number): Float32Array {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    return new Float32Array([cos, 0, -sin, 0, 0, 1, 0, 0, sin, 0, cos, 0, 0, 0, 0, 1])
  }

  /**
   * 创建绕 Z 轴的旋转矩阵。
   * @param angle - 旋转角度（弧度）
   * @returns 4x4 旋转矩阵
   */
  static rotationZ(angle: number): Float32Array {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    return new Float32Array([cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  }

  /**
   * 根据欧拉角创建旋转矩阵（XYZ 顺序）。
   * @param x - 绕 X 轴的旋转角度（弧度）
   * @param y - 绕 Y 轴的旋转角度（弧度）
   * @param z - 绕 Z 轴的旋转角度（弧度）
   * @returns 4x4 旋转矩阵
   */
  static rotationXYZ(x: number, y: number, z: number): Float32Array {
    return M4.multiplyMany(M4.rotationZ(z), M4.rotationY(y), M4.rotationX(x))
  }

  /**
   * 为 3D 变换创建缩放矩阵。
   * @param sx - x 方向的缩放因子
   * @param sy - y 方向的缩放因子
   * @param sz - z 方向的缩放因子
   * @returns 4x4 缩放矩阵
   */
  static scaling(sx: number, sy: number, sz: number): Float32Array {
    return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])
  }

  /**
   * 创建 lookAt 视图矩阵。
   * @param cameraPosition - 相机位置 [x, y, z]
   * @param target - 目标位置 [x, y, z]
   * @param up - 上方向向量 [x, y, z]
   * @returns 4x4 视图矩阵
   */
  static lookAt(cameraPosition: number[], target: number[], up: number[]): Float32Array {
    const zAxis = M4.normalize(M4.subtractVectors(cameraPosition, target))
    const xAxis = M4.normalize(M4.cross(up, zAxis))
    const yAxis = M4.normalize(M4.cross(zAxis, xAxis))

    return new Float32Array([
      xAxis[0],
      xAxis[1],
      xAxis[2],
      0,
      yAxis[0],
      yAxis[1],
      yAxis[2],
      0,
      zAxis[0],
      zAxis[1],
      zAxis[2],
      0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ])
  }

  /**
   * 乘以两个 4x4 矩阵。
   * @param a - 第一个矩阵
   * @param b - 第二个矩阵
   * @returns 两个矩阵的乘积
   */
  static multiply(b: Float32Array, a: Float32Array): Float32Array {
    const result = new Float32Array(16)

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j]
      }
    }
    return result
  }

  /**
   * 乘以多个 4x4 矩阵。
   * @param a - 基础矩阵
   * @param matrices - 要相乘的附加矩阵
   * @returns 所有矩阵的乘积
   */
  static multiplyMany(a: Float32Array, ...matrices: Float32Array[]): Float32Array {
    let result = a
    for (const matrix of matrices) {
      result = M4.multiply(result, matrix)
    }
    return result
  }

  /**
   * 使用 4x4 变换矩阵变换一个点。
   * @param matrix - 变换矩阵
   * @param point - 要变换的点 [x, y, z, w]
   * @returns 变换后的点
   */
  static transformPoint(matrix: Float32Array, point: Float32Array): Float32Array {
    const x = point[0]
    const y = point[1]
    const z = point[2]
    const w = point[3] || 1

    return new Float32Array([
      matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
      matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
      matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
      matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w,
    ])
  }

  /**
   * 使用 4x4 变换矩阵变换一个向量（忽略平移）。
   * @param matrix - 变换矩阵
   * @param vector - 要变换的向量 [x, y, z]
   * @returns 变换后的向量
   */
  static transformVector(matrix: Float32Array, vector: Float32Array): Float32Array {
    const x = vector[0]
    const y = vector[1]
    const z = vector[2]

    return new Float32Array([
      matrix[0] * x + matrix[4] * y + matrix[8] * z,
      matrix[1] * x + matrix[5] * y + matrix[9] * z,
      matrix[2] * x + matrix[6] * y + matrix[10] * z,
    ])
  }

  /**
   * 求 4x4 矩阵的逆矩阵。
   * @param matrix - 要求逆的矩阵
   * @returns 逆矩阵，如果不可逆则返回 null
   */
  static inverse(matrix: Float32Array): Float32Array | null {
    const m = matrix
    const inv = new Float32Array(16)

    inv[0] =
      m[5] * m[10] * m[15] -
      m[5] * m[11] * m[14] -
      m[9] * m[6] * m[15] +
      m[9] * m[7] * m[14] +
      m[13] * m[6] * m[11] -
      m[13] * m[7] * m[10]

    inv[4] =
      -m[4] * m[10] * m[15] +
      m[4] * m[11] * m[14] +
      m[8] * m[6] * m[15] -
      m[8] * m[7] * m[14] -
      m[12] * m[6] * m[11] +
      m[12] * m[7] * m[10]

    inv[8] =
      m[4] * m[9] * m[15] -
      m[4] * m[11] * m[13] -
      m[8] * m[5] * m[15] +
      m[8] * m[7] * m[13] +
      m[12] * m[5] * m[11] -
      m[12] * m[7] * m[9]

    inv[12] =
      -m[4] * m[9] * m[14] +
      m[4] * m[10] * m[13] +
      m[8] * m[5] * m[14] -
      m[8] * m[6] * m[13] -
      m[12] * m[5] * m[10] +
      m[12] * m[6] * m[9]

    inv[1] =
      -m[1] * m[10] * m[15] +
      m[1] * m[11] * m[14] +
      m[9] * m[2] * m[15] -
      m[9] * m[3] * m[14] -
      m[13] * m[2] * m[11] +
      m[13] * m[3] * m[10]

    inv[5] =
      m[0] * m[10] * m[15] -
      m[0] * m[11] * m[14] -
      m[8] * m[2] * m[15] +
      m[8] * m[3] * m[14] +
      m[12] * m[2] * m[11] -
      m[12] * m[3] * m[10]

    inv[9] =
      -m[0] * m[9] * m[15] +
      m[0] * m[11] * m[13] +
      m[8] * m[1] * m[15] -
      m[8] * m[3] * m[13] -
      m[12] * m[1] * m[11] +
      m[12] * m[3] * m[9]

    inv[13] =
      m[0] * m[9] * m[14] -
      m[0] * m[10] * m[13] -
      m[8] * m[1] * m[14] +
      m[8] * m[2] * m[13] +
      m[12] * m[1] * m[10] -
      m[12] * m[2] * m[9]

    inv[2] =
      m[1] * m[6] * m[15] -
      m[1] * m[7] * m[14] -
      m[5] * m[2] * m[15] +
      m[5] * m[3] * m[14] +
      m[13] * m[2] * m[7] -
      m[13] * m[3] * m[6]

    inv[6] =
      -m[0] * m[6] * m[15] +
      m[0] * m[7] * m[14] +
      m[4] * m[2] * m[15] -
      m[4] * m[3] * m[14] -
      m[12] * m[2] * m[7] +
      m[12] * m[3] * m[6]

    inv[10] =
      m[0] * m[5] * m[15] -
      m[0] * m[7] * m[13] -
      m[4] * m[1] * m[15] +
      m[4] * m[3] * m[13] +
      m[12] * m[1] * m[7] -
      m[12] * m[3] * m[5]

    inv[14] =
      -m[0] * m[5] * m[14] +
      m[0] * m[6] * m[13] +
      m[4] * m[1] * m[14] -
      m[4] * m[2] * m[13] -
      m[12] * m[1] * m[6] +
      m[12] * m[2] * m[5]

    inv[3] =
      -m[1] * m[6] * m[11] +
      m[1] * m[7] * m[10] +
      m[5] * m[2] * m[11] -
      m[5] * m[3] * m[10] -
      m[9] * m[2] * m[7] +
      m[9] * m[3] * m[6]

    inv[7] =
      m[0] * m[6] * m[11] -
      m[0] * m[7] * m[10] -
      m[4] * m[2] * m[11] +
      m[4] * m[3] * m[10] +
      m[8] * m[2] * m[7] -
      m[8] * m[3] * m[6]

    inv[11] =
      -m[0] * m[5] * m[11] +
      m[0] * m[7] * m[9] +
      m[4] * m[1] * m[11] -
      m[4] * m[3] * m[9] -
      m[8] * m[1] * m[7] +
      m[8] * m[3] * m[5]

    inv[15] =
      m[0] * m[5] * m[10] -
      m[0] * m[6] * m[9] -
      m[4] * m[1] * m[10] +
      m[4] * m[2] * m[9] +
      m[8] * m[1] * m[6] -
      m[8] * m[2] * m[5]

    const det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12]

    if (det === 0) {
      return null
    }

    const detInv = 1 / det
    for (let i = 0; i < 16; i++) {
      inv[i] *= detInv
    }

    return inv
  }

  /**
   * 转置 4x4 矩阵。
   * @param matrix - 要转置的矩阵
   * @returns 转置后的矩阵
   */
  static transpose(matrix: Float32Array): Float32Array {
    return new Float32Array([
      matrix[0],
      matrix[4],
      matrix[8],
      matrix[12],
      matrix[1],
      matrix[5],
      matrix[9],
      matrix[13],
      matrix[2],
      matrix[6],
      matrix[10],
      matrix[14],
      matrix[3],
      matrix[7],
      matrix[11],
      matrix[15],
    ])
  }

  // 用于 lookAt 矩阵计算的向量工具函数
  private static subtractVectors(a: number[], b: number[]): number[] {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  }

  static normalize(v: number[]): number[] {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if (length > 0) {
      return [v[0] / length, v[1] / length, v[2] / length]
    }
    return [0, 0, 0]
  }

  private static cross(a: number[], b: number[]): number[] {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  }

  // 用于链式变换的便捷方法
  static translate(matrix: Float32Array, tx: number, ty: number, tz: number): Float32Array {
    return M4.multiply(matrix, M4.translation(tx, ty, tz))
  }

  static rotateX(matrix: Float32Array, angle: number): Float32Array {
    return M4.multiply(matrix, M4.rotationX(angle))
  }

  static rotateY(matrix: Float32Array, angle: number): Float32Array {
    return M4.multiply(matrix, M4.rotationY(angle))
  }

  static rotateZ(matrix: Float32Array, angle: number): Float32Array {
    return M4.multiply(matrix, M4.rotationZ(angle))
  }

  static scale(matrix: Float32Array, sx: number, sy: number, sz: number): Float32Array {
    return M4.multiply(matrix, M4.scaling(sx, sy, sz))
  }
}

export { M4, M3 }
