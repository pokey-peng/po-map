export const threejsRoutes = [
  {
    path: '/threejs-demo',
    name: 'ThreejsDemo',
    label: "Three.js示例",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/threejs/threejs-demo.vue'),
  },
  {
    path: '/threejs-app',
    name: 'ThreejsApp',
    label: "Three.js应用",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/threejs/threejs-app.vue'),
  },
]
