/**
 * 矩阵工具类测试
 * 运行这个文件来验证 M3 和 M4 类的基本功能
 */

import { M3, M4 } from './m3'

function testM3() {
  console.log('=== M3 (2D 矩阵) 测试 ===')

  // 测试单位矩阵
  const identity = M3.identity()
  console.log('单位矩阵:', identity)

  // 测试变换矩阵
  const translation = M3.translation(10, 20)
  const rotation = M3.rotation(Math.PI / 4) // 45度
  const scaling = M3.scaling(2, 2)

  console.log('平移矩阵 (10, 20):', translation)
  console.log('旋转矩阵 (45度):', rotation)
  console.log('缩放矩阵 (2x):', scaling)

  // 测试矩阵乘法
  const combined = M3.multiplyMany(translation, rotation, scaling)
  console.log('复合变换矩阵:', combined)

  // 测试点变换
  const originalPoint = new Float32Array([1, 0, 1])
  const transformedPoint = M3.transformPoint(combined, originalPoint)
  console.log('点变换测试:')
  console.log('  原始点:', originalPoint)
  console.log('  变换后:', transformedPoint)

  // 测试投影矩阵
  const projection = M3.projection(800, 600)
  console.log('投影矩阵 (800x600):', projection)
}

function testM4() {
  console.log('\n=== M4 (3D 矩阵) 测试 ===')

  // 测试单位矩阵
  const identity = M4.identity()
  console.log('单位矩阵:', identity)

  // 测试变换矩阵
  const translation = M4.translation(10, 20, 30)
  const rotationX = M4.rotationX(Math.PI / 4)
  const rotationY = M4.rotationY(Math.PI / 4)
  const rotationZ = M4.rotationZ(Math.PI / 4)
  const scaling = M4.scaling(2, 2, 2)

  console.log('平移矩阵 (10, 20, 30):', translation)
  console.log('绕X轴旋转矩阵 (45度):', rotationX)
  console.log('绕Y轴旋转矩阵 (45度):', rotationY)
  console.log('绕Z轴旋转矩阵 (45度):', rotationZ)
  console.log('缩放矩阵 (2x):', scaling)

  // 测试欧拉角旋转
  const eulerRotation = M4.rotationXYZ(Math.PI / 6, Math.PI / 4, Math.PI / 3)
  console.log('欧拉角旋转矩阵:', eulerRotation)

  // 测试复合变换
  const combined = M4.multiplyMany(translation, rotationY, scaling)
  console.log('复合变换矩阵:', combined)

  // 测试点变换
  const originalPoint = new Float32Array([1, 1, 1, 1])
  const transformedPoint = M4.transformPoint(combined, originalPoint)
  console.log('点变换测试:')
  console.log('  原始点:', originalPoint)
  console.log('  变换后:', transformedPoint)

  // 测试向量变换
  const originalVector = new Float32Array([1, 0, 0])
  const transformedVector = M4.transformVector(combined, originalVector)
  console.log('向量变换测试:')
  console.log('  原始向量:', originalVector)
  console.log('  变换后向量:', transformedVector)

  // 测试投影矩阵
  const perspective = M4.perspective(Math.PI / 3, 16 / 9, 0.1, 100)
  console.log('透视投影矩阵:', perspective)

  const orthographic = M4.orthographic(-10, 10, -10, 10, 0.1, 100)
  console.log('正交投影矩阵:', orthographic)

  // 测试视图矩阵
  const lookAt = M4.lookAt([0, 5, 10], [0, 0, 0], [0, 1, 0])
  console.log('视图矩阵 (lookAt):', lookAt)

  // 测试矩阵求逆
  const inverse = M4.inverse(combined)
  if (inverse) {
    console.log('逆矩阵:', inverse)

    // 验证：原矩阵 × 逆矩阵 = 单位矩阵
    const shouldBeIdentity = M4.multiply(combined, inverse)
    console.log('验证单位矩阵 (A × A⁻¹):', shouldBeIdentity)

    // 检查是否接近单位矩阵
    const identityCheck = M4.identity()
    let isCloseToIdentity = true
    for (let i = 0; i < 16; i++) {
      if (Math.abs(shouldBeIdentity[i] - identityCheck[i]) > 1e-10) {
        isCloseToIdentity = false
        break
      }
    }
    console.log('逆矩阵验证通过:', isCloseToIdentity)
  } else {
    console.log('矩阵不可逆')
  }

  // 测试矩阵转置
  const transposed = M4.transpose(combined)
  console.log('转置矩阵:', transposed)
}

function testPerformance() {
  console.log('\n=== 性能测试 ===')

  const iterations = 100000

  // 测试 M3 性能
  const start3D = performance.now()
  for (let i = 0; i < iterations; i++) {
    const matrix = M3.multiplyMany(
      M3.translation(i, i),
      M3.rotation(i * 0.01),
      M3.scaling(1.1, 1.1),
    )
    M3.transformPoint(matrix, new Float32Array([1, 1, 1]))
  }
  const end3D = performance.now()

  // 测试 M4 性能
  const start4D = performance.now()
  for (let i = 0; i < iterations; i++) {
    const matrix = M4.multiplyMany(
      M4.translation(i, i, i),
      M4.rotationY(i * 0.01),
      M4.scaling(1.1, 1.1, 1.1),
    )
    M4.transformPoint(matrix, new Float32Array([1, 1, 1, 1]))
  }
  const end4D = performance.now()

  console.log(`M3 性能测试 (${iterations} 次迭代): ${(end3D - start3D).toFixed(2)}ms`)
  console.log(`M4 性能测试 (${iterations} 次迭代): ${(end4D - start4D).toFixed(2)}ms`)
}

// 运行所有测试
export function runMatrixTests() {
  console.clear()
  console.log('矩阵工具类测试开始...\n')

  try {
    testM3()
    testM4()
    testPerformance()

    console.log('\n✅ 所有测试完成，请检查上面的输出结果')
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error)
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  ;(window as any).runMatrixTests = runMatrixTests
  console.log('矩阵测试函数已加载，可以在控制台调用 runMatrixTests() 来运行测试')
}
