import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    name: 'MainLayout',
    path: '/mainlayout',
    component: () => import('@renderer/layout/MainLayout.vue'),
    meta: {},
    children: [
      {
        name: 'FileDetails',
        path: '/filedetails',
        component: () => import('@renderer/page/FileDetails/index.vue'),
        meta: {
          keepAlive: true
        }
      },
      {
        name: 'TransferDetails',
        path: '/transfer',
        component: () => import('@renderer/page/TransferDetails/index.vue'),
        meta: {}
      }
    ]
  }
]

export default routes
