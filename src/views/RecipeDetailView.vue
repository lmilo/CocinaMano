<template>
  <AppLayout>
    <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>
    <div v-else-if="!recipe" class="text-center py-12 text-gray-400">Receta no encontrada.</div>
    <template v-else>
      <div class="flex items-center gap-3 mb-4">
        <RouterLink to="/recetas" class="text-gray-400 hover:text-gray-600">← Volver</RouterLink>
        <span v-if="recipe.is_ai_generated" class="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">✨ IA</span>
      </div>

      <h2 class="text-2xl font-bold text-gray-800 mb-1">{{ recipe.name }}</h2>
      <p class="text-gray-500 text-sm mb-6">{{ recipe.description }}</p>

      <!-- Portion adjuster + cost -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">Porciones:</span>
            <button @click="decServings" class="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-emerald-100 transition-colors flex items-center justify-center font-bold">-</button>
            <span class="w-8 text-center font-bold text-gray-800">{{ targetServings }}</span>
            <button @click="incServings" class="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-emerald-100 transition-colors flex items-center justify-center font-bold">+</button>
          </div>
          <div class="text-sm text-emerald-800">
            Costo total: <strong>${{ adjustedTotal.toLocaleString('es-CO') }}</strong>
            · <strong>${{ adjustedPerServing.toLocaleString('es-CO') }}</strong>/porción
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h3 class="font-semibold text-gray-700 mb-3">Ingredientes</h3>
        <ul class="space-y-2">
          <li
            v-for="ing in recipe.recipe_ingredients"
            :key="ing.id"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-800">{{ ing.ingredient_name }}</span>
            <span class="text-gray-500">
              {{ scaledQty(ing.quantity) }} {{ ing.unit }}
              <span v-if="ing.unit_cost > 0" class="text-gray-400 ml-1">
                · ${{ (scaledQty(ing.quantity) * ing.unit_cost).toLocaleString('es-CO', { maximumFractionDigits: 0 }) }}
              </span>
            </span>
          </li>
        </ul>
      </div>

      <!-- Steps -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="font-semibold text-gray-700 mb-3">Preparación</h3>
        <ol class="space-y-4">
          <li
            v-for="step in recipe.steps"
            :key="step.order"
            class="flex gap-3"
          >
            <span class="shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mt-0.5">
              {{ step.order }}
            </span>
            <p class="text-sm text-gray-700 leading-relaxed">{{ step.description }}</p>
          </li>
        </ol>
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useRecipesStore } from '@/stores/recipes'
import { scaleIngredient, adjustedCost } from '@/lib/recipeMatching'
import type { Recipe } from '@/types'

const route = useRoute()
const recipesStore = useRecipesStore()

const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const targetServings = ref(1)

onMounted(async () => {
  try {
    recipe.value = await recipesStore.fetchRecipeById(route.params.id as string)
    if (recipe.value) targetServings.value = recipe.value.servings
  } finally {
    loading.value = false
  }
})

function decServings() {
  if (targetServings.value > 1) targetServings.value--
}
function incServings() {
  targetServings.value++
}

function scaledQty(originalQty: number): number {
  if (!recipe.value) return originalQty
  return scaleIngredient(originalQty, recipe.value.servings, targetServings.value)
}

const adjustedTotal = computed(() => {
  if (!recipe.value) return 0
  return adjustedCost(recipe.value.total_cost, recipe.value.servings, targetServings.value)
})

const adjustedPerServing = computed(() =>
  targetServings.value > 0 ? Math.round(adjustedTotal.value / targetServings.value) : 0,
)
</script>
