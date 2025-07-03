# 矩阵工具类升级文档

## 概述

矩阵工具类已从原来的 2D 矩阵操作 (M3) 升级为同时支持 2D 和 3D 矩阵操作，新增了 M4 类用于处理 4x4 三维变换矩阵。

## 文件结构

```
src/lib/webGL/
├── m3.ts                    # 主要矩阵工具类文件 (M3 + M4)
├── matrix-examples.ts       # 使用示例和演示代码
└── gl-help.ts              # WebGL 辅助函数

src/views/matrix/
└── MatrixDemo.vue          # Vue 组件演示页面
```

## 主要功能

### M3 类 (2D 矩阵操作)
- **单位矩阵**: `M3.identity()`
- **2D 投影**: `M3.projection(width, height)`
- **平移**: `M3.translation(tx, ty)`
- **旋转**: `M3.rotation(angle)` - 角度为弧度
- **缩放**: `M3.scaling(sx, sy)`
- **矩阵乘法**: `M3.multiply(a, b)` 和 `M3.multiplyMany(...matrices)`
- **点变换**: `M3.transformPoint(matrix, point)`
- **链式操作**: `M3.translate()`, `M3.rotate()`, `M3.scale()`

### M4 类 (3D 矩阵操作)
- **单位矩阵**: `M4.identity()`
- **透视投影**: `M4.perspective(fov, aspect, near, far)`
- **正交投影**: `M4.orthographic(left, right, bottom, top, near, far)`
- **平移**: `M4.translation(tx, ty, tz)`
- **旋转**:
  - `M4.rotationX(angle)` - 绕X轴旋转
  - `M4.rotationY(angle)` - 绕Y轴旋转
  - `M4.rotationZ(angle)` - 绕Z轴旋转
  - `M4.rotationXYZ(x, y, z)` - 欧拉角旋转
- **缩放**: `M4.scaling(sx, sy, sz)`
- **视图矩阵**: `M4.lookAt(cameraPos, target, up)`
- **矩阵运算**:
  - `M4.multiply(a, b)` - 矩阵乘法
  - `M4.multiplyMany(...matrices)` - 多矩阵乘法
  - `M4.inverse(matrix)` - 矩阵求逆
  - `M4.transpose(matrix)` - 矩阵转置
- **变换操作**:
  - `M4.transformPoint(matrix, point)` - 点变换
  - `M4.transformVector(matrix, vector)` - 向量变换
- **链式操作**: `M4.translate()`, `M4.rotateX/Y/Z()`, `M4.scale()`

## 使用示例

### 基本 2D 变换
```typescript
import M3 from '@/lib/webGL/m3'

// 创建复合变换矩阵
const transform = M3.multiplyMany(
  M3.translation(100, 50),     // 最后执行：平移
  M3.rotation(Math.PI / 4),    // 然后：旋转45度
  M3.scaling(2, 2)             // 首先：放大2倍
)

// 变换一个点
const point = new Float32Array([10, 20, 1])
const transformed = M3.transformPoint(transform, point)
```

### 基本 3D 变换
```typescript
import { M4 } from '@/lib/webGL/m3'

// 创建 3D 变换矩阵
const transform = M4.multiplyMany(
  M4.translation(0, 0, -5),    // 向后移动5个单位
  M4.rotationY(Math.PI / 4),   // 绕Y轴旋转45度
  M4.scaling(2, 2, 2)          // 各轴放大2倍
)

// 变换一个3D点
const point3D = new Float32Array([1, 1, 1, 1])
const transformed3D = M4.transformPoint(transform, point3D)
```

### 完整的 3D 渲染管线
```typescript
// 模型变换
const modelMatrix = M4.rotationY(Math.PI / 4)

// 视图变换
const viewMatrix = M4.lookAt(
  [0, 2, 5],    // 相机位置
  [0, 0, 0],    // 目标位置
  [0, 1, 0]     // 上方向
)

// 投影变换
const projectionMatrix = M4.perspective(
  Math.PI / 3,  // 60度视野角
  16 / 9,       // 宽高比
  0.1,          // 近裁剪面
  100           // 远裁剪面
)

// 组合 MVP 矩阵
const mvpMatrix = M4.multiplyMany(
  projectionMatrix,
  viewMatrix,
  modelMatrix
)
```

## 演示页面

访问 `/matrix-demo` 路由可以查看交互式演示，包括：
- 2D 变换可视化（平移、旋转、缩放）
- 3D 立方体旋转演示
- 实时矩阵计算结果显示
- 控制台示例代码运行

## 矩阵存储格式

所有矩阵均采用 **列主序** (Column-Major) 存储，这与 OpenGL/WebGL 的标准一致：

### 3x3 矩阵 (M3)
```
[0] [3] [6]
[1] [4] [7]
[2] [5] [8]
```

### 4x4 矩阵 (M4)
```
[0] [4] [8]  [12]
[1] [5] [9]  [13]
[2] [6] [10] [14]
[3] [7] [11] [15]
```

## 注意事项

1. **角度单位**: 所有旋转函数使用弧度制，不是角度制
2. **矩阵乘法顺序**: `M4.multiply(A, B)` 表示先应用 B 变换，再应用 A 变换
3. **坐标系**: 使用右手坐标系，Z轴指向屏幕外
4. **透视除法**: 在 3D 投影后需要进行透视除法 (w 分量归一化)
5. **矩阵求逆**: `M4.inverse()` 可能返回 `null`，需要检查是否可逆

## 性能优化建议

1. **预计算矩阵**: 避免在渲染循环中重复计算相同的变换矩阵
2. **矩阵缓存**: 对于静态对象，可以缓存变换矩阵
3. **批量变换**: 使用 `multiplyMany()` 比连续调用 `multiply()` 更高效
4. **避免不必要的求逆**: 矩阵求逆运算开销较大，能避免则避免

## 扩展功能

如需添加更多功能，可以考虑：
- 四元数旋转支持
- 矩阵分解 (提取平移、旋转、缩放分量)
- 插值和动画支持
- SIMD 优化版本
- 更多投影类型 (如斜投影)

## 测试验证

运行演示页面中的控制台示例可以验证各种矩阵运算的正确性，包括：
- 单位矩阵验证
- 逆矩阵验证 (A × A⁻¹ = I)
- 变换链验证
- 投影变换验证
