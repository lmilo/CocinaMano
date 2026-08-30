<template>
  <AppLayout>
    <h1 class="font-display text-3xl font-semibold text-ink mb-1.5">Generar receta</h1>
    <p class="text-sm text-ink-soft mb-6">
      Descubre qué cocinar con lo que tienes, o deja que la IA te proponga algo nuevo.
    </p>

    <!-- Tabs -->
    <div class="inline-flex p-1 bg-paper-deep/60 rounded-xl mb-6" role="tablist" aria-label="Modo de generación">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-1.5 text-sm font-medium rounded-lg pressable',
          activeTab === tab.id ? 'bg-surface text-ink shadow-warm-sm' : 'text-ink-soft hover:text-ink',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ─── TAB: MATCHING ─── -->
    <div v-if="activeTab === 'matching'">
      <div v-if="productsStore.products.length === 0" class="card text-center py-16 px-6">
        <p class="text-5xl mb-3">🧺</p>
        <p class="font-display text-lg text-ink">Tu despensa está vacía</p>
        <p class="text-sm text-ink-soft mt-1 mb-3">Agrega ingredientes para ver qué puedes cocinar.</p>
        <RouterLink to="/inventario" class="text-sm font-medium text-brand hover:text-brand-strong">
          Ir a la despensa →
        </RouterLink>
      </div>

      <template v-else>
        <p class="text-sm text-ink-soft mb-4">
          Tienes <strong class="text-ink">{{ productsStore.products.length }}</strong> ingredientes ·
          <strong class="text-ink">{{ relevantMatches.length }}</strong> recetas compatibles.
        </p>

        <div v-if="displayedMatches.length === 0" class="card text-center py-12 px-6">
          <p class="text-4xl mb-2">🧑‍🍳</p>
          <p class="text-sm text-ink-soft">
            Aún no hay recetas que puedas hacer con lo que tienes.
            <br />Agrega más ingredientes o mira el catálogo completo abajo.
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="(match, i) in displayedMatches"
            :key="match.recipe.id"
            class="card p-4 rise-in"
            :style="{ animationDelay: `${Math.min(i * 35, 350)}ms` }"
          >
            <div class="flex items-start gap-4">
              <MatchBadge :percent="match.matchPercent" />

              <div class="flex-1 min-w-0">
                <p class="font-display text-lg font-semibold text-ink leading-snug">{{ match.recipe.name }}</p>
                <p class="text-sm text-ink-soft mt-0.5 line-clamp-2 leading-snug">{{ match.recipe.description }}</p>

                <p class="text-xs text-ink-faint mt-2 tabular-nums">
                  {{ match.matchCount }}/{{ match.totalIngredients }} ingredientes
                  <span v-if="match.missingIngredients.length > 0">
                    · te falta {{ match.missingIngredients.slice(0, 3).join(', ') }}<span v-if="match.missingIngredients.length > 3"> y {{ match.missingIngredients.length - 3 }} más</span>
                  </span>
                </p>

                <div class="flex items-center gap-4 mt-3">
                  <button
                    @click="toggleSteps(match.recipe.id)"
                    :aria-expanded="openSteps.has(match.recipe.id)"
                    class="text-xs font-medium text-ink-soft hover:text-ink pressable"
                  >
                    {{ openSteps.has(match.recipe.id) ? 'Ocultar preparación' : 'Ver preparación' }}
                  </button>
                  <button
                    v-if="match.matchPercent >= 50"
                    @click="saveMatchedRecipe(match)"
                    :disabled="savingId === match.recipe.id"
                    class="text-xs font-semibold text-brand hover:text-brand-strong disabled:opacity-50 pressable"
                  >
                    {{ savingId === match.recipe.id ? 'Guardando…' : '+ Guardar esta receta' }}
                  </button>
                </div>

                <!-- Preparación (preview) -->
                <div v-if="openSteps.has(match.recipe.id)" class="mt-3 pt-3 border-t border-line-soft space-y-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Ingredientes</p>
                    <ul class="text-sm space-y-0.5">
                      <li v-for="(ing, j) in match.recipe.ingredients" :key="j" class="flex justify-between gap-3">
                        <span class="text-ink">{{ ing.name }}</span>
                        <span class="text-ink-faint tabular-nums shrink-0">{{ ing.quantity }} {{ ing.unit }}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Preparación</p>
                    <ol class="space-y-2">
                      <li v-for="step in match.recipe.steps" :key="step.order" class="flex gap-2.5 text-sm text-ink">
                        <span class="shrink-0 w-5 h-5 grid place-items-center bg-brand text-white rounded-full text-[0.65rem] font-semibold font-display mt-0.5">{{ step.order }}</span>
                        <span class="leading-snug pt-px">{{ step.description }}</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          v-if="lowMatches.length"
          @click="showAllMatches = !showAllMatches"
          class="mt-4 w-full text-sm font-medium text-ink-soft hover:text-ink border border-line rounded-xl py-2.5 pressable"
        >
          {{ showAllMatches ? 'Ocultar las de bajo match' : `Ver ${lowMatches.length} recetas con menos ingredientes en común` }}
        </button>
      </template>
    </div>

    <!-- ─── TAB: IA ─── -->
    <div v-if="activeTab === 'ai'">
      <div class="card p-5 space-y-4 mb-4">
        <!-- Personas + tipo de plato -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label :class="labelCls">Personas</label>
            <input v-model.number="ai.servings" type="number" min="1" max="20" :class="fieldCls" />
          </div>
          <div>
            <label :class="labelCls">Tipo de plato</label>
            <select v-model="ai.mealType" :class="fieldCls">
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
          </div>
        </div>

        <!-- Nacionalidad (opcional) + vegano -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
          <div>
            <label :class="labelCls">Cocina / nacionalidad <span class="normal-case font-normal text-ink-faint">(opcional)</span></label>
            <input v-model="ai.cuisine" type="text" placeholder="ej. italiana, mexicana, tailandesa…" :class="fieldCls" />
          </div>
          <label class="flex items-center gap-2.5 text-sm text-ink select-none cursor-pointer py-2.5">
            <input v-model="ai.vegan" type="checkbox" class="w-4 h-4 accent-brand" />
            Plato vegano
          </label>
        </div>

        <!-- Contexto -->
        <div>
          <label :class="labelCls">Contexto adicional <span class="normal-case font-normal text-ink-faint">(opcional)</span></label>
          <input v-model="ai.context" type="text" placeholder="ej. rápido, picante, bajo en calorías…" :class="fieldCls" />
        </div>

        <!-- Ingredientes (opcional, colapsable) -->
        <div class="border-t border-line-soft pt-4">
          <button
            type="button"
            @click="ai.showIngredients = !ai.showIngredients"
            class="flex items-center justify-between w-full text-sm font-medium text-ink pressable"
          >
            <span>Usar ingredientes que tengo <span class="font-normal text-ink-faint">(opcional)</span></span>
            <span class="flex items-center gap-2">
              <span v-if="selectedIngredients.size" class="text-xs bg-brand-tint text-brand-ink rounded-full px-2 py-0.5 font-semibold tabular-nums">{{ selectedIngredients.size }}</span>
              <span class="text-ink-faint">{{ ai.showIngredients ? '▴' : '▾' }}</span>
            </span>
          </button>
          <div v-if="ai.showIngredients" class="mt-3">
            <div v-if="productsStore.products.length === 0" class="text-sm text-ink-faint">Tu despensa está vacía.</div>
            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="product in productsStore.products"
                :key="product.id"
                @click="toggleIngredient(product.id)"
                :class="[
                  'px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium border pressable',
                  selectedIngredients.has(product.id)
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-surface text-ink-soft border-line hover:border-brand/50 hover:text-ink',
                ]"
              >
                {{ product.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="generateWithAI"
        :disabled="aiLoading"
        class="w-full bg-ink hover:bg-[oklch(0.32_0.03_52)] disabled:opacity-50 text-paper font-semibold py-3.5 rounded-2xl shadow-warm pressable"
      >
        {{ aiLoading ? '✨ Generando…' : '✨ Generar receta' }}
      </button>

      <p v-if="aiError" class="text-danger text-sm mt-3">{{ aiError }}</p>

      <!-- AI Result -->
      <div v-if="aiResult" class="card p-5 mt-6 border-gold/30 rise-in">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-display text-xl font-semibold text-ink">{{ aiResult.name }}</h3>
          <span class="text-[0.7rem] font-semibold bg-gold-tint text-gold-ink rounded-full px-2 py-0.5">✨ IA</span>
        </div>
        <p class="text-sm text-ink-soft mb-4 leading-relaxed">{{ aiResult.description }}</p>

        <div class="mb-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Ingredientes ({{ aiResult.servings }} porciones)</p>
          <ul class="divide-y divide-line-soft">
            <li v-for="(ing, i) in aiResult.ingredients" :key="i" class="text-sm text-ink flex justify-between py-1.5 first:pt-0">
              <span>{{ ing.name }}</span>
              <span class="text-ink-faint tabular-nums">{{ ing.quantity }} {{ ing.unit }}</span>
            </li>
          </ul>
        </div>

        <div class="mb-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Preparación</p>
          <ol class="space-y-2.5">
            <li v-for="step in aiResult.steps" :key="step.order" class="flex gap-3 text-sm text-ink">
              <span class="shrink-0 w-6 h-6 grid place-items-center bg-brand text-white rounded-full font-display text-xs font-semibold mt-0.5">
                {{ step.order }}
              </span>
              <span class="leading-relaxed pt-0.5">{{ step.description }}</span>
            </li>
          </ol>
        </div>

        <button
          @click="saveAIRecipe"
          :disabled="savingAI"
          class="w-full bg-brand hover:bg-brand-strong disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl shadow-warm-sm pressable"
        >
          {{ savingAI ? 'Guardando…' : 'Guardar receta' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import MatchBadge from '@/components/MatchBadge.vue'
import { useProductsStore } from '@/stores/products'
import { useRecipesStore } from '@/stores/recipes'
import { useToastStore } from '@/stores/toast'
import { logError, reportError } from '@/lib/errors'
import { matchRecipes } from '@/lib/recipeMatching'
import { normalizeUnit } from '@/lib/units'
import { supabase } from '@/lib/supabase'
import baseRecipes from '@/data/baseRecipes.json'
import type { BaseRecipe, MatchedRecipe, RecipeIngredientInsert } from '@/types'

const productsStore = useProductsStore()
const recipesStore = useRecipesStore()
const toast = useToastStore()
const router = useRouter()

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5'
const fieldCls =
  'w-full bg-paper/50 border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out'

const activeTab = ref<'matching' | 'ai'>('matching')
const tabs = [
  { id: 'matching' as const, label: '🔍 Por ingredientes' },
  { id: 'ai' as const, label: '✨ Generar con IA' },
]

// ── Matching ──
const MIN_MATCH = 40

const matchedRecipes = computed<MatchedRecipe[]>(() =>
  matchRecipes(baseRecipes as BaseRecipe[], productsStore.products),
)

const showAllMatches = ref(false)
const relevantMatches = computed(() => matchedRecipes.value.filter((m) => m.matchPercent >= MIN_MATCH))
const lowMatches = computed(() => matchedRecipes.value.filter((m) => m.matchPercent < MIN_MATCH))
const displayedMatches = computed(() =>
  showAllMatches.value ? matchedRecipes.value : relevantMatches.value,
)

const openSteps = ref<Set<string>>(new Set())
function toggleSteps(id: string) {
  const next = new Set(openSteps.value)
  next.has(id) ? next.delete(id) : next.add(id)
  openSteps.value = next
}

const savingId = ref<string | null>(null)

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
        unit: normalizeUnit(ing.unit),
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
    toast.success('Receta guardada')
    router.push(`/recetas/${recipe.id}`)
  } catch (err: unknown) {
    await reportError(err, 'guardar receta sugerida')
  } finally {
    savingId.value = null
  }
}

// ── Generación con IA ──
const selectedIngredients = ref<Set<string>>(new Set())
const aiLoading = ref(false)
const aiError = ref('')
const savingAI = ref(false)

const ai = reactive({
  servings: 2,
  mealType: 'almuerzo' as 'desayuno' | 'almuerzo' | 'cena',
  cuisine: '',
  vegan: false,
  context: '',
  showIngredients: false,
})

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
  const next = new Set(selectedIngredients.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIngredients.value = next
}

async function generateWithAI() {
  aiLoading.value = true
  aiError.value = ''
  aiResult.value = null

  const selectedProducts = productsStore.products.filter((p) => selectedIngredients.value.has(p.id))

  try {
    const { data, error } = await supabase.functions.invoke('generate-recipe', {
      body: {
        ingredients: selectedProducts.map((p) => ({ name: p.name, unit: p.unit })),
        servings: ai.servings,
        mealType: ai.mealType,
        cuisine: ai.cuisine.trim() || undefined,
        vegan: ai.vegan,
        context: ai.context.trim() || undefined,
      },
    })

    if (error) throw error
    aiResult.value = data as AIRecipeResult
  } catch (err: unknown) {
    aiError.value = (await logError(err, 'generar receta con IA')).message
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
        unit: normalizeUnit(ing.unit),
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
    toast.success('Receta guardada')
    router.push(`/recetas/${recipe.id}`)
  } catch (err: unknown) {
    await reportError(err, 'guardar receta de IA')
  } finally {
    savingAI.value = false
  }
}

onMounted(() => productsStore.fetchProducts())
</script>
