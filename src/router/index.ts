import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import layout from '@/layout/index.vue'
import { mapRoutes } from './mapRoutes'
import { gisMapRoutes } from './gisMapRoutes'
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
      children: [...mapRoutes, ...gisMapRoutes],
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
export { mapRoutes } from './mapRoutes'
export { gisMapRoutes } from './gisMapRoutes'
export default router
