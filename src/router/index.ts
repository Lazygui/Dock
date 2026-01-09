import { createWebHashHistory, createRouter, type RouteRecordRaw, NavigationFailureType, isNavigationFailure } from 'vue-router'
import { mitter } from '@/hooks'
import { toolRoutes } from "./tools"
import HomeView from '../layout/HomeView.vue'

export const routes: RouteRecordRaw[] = [
       { path: '/', component: HomeView },
       {
              path: '/tools',
              component: () => import('../layout/ToolLayout.vue'),
              children: toolRoutes
       },
]

export const router = createRouter({
       history: createWebHashHistory(),
       routes,
})

mitter.on('ROUTE:PUSH', (params) => {
       if (!params || !params.path) {
              mitter.emit('ROUTE:ERROR_PUSH_NULL')
              return
       }
       const performNavigation = () => {
              if (params.body && Object.keys(params.body).length > 0) {
                     return router.push({
                            path: params.path,
                            query: params.body
                     })
              } else {
                     return router.push(params.path)
              }
       }
       performNavigation().catch((error) => {
              if (isNavigationFailure(error, NavigationFailureType.duplicated)) {
                     return
              }

              if (isNavigationFailure(error, NavigationFailureType.aborted)) {
                     console.warn('路由跳转被拦截')
                     return
              }

              console.error('路由跳转真正的失败:', error)
       })
})