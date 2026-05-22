<template>
  <AppLayout>
    <h2 class="text-xl font-bold text-gray-800 mb-2">Generar Receta</h2>
    <p class="text-sm text-gray-500 mb-6">Encuentra recetas basadas en tu inventario o usa IA para crear una nueva.</p>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
          activeTab === tab.id
            ? 'border-emerald-600 text-emerald-600'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ─── TAB: MATCHING ─── -->
    <div v-if="activeTab === 'matching'">
      <div v-if="productsStore.products.length === 0" class="text-center py-12 text-gray-400">
        <p class="text-4xl mb-2">🥦</p>
        <p class="text-sm">Primero agrega ingredientes a tu inventario.</p>
        <RouterLink to="/inventario" class="text-emerald-600 text-sm hover:underline mt-2 inline-block">
          Ir al inventario →
        </RouterLink>
      </div>

      <template v-else>
        <p class="text-sm text-gray-500 mb-4">
          Tienes <strong>{{ productsStore.products.length }}</strong> ingredientes.
          Mostrando recetas ordenadas por compatibilidad.
        </p>

        <div class="space-y-3">
          <div
            v-for="match in matchedRecipes"
            :key="match.recipe.id"
            class="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-semibold text-gray-800">{{ match.recipe.name }}</p>
                  <MatchBadge :percent="match.matchPercent" />
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ match.recipe.description }}</p>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="mt-3">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>{{ match.matchCount }}/{{ match.totalIngredients }} ingredientes</span>
                <span>{{ match.matchPercent }}%</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="matchBarColor(match.matchPercent)"
                  :style="{ width: `${match.matchPercent}%` }"
                />
              </div>
            </div>

            <!-- Missing ingredients -->
            <div v-if="match.missingIngredients.length > 0" class="mt-2">
              <p class="text-xs text-gray-400">
                Te falta: {{ match.missingIngredients.slice(0, 4).join(', ') }}
                <span v-if="match.missingIngredients.length > 4">y {{ match.missingIngredients.length - 4 }} más</span>
              </p>
            </div>

            <!-- Save button -->
            <button
              v-if="match.matchPercent >= 50"
              @click="saveMatchedRecipe(match)"
              :disabled="savingId === match.recipe.id"
              class="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
            >
              {{ savingId === match.recipe.id ? 'Guardando...' : '+ Guardar esta receta' }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- ─── TAB: IA ─── -->
    <div v-if="activeTab === 'ai'">
      <div class="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-5 text-sm text-violet-800">
        ✨ La IA generará una receta basada en los ingredientes que selecciones. Se usa el modelo Gemini 2.5 Flash.
      </div>

      <!-- Ingredient selector -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p class="text-sm font-medium text-gray-700 mb-3">Selecciona ingredientes para usar:</p>
        <div v-if="productsStore.products.length === 0" class="text-sm text-gray-400">
          Agrega ingredientes al inventario primero.
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="product in productsStore.products"
            :key="product.id"
            @click="toggleIngredient(product.id)"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              selectedIngredients.has(product.id)
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400',
            ]"
          >
            {{ product.name }}
          </button>
        </div>
      </div>

      <!-- Extra context -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Contexto adicional (opcional)</label>
        <input
          v-model="aiContext"
          type="text"
          placeholder="ej. plato vegetariano, bajo en calorías..."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <button
        @click="generateWithAI"
        :disabled="aiLoading || selectedIngredients.size === 0"
        class="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {{ aiLoading ? '✨ Generando...' : '✨ Generar con IA' }}
      </button>

      <p v-if="aiError" class="text-red-500 text-sm mt-3">{{ aiError }}</p>

      <!-- AI Result -->
      <div v-if="aiResult" class="mt-6 bg-white border border-violet-200 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-3">
          <h3 class="font-bold text-gray-800 text-lg">{{ aiResult.name }}</h3>
          <span class="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">✨ IA</span>
        </div>
        <p class="text-sm text-gray-500 mb-4">{{ aiResult.description }}</p>

        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Ingredientes ({{ aiResult.servings }} porciones)</p>
          <ul class="space-y-1">
            <li v-for="(ing, i) in aiResult.ingredients" :key="i" class="text-sm text-gray-600 flex justify-between">
              <span>{{ ing.name }}</span>
              <span class="text-gray-400">{{ ing.quantity }} {{ ing.unit }}</span>
            </li>
          </ul>
        </div>

        <div class="mb-5">
          <p class="text-sm font-medium text-gray-700 mb-2">Preparación</p>
          <ol class="space-y-2">
            <li v-for="step in aiResult.steps" :key="step.order" class="flex gap-2 text-sm text-gray-700">
              <span class="shrink-0 w-5 h-5 flex items-center justify-center bg-violet-100 text-violet-700 rounded-full text-xs font-bold mt-0.5">
                {{ step.order }}
              </span>
              {{ step.description }}
            </li>
          </ol>
        </div>

        <button
          @click="saveAIRecipe"
          :disabled="savingAI"
          class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {{ savingAI ? 'Guardando...' : 'Guardar receta' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import MatchBadge from '@/components/MatchBadge.vue'
import { useProductsStore } from '@/stores/products'
import { useRecipesStore } from '@/stores/recipes'
import { matchRecipes } from '@/lib/recipeMatching'
import { supabase } from '@/lib/supabase'
import baseRecipes from '@/data/baseRecipes.json'
import type { BaseRecipe, MatchedRecipe, RecipeIngredientInsert } from '@/types'

const productsStore = useProductsStore()
const recipesStore = useRecipesStore()
const router = useRouter()

const activeTab = ref<'matching' | 'ai'>('matching')
const tabs = [
  { id: 'matching' as const, label: '🔍 Por ingredientes' },
  { id: 'ai' as const, label: '✨ Generar con IA' },
]

// ── Matching ──
const matchedRecipes = computed<MatchedRecipe[]>(() =>
  matchRecipes(baseRecipes as BaseRecipe[], productsStore.products),
)

const savingId = ref<string | null>(null)

function matchBarColor(percent: number): string {
  if (percent >= 70) return 'bg-emerald-500'
  if (percent >= 40) return 'bg-yellow-400'
  return 'bg-red-400'
}

async function saveMatchedRecipe(match: MatchedRecipe) {
  savingId.value = match.recipe.id
  try {
    const ingredients: RecipeIngredientInsert[] = match.recipe.ingredients.map((ing) => {
      const product = productsStore.products.find(
        (p) =>
          p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(p.name.toLowerCase()),
      )
      return {
        product_id: product?.id ?? null,
        ingredient_name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        unit_cost: product?.unit_price ?? 0,
      }
    })

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.quantity * ing.unit_cost, 0)

    const recipe = await recipesStore.createRecipe(
      {
        name: match.recipe.name,
        description: match.recipe.description,
        servings: match.recipe.servings,
        total_cost: totalCost,
        is_ai_generated: false,
        steps: match.recipe.steps,
        cuisine_type: match.recipe.cuisine_type,
      },
      ingredients,
    )
    router.push(`/recetas/${recipe.id}`)
  } finally {
    savingId.value = null
  }
}

// ── AI generation ──
const selectedIngredients = ref<Set<string>>(new Set())
const aiContext = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const savingAI = ref(false)

interface AIRecipeResult {
  name: string
  description: string
  servings: number
  cuisine_type: string
  ingredients: { name: string; quantity: number; unit: string }[]
  steps: { order: number; description: string }[]
}

const aiResult = ref<AIRecipeResult | null>(null)

function toggleIngredient(id: string) {
  if (selectedIngredients.value.has(id)) {
    selectedIngredients.value.delete(id)
  } else {
    selectedIngredients.value.add(id)
  }
}

async function generateWithAI() {
  aiLoading.value = true
  aiError.value = ''
  aiResult.value = null

  const selectedProducts = productsStore.products.filter((p) =>
    selectedIngredients.value.has(p.id),
  )

  try {
    const { data, error } = await supabase.functions.invoke('generate-recipe', {
      body: {
        ingredients: selectedProducts.map((p) => ({ name: p.name, unit: p.unit })),
        context: aiContext.value.trim(),
      },
    })

    if (error) throw new Error(error.message)
    aiResult.value = data as AIRecipeResult
  } catch (err: unknown) {
    aiError.value = err instanceof Error ? err.message : 'Error al generar la receta.'
  } finally {
    aiLoading.value = false
  }
}

async function saveAIRecipe() {
  if (!aiResult.value) return
  savingAI.value = true
  try {
    const ingredients: RecipeIngredientInsert[] = aiResult.value.ingredients.map((ing) => {
      const product = productsStore.products.find(
        (p) =>
          p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(p.name.toLowerCase()),
      )
      return {
        product_id: product?.id ?? null,
        ingredient_name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit as RecipeIngredientInsert['unit'],
        unit_cost: product?.unit_price ?? 0,
      }
    })

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.quantity * ing.unit_cost, 0)

    const recipe = await recipesStore.createRecipe(
      {
        name: aiResult.value.name,
        description: aiResult.value.description,
        servings: aiResult.value.servings,
        total_cost: totalCost,
        is_ai_generated: true,
        steps: aiResult.value.steps,
        cuisine_type: aiResult.value.cuisine_type ?? null,
      },
      ingredients,
    )
    router.push(`/recetas/${recipe.id}`)
  } finally {
    savingAI.value = false
  }
}

onMounted(() => productsStore.fetchProducts())
</script>
