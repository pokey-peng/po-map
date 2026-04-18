export const mapRoutes = [
  {
    path: '/webgl-demo',
    name: 'WebglDemo',
    component: () => import('@/views/webgl/webgl-demo.vue'),
  },
  {
    path: '/threejs-demo',
    name: 'ThreejsDemo',
    component: () => import('@/views/threejs/threejs-demo.vue'),
  },
  {
    path: '/matrix-demo',
    name: 'MatrixDemo',
    component: () => import('@/views/matrix/MatrixDemo.vue'),
  },
  {
    path: '/webgl-object',
    name: 'WebglObject',
    component: () => import('@/views/webgl/webgl-object.vue'),
  },
  {
    path: '/webgl-load-obj',
    name: 'WebglLoadObj',
    component: () => import('@/views/webgl/webgl-loadObj.vue'),
  },
  {
    path: '/webgl-3d',
    name: 'WebGl3d',
    component: () => import('@/views/webgl/webgl-3d.vue'),
  },

  {
    path: '/webgl-points',
    name: 'WebglPoints',
    label: "WebGL点",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webgl-points.vue'),
  },
  {
    path: '/webgl-transform',
    name: 'WebglTransform',
    label: "WebGL变换",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webgl-transform.vue'),
  },
  {
    path: '/webgl-color',
    name: 'WebglColor',
    label: "WebGL颜色",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webgl-color.vue'),
  },
  {
    path: '/webgl-texture',
    name: 'WebglTexture',
    label: "WebGL纹理",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webgl-texture.vue'),
  },
  {
    path: '/webgl-threeD',
    name: 'WebglThreeD',
    label: "WebGL三维",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webGL-ThreeD.vue'),
  },
  {
    path: '/webgl-cube',
    name: 'WebglCube',
    label: "WebGL立方体",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webgl-cube.vue'),
  },
  {
    path: '/webgl-light',
    name: 'WebglLight',
    label: "WebGL光照",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/webgl/webgl-light.vue'),
  }
]
