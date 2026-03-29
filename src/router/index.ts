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
    },
    {
      path: '/account/diaries',
      name: 'my-diaries',
      component: () => import('@/views/user/MyDiariesView.vue')
    },
    {
      path: '/account/diaries/new',
      name: 'publish-diary',
      component: () => import('@/views/user/PublishDiaryView.vue')
    },
    {
      path: '/account/favorites',
      name: 'my-favorites',
      component: () => import('@/views/user/MyFavoritesView.vue')
    },
    {
      path: '/account/profile',
      name: 'profile-edit',
      component: () => import('@/views/user/ProfileEditView.vue')
    },
    {
      path: '/account/password',
      name: 'password-edit',
      component: () => import('@/views/user/PasswordEditView.vue')
    }
  ],
  scrollBehavior: () => ({ top: 0 })
});

export default router;
