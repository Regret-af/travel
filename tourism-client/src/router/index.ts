import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import ClientLayout from '../layouts/ClientLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/spots',
  },
  {
    path: '/auth',
    component: () => import('../views/auth/AuthShell.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('../views/auth/Login.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('../views/auth/Register.vue'),
      },
    ],
  },
  {
    path: '/',
    component: ClientLayout,
    children: [
      {
        path: 'spots',
        name: 'spots',
        component: () => import('../views/spots/SpotsList.vue'),
      },
      {
        path: 'spots/:id',
        name: 'spot-detail',
        component: () => import('../views/spots/SpotDetail.vue'),
      },
      {
        path: 'diaries',
        name: 'diaries',
        component: () => import('../views/diaries/DiariesList.vue'),
      },
      {
        path: 'diaries/new',
        name: 'diary-create',
        component: () => import('../views/diaries/DiaryCreate.vue'),
      },
      {
        path: 'diaries/:id',
        name: 'diary-detail',
        component: () => import('../views/diaries/DiaryDetail.vue'),
      },
      {
        path: 'me',
        redirect: '/me/profile',
      },
      {
        path: 'me/profile',
        name: 'me-profile',
        component: () => import('../views/me/Profile.vue'),
      },
      {
        path: 'me/diaries',
        name: 'me-diaries',
        component: () => import('../views/me/MyDiaries.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
