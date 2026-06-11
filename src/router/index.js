import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/utils/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/user' },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { noAuth: true }
    },
    {
      path: '/',
      component: () => import('@/layout/MainLayout.vue'),
      children: [
        {
          path: 'user',
          name: 'UserManager',
          component: () => import('@/views/UserManager.vue')
        },
        {
          path: 'role',
          name: 'RoleManager',
          component: () => import('@/views/RoleManager.vue')
        },
        {
          path: 'permission',
          name: 'PermissionManager',
          component: () => import('@/views/PermissionManager.vue')
        },
        {
          path: 'log',
          name: 'OperationLog',
          component: () => import('@/views/OperationLog.vue')
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  if (to.meta.noAuth) {
    // 如果已登录则跳转主页
    if (isLoggedIn() && to.path === '/login') {
      return next('/user')
    }
    return next()
  }
  if (!isLoggedIn()) {
    return next('/login')
  }
  next()
})

export default router
