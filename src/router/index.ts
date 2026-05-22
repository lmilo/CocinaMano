import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/inventario',
      name: 'inventory',
      component: () => import('@/views/InventoryView.vue'),
    },
    {
      path: '/recetas',
      name: 'recipes',
      component: () => import('@/views/RecipesView.vue'),
    },
    {
      path: '/recetas/crear',
      name: 'recipe-create',
      component: () => import('@/views/RecipeCreateView.vue'),
    },
    {
      path: '/recetas/generar',
      name: 'recipe-generate',
      component: () => import('@/views/RecipeGenerateView.vue'),
    },
    {
      path: '/recetas/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for initial session load
  if (authStore.loading) {
    await authStore.init()
  }

  const isPublic = to.meta.public === true
  const isLoggedIn = !!authStore.user

  if (!isPublic && !isLoggedIn) {
    return { name: 'auth' }
  }
  if (isPublic && isLoggedIn) {
    return { name: 'dashboard' }
  }
})

export default router
