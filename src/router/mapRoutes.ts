export const mapRoutes = [
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/mapbox/mapbox-demo.vue'),
  },
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
    path: '/hello-cesium',
    name: 'HelloCesium',
    label: "Cesium初见",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/cesium/HelloCesium.vue'),
  },
]
