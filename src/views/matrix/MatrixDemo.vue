<template>
  <div class="matrix-demo">
    <h2>矩阵工具类演示</h2>

    <div class="demo-section">
      <h3>2D 变换演示</h3>
      <canvas ref="canvas2D" width="400" height="300" class="demo-canvas"></canvas>
      <div class="controls">
        <label>
          X 平移:
          <input v-model.number="transform2D.translateX" type="range" min="-200" max="200" />
          {{ transform2D.translateX }}
        </label>
        <label>
          Y 平移:
          <input v-model.number="transform2D.translateY" type="range" min="-150" max="150" />
          {{ transform2D.translateY }}
        </label>
        <label>
          旋转角度: <input v-model.number="transform2D.rotation" type="range" min="0" max="360" />
          {{ transform2D.rotation }}°
        </label>
        <label>
          缩放:
          <input v-model.number="transform2D.scale" type="range" min="0.1" max="3" step="0.1" />
          {{ transform2D.scale }}x
        </label>
      </div>
    </div>

    <div class="demo-section">
      <h3>3D 变换演示</h3>
      <canvas ref="canvas3D" width="400" height="300" class="demo-canvas"></canvas>
      <div class="controls">
        <label>
          X 旋转: <input v-model.number="transform3D.rotationX" type="range" min="0" max="360" />
          {{ transform3D.rotationX }}°
        </label>
        <label>
          Y 旋转: <input v-model.number="transform3D.rotationY" type="range" min="0" max="360" />
          {{ transform3D.rotationY }}°
        </label>
        <label>
          Z 旋转: <input v-model.number="transform3D.rotationZ" type="range" min="0" max="360" />
          {{ transform3D.rotationZ }}°
        </label>
        <label>
          相机距离:
          <input
            v-model.number="transform3D.cameraDistance"
            type="range"
            min="2"
            max="20"
            step="0.5"
          />
          {{ transform3D.cameraDistance }}
        </label>
      </div>
    </div>

    <div class="demo-section">
      <h3>矩阵计算结果</h3>
      <div class="matrix-display">
        <div class="matrix-info">
          <h4>2D 变换矩阵 (3x3)</h4>
          <pre>{{ formatMatrix(currentMatrix2D, 3) }}</pre>
        </div>
        <div class="matrix-info">
          <h4>3D MVP 矩阵 (4x4)</h4>
          <pre>{{ formatMatrix(currentMatrix3D, 4) }}</pre>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <button @click="runExamples" class="run-examples-btn">运行控制台示例</button>
      <p class="note">点击按钮后，请查看浏览器开发者工具的控制台输出</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import M3, { M4 } from '../../lib/webGL/m3'
import { runAllExamples } from '../../lib/webGL/matrix-examples'

// 2D 变换参数
const transform2D = reactive({
  translateX: 0,
  translateY: 0,
  rotation: 0,
  scale: 1,
})

// 3D 变换参数
const transform3D = reactive({
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  cameraDistance: 5,
})

// Canvas 引用
const canvas2D = ref<HTMLCanvasElement>()
const canvas3D = ref<HTMLCanvasElement>()

// 当前变换矩阵
const currentMatrix2D = ref<Float32Array>(M3.identity())
const currentMatrix3D = ref<Float32Array>(M4.identity())

// 格式化矩阵显示
function formatMatrix(matrix: Float32Array, size: number): string {
  const formatted = []
  for (let i = 0; i < size; i++) {
    const row = []
    for (let j = 0; j < size; j++) {
      const value = matrix[i * size + j]
      row.push(value.toFixed(3).padStart(8))
    }
    formatted.push('[' + row.join(', ') + ']')
  }
  return formatted.join('\n')
}

// 更新 2D 变换矩阵
function update2DMatrix() {
  const rotationRad = (transform2D.rotation * Math.PI) / 180

  currentMatrix2D.value = M3.multiplyMany(
    M3.translation(transform2D.translateX, transform2D.translateY),
    M3.rotation(rotationRad),
    M3.scaling(transform2D.scale, transform2D.scale),
  )

  draw2D()
}

