<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">Mis Recetas</h2>
      <div class="flex gap-2">
        <RouterLink
          to="/recetas/generar"
          class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-emerald-200"
        >
          ✨ Generar
        </RouterLink>
        <RouterLink
          to="/recetas/crear"
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Crear
        </RouterLink>
      </div>
    </div>

    <div v-if="recipesStore.loading" class="text-center py-12 text-gray-400">Cargando...</div>

    <div v-else-if="recipesStore.recipes.length === 0" class="text-center py-12 text-gray-400">
      <p class="text-4xl mb-2">📖</p>
      <p class="text-sm">Aún no tienes recetas. ¡Crea una o genera una con IA!</p>
    </div>

    <div v-else class="grid sm:grid-cols-2 gap-4">
      <RecipeCard
        v-for="recipe in recipesStore.recipes"
        :key="recipe.id"
        :recipe="recipe"
        @delete="handleDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import { useRecipesStore } from '@/stores/recipes'

const recipesStore = useRecipesStore()

async function handleDelete(id: string) {
  if (!confirm('¿Eliminar esta receta?')) return
  await recipesStore.deleteRecipe(id)
}

onMounted(() => recipesStore.fetchRecipes())
</script>
