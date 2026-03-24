import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/home/HomeView.vue')
    },
    {
      path: '/attractions',
      name: 'attractions',
      component: () => import('@/views/attractions/AttractionListView.vue')
    },
    {
      path: '/attractions/:id',
      name: 'attraction-detail',
      component: () => import('@/views/attractions/AttractionDetailView.vue')
    },
    {
      path: '/diaries',
      name: 'diaries',
      component: () => import('@/views/diaries/DiaryListView.vue')
    },
    {
      path: '/diaries/:id',
      name: 'diary-detail',
      component: () => import('@/views/diaries/DiaryDetailView.vue')
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/user/AccountView.vue')
    }
  ],
  scrollBehavior: () => ({ top: 0 })
});

export default router;