// 更新 3D 变换矩阵
function update3DMatrix() {
  const rotXRad = (transform3D.rotationX * Math.PI) / 180
  const rotYRad = (transform3D.rotationY * Math.PI) / 180
  const rotZRad = (transform3D.rotationZ * Math.PI) / 180

  // 模型变换
  const modelMatrix = M4.rotationXYZ(rotXRad, rotYRad, rotZRad)

  // 视图变换
  const viewMatrix = M4.lookAt([0, 0, transform3D.cameraDistance], [0, 0, 0], [0, 1, 0])

  // 投影变换
  const projectionMatrix = M4.perspective(
    Math.PI / 3,
    400 / 300, // canvas 宽高比
    0.1,
    100,
  )

  // 组合 MVP 矩阵
  currentMatrix3D.value = M4.multiplyMany(projectionMatrix, viewMatrix, modelMatrix)

  draw3D()
}

// 绘制 2D 图形
function draw2D() {
  if (!canvas2D.value) return

  const ctx = canvas2D.value.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, 400, 300)

  // 设置坐标系原点到画布中心
  ctx.save()
  ctx.translate(200, 150)

  // 应用变换
  const matrix = currentMatrix2D.value
  ctx.setTransform(
    matrix[0],
    matrix[1], // a, b
    matrix[3],
    matrix[4], // c, d
    matrix[6],
    matrix[7], // e, f
  )

  // 绘制参考坐标轴
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-200, 0)
  ctx.lineTo(200, 0)
  ctx.moveTo(0, -150)
  ctx.lineTo(0, 150)
  ctx.stroke()

  // 绘制矩形
  ctx.fillStyle = '#3498db'
  ctx.fillRect(-25, -25, 50, 50)

  // 绘制坐标轴（变换后的）
  ctx.strokeStyle = '#e74c3c'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(30, 0) // X轴
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -30) // Y轴
  ctx.stroke()

  ctx.restore()
}

// 绘制 3D 图形（简化的线框立方体）
function draw3D() {
  if (!canvas3D.value) return

  const ctx = canvas3D.value.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, 400, 300)

  // 立方体的顶点 (局部坐标)
  const vertices = [
    [-1, -1, -1, 1],
    [1, -1, -1, 1],
    [1, 1, -1, 1],
    [-1, 1, -1, 1], // 前面
    [-1, -1, 1, 1],
    [1, -1, 1, 1],
    [1, 1, 1, 1],
    [-1, 1, 1, 1], // 后面
  ]

  // 变换顶点
  const transformedVertices = vertices.map((vertex) => {
    const v = new Float32Array(vertex)
    const transformed = M4.transformPoint(currentMatrix3D.value, v)
    // 透视除法
    if (transformed[3] !== 0) {
      transformed[0] /= transformed[3]
      transformed[1] /= transformed[3]
      transformed[2] /= transformed[3]
    }
    return transformed
  })

  // 转换到屏幕坐标
  const screenVertices = transformedVertices.map((v) => [
    (v[0] + 1) * 200, // x: [-1,1] -> [0,400]
    (-v[1] + 1) * 150, // y: [-1,1] -> [300,0] (翻转Y轴)
  ])

  // 绘制立方体边框
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 2

  // 绘制边
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // 前面
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // 后面
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // 连接前后
  ]

  edges.forEach(([start, end]) => {
    const startPos = screenVertices[start]
    const endPos = screenVertices[end]

    ctx.beginPath()
    ctx.moveTo(startPos[0], startPos[1])
    ctx.lineTo(endPos[0], endPos[1])
    ctx.stroke()
  })

  // 绘制顶点
  ctx.fillStyle = '#e74c3c'
  screenVertices.forEach((vertex) => {
    ctx.beginPath()
    ctx.arc(vertex[0], vertex[1], 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

// 运行示例
function runExamples() {
  console.clear()
  runAllExamples()
}

// 监听变换参数变化
watch(() => transform2D, update2DMatrix, { deep: true })
watch(() => transform3D, update3DMatrix, { deep: true })

// 组件挂载后初始化
onMounted(() => {
  update2DMatrix()
  update3DMatrix()
})
</script>

<style scoped>
.matrix-demo {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.demo-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.demo-canvas {
  border: 2px solid #3498db;
  border-radius: 4px;
  display: block;
  margin: 10px 0;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.controls label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-weight: bold;
  color: #333;
}

.controls input[type='range'] {
  width: 100%;
  margin-top: 5px;
}

.matrix-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.matrix-info {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.matrix-info h4 {
  margin-top: 0;
  color: #2c3e50;
}

.matrix-info pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.run-examples-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background 0.3s;
}

.run-examples-btn:hover {
  background: #2980b9;
}

.note {
  margin-top: 10px;
  color: #666;
  font-style: italic;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

h3 {
  color: #34495e;
  margin-top: 0;
}
</style>
