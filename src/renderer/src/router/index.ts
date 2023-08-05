import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import RouterModule from './module/index'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/filedetails'
  },
  ...RouterModule
]

const router = createRouter({
  history: createWebHashHistory(),
  routes // `routes: routes` 的缩写
})

export default router
