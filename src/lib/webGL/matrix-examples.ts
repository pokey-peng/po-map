/**
 * 矩阵工具类使用示例
 *
 * 这个文件演示了如何使用 M3 (2D) 和 M4 (3D) 矩阵工具类
 */

import { M3, M4 } from './m3'

// ============= 2D 矩阵操作示例 =============

/**
 * 2D 变换示例：创建一个复合变换矩阵
 */
export function example2DTransform() {
  // 创建一个复合变换：先缩放，再旋转，最后平移
  const transformMatrix = M3.multiplyMany(
    M3.translation(100, 50), // 最后：平移到(100, 50)
    M3.rotation(Math.PI / 4), // 然后：旋转45度
    M3.scaling(2, 2), // 首先：放大2倍
  )

  // 变换一个点
  const originalPoint = new Float32Array([10, 20, 1])
  const transformedPoint = M3.transformPoint(transformMatrix, originalPoint)

  console.log('2D 变换示例:')
  console.log('原始点:', originalPoint)
  console.log('变换后:', transformedPoint)

  return transformMatrix
}

/**
 * 2D 投影矩阵示例
 */
export function example2DProjection(canvasWidth: number, canvasHeight: number) {
  // 创建投影矩阵，将像素坐标转换为 WebGL 剪辑空间坐标
  const projectionMatrix = M3.projection(canvasWidth, canvasHeight)

  console.log('2D 投影矩阵:', projectionMatrix)

  return projectionMatrix
}

// ============= 3D 矩阵操作示例 =============

/**
 * 3D 变换示例：创建一个复合变换矩阵
 */
export function example3DTransform() {
  // 创建一个复合变换：先缩放，再绕Y轴旋转，最后平移
  const transformMatrix = M4.multiplyMany(
    M4.translation(100, 50, 25), // 最后：平移到(100, 50, 25)
    M4.rotationY(Math.PI / 4), // 然后：绕Y轴旋转45度
    M4.scaling(2, 2, 2), // 首先：各轴放大2倍
  )

  // 变换一个点
  const originalPoint = new Float32Array([10, 20, 30, 1])
  const transformedPoint = M4.transformPoint(transformMatrix, originalPoint)

  console.log('3D 变换示例:')
  console.log('原始点:', originalPoint)
  console.log('变换后:', transformedPoint)

  return transformMatrix
}

/**
 * 3D 透视投影示例
 */
export function example3DPerspective() {
  const fov = Math.PI / 3 // 60度視野角
  const aspect = 16 / 9 // 宽高比
  const near = 0.1 // 近剪切面
  const far = 100 // 远剪切面

  const perspectiveMatrix = M4.perspective(fov, aspect, near, far)

  console.log('3D 透视投影矩阵:', perspectiveMatrix)

  return perspectiveMatrix
}

/**
 * 3D 正交投影示例
 */
export function example3DOrthographic() {
  const left = -10
  const right = 10
  const bottom = -10
  const top = 10
  const near = 0.1
  const far = 100

  const orthographicMatrix = M4.orthographic(left, right, bottom, top, near, far)

  console.log('3D 正交投影矩阵:', orthographicMatrix)

  return orthographicMatrix
}

/**
 * 3D 视图矩阵示例（lookAt）
 */
export function example3DLookAt() {
  const cameraPosition = [0, 5, 10] // 相机位置
  const target = [0, 0, 0] // 目标位置
  const up = [0, 1, 0] // 上方向

  const viewMatrix = M4.lookAt(cameraPosition, target, up)

  console.log('3D 视图矩阵 (lookAt):', viewMatrix)

  return viewMatrix
}

/**
 * 欧拉角旋转示例
 */
export function example3DEulerRotation() {
  const rotationX = Math.PI / 6 // 30度
  const rotationY = Math.PI / 4 // 45度
  const rotationZ = Math.PI / 3 // 60度

  // 方法1：使用复合旋转函数
  const eulerMatrix1 = M4.rotationXYZ(rotationX, rotationY, rotationZ)

  // 方法2：手动组合旋转矩阵
  const eulerMatrix2 = M4.multiplyMany(
    M4.rotationZ(rotationZ),
    M4.rotationY(rotationY),
    M4.rotationX(rotationX),
  )

  console.log('欧拉角旋转矩阵 (方法1):', eulerMatrix1)
  console.log('欧拉角旋转矩阵 (方法2):', eulerMatrix2)

  return { eulerMatrix1, eulerMatrix2 }
}

/**
 * 矩阵求逆示例
 */
export function exampleMatrixInverse() {
  // 创建一个变换矩阵
  const transformMatrix = M4.multiplyMany(
    M4.translation(10, 20, 30),
    M4.rotationY(Math.PI / 4),
    M4.scaling(2, 2, 2),
  )

  // 求逆矩阵
  const inverseMatrix = M4.inverse(transformMatrix)

  if (inverseMatrix) {
    // 验证：原矩阵 × 逆矩阵 = 单位矩阵
    const identityCheck = M4.multiply(transformMatrix, inverseMatrix)

    console.log('原矩阵:', transformMatrix)
    console.log('逆矩阵:', inverseMatrix)
    console.log('验证单位矩阵:', identityCheck)
  } else {
    console.log('矩阵不可逆')
  }

  return inverseMatrix
}

/**
 * 完整的 3D 渲染管线示例
 */
export function example3DRenderingPipeline() {
  // 1. 模型变换：将模型从局部坐标系变换到世界坐标系
  const modelMatrix = M4.multiplyMany(
    M4.translation(0, 0, -5), // 将模型向后移动
    M4.rotationY(Math.PI / 4), // 绕Y轴旋转45度
    M4.scaling(1, 1, 1), // 保持原始大小
  )

  // 2. 视图变换：将世界坐标系变换到相机坐标系
  const viewMatrix = M4.lookAt(
    [0, 2, 5], // 相机位置
    [0, 0, 0], // 看向原点
    [0, 1, 0], // Y轴向上
  )

  // 3. 投影变换：将3D坐标投影到2D屏幕空间
  const projectionMatrix = M4.perspective(
    Math.PI / 3, // 60度视野角
    16 / 9, // 宽高比
    0.1, // 近剪切面
    100, // 远剪切面
  )

  // 4. 组合 MVP 矩阵 (Model-View-Projection)
  const mvpMatrix = M4.multiplyMany(projectionMatrix, viewMatrix, modelMatrix)

  console.log('3D 渲染管线示例:')
  console.log('模型矩阵:', modelMatrix)
  console.log('视图矩阵:', viewMatrix)
  console.log('投影矩阵:', projectionMatrix)
  console.log('MVP 矩阵:', mvpMatrix)

  return {
    modelMatrix,
    viewMatrix,
    projectionMatrix,
    mvpMatrix,
  }
}

/**
 * 运行所有示例
 */
export function runAllExamples() {
  console.log('=== 矩阵工具类示例 ===')

  // 2D 示例
  console.log('\n--- 2D 矩阵示例 ---')
  example2DTransform()
  example2DProjection(800, 600)

  // 3D 示例
  console.log('\n--- 3D 矩阵示例 ---')
  example3DTransform()
  example3DPerspective()
  example3DOrthographic()
  example3DLookAt()
  example3DEulerRotation()
  exampleMatrixInverse()
  example3DRenderingPipeline()

  console.log('\n=== 示例完成 ===')
}
