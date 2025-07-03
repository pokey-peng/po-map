import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import layout from '@/layout/index.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'app',
      redirect: '/po-map',
    },
    {
      path: '/po-map',
      name: 'layout',
      component: layout,
      redirect: '/map',
      children: [
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
      ],
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
