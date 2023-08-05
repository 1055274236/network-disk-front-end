import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    name: 'Login',
    path: '/login',
    component: () => import('@renderer/page/Login/index.vue'),
    meta: {}
  }
]

export default routes
