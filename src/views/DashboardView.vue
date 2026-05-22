<template>
  <AppLayout>
    <h2 class="text-xl font-bold text-gray-800 mb-6">Bienvenido, {{ userEmail }}</h2>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <StatCard label="Ingredientes" :value="productsStore.products.length" icon="🥦" />
      <StatCard label="Recetas guardadas" :value="recipesStore.recipes.length" icon="📖" />
      <StatCard label="Recetas IA" :value="aiRecipesCount" icon="✨" />
      <StatCard label="Categorías" :value="categoryCount" icon="🗂️" />
    </div>

    <div class="grid sm:grid-cols-2 gap-4">
      <RouterLink
        to="/inventario"
        class="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all group"
      >
        <span class="text-3xl">🥦</span>
        <div>
          <p class="font-semibold text-gray-800 group-hover:text-emerald-600">Mi Inventario</p>
          <p class="text-sm text-gray-500">Gestiona tus ingredientes</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/recetas"
        class="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all group"
      >
        <span class="text-3xl">📖</span>
        <div>
          <p class="font-semibold text-gray-800 group-hover:text-emerald-600">Mis Recetas</p>
          <p class="text-sm text-gray-500">Ver y crear recetas</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/recetas/generar"
        class="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all group col-span-2"
      >
        <span class="text-3xl">✨</span>
        <div>
          <p class="font-semibold text-gray-800 group-hover:text-emerald-600">Generar Receta</p>
          <p class="text-sm text-gray-500">Recetas basadas en tus ingredientes o con IA</p>
        </div>
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import StatCard from '@/components/StatCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useRecipesStore } from '@/stores/recipes'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const recipesStore = useRecipesStore()

const userEmail = computed(() => authStore.user?.email ?? '')
const aiRecipesCount = computed(() => recipesStore.recipes.filter((r) => r.is_ai_generated).length)
const categoryCount = computed(
  () => new Set(productsStore.products.map((p) => p.category)).size,
)

onMounted(async () => {
  await Promise.all([productsStore.fetchProducts(), recipesStore.fetchRecipes()])
})
</script>
