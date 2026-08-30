<template>
  <AppLayout>
    <div v-if="loading" class="text-center py-16 text-ink-faint text-sm">Cargando receta…</div>
    <div v-else-if="loadError">
      <ErrorBanner :message="loadError" :dismissible="false" />
      <RouterLink to="/recetas" class="text-sm text-brand hover:text-brand-strong inline-block">← Volver a mis recetas</RouterLink>
    </div>
    <div v-else-if="!recipe" class="card text-center py-16 px-6">
      <p class="text-5xl mb-3">🍽️</p>
      <p class="font-display text-lg text-ink">Receta no encontrada</p>
      <RouterLink to="/recetas" class="text-sm text-brand hover:text-brand-strong mt-2 inline-block">← Volver a mis recetas</RouterLink>
    </div>
    <template v-else>
      <RouterLink to="/recetas" class="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink pressable mb-4">
        ← Volver
      </RouterLink>

      <header class="mb-6 rise-in">
        <div class="flex items-center gap-2 mb-2">
          <span v-if="recipe.is_ai_generated" class="inline-flex items-center gap-1 text-[0.7rem] font-semibold bg-gold-tint text-gold-ink rounded-full px-2 py-0.5">✨ IA</span>
          <span v-if="recipe.cuisine_type" class="text-[0.7rem] font-medium uppercase tracking-wide text-ink-faint">{{ recipe.cuisine_type }}</span>
        </div>
        <h1 class="font-display text-[2.2rem] leading-[1.1] font-semibold text-ink mb-2">{{ recipe.name }}</h1>
        <p class="text-ink-soft leading-relaxed max-w-prose">{{ recipe.description }}</p>
      </header>

      <!-- Portion adjuster + cost -->
      <div class="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-brand-tint/50 border-brand/20">
        <div class="flex items-center gap-2.5">
          <span class="text-sm font-medium text-ink">Porciones</span>
          <button @click="decServings" class="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-surface border border-line text-ink hover:border-brand pressable flex items-center justify-center font-bold text-lg" aria-label="Disminuir porciones">−</button>
          <span class="w-8 text-center font-display text-lg font-semibold text-ink tabular-nums">{{ targetServings }}</span>
          <button @click="incServings" class="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-surface border border-line text-ink hover:border-brand pressable flex items-center justify-center font-bold text-lg" aria-label="Aumentar porciones">+</button>
        </div>
        <div class="text-sm text-ink-soft sm:ml-auto tabular-nums">
          Total <strong class="text-ink">${{ adjustedTotal.toLocaleString('es-CO') }}</strong>
          · <strong class="text-brand">${{ adjustedPerServing.toLocaleString('es-CO') }}</strong>/porción
        </div>
      </div>

      <!-- Ingredients -->
      <div class="card p-5 mb-5">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="font-display text-lg font-semibold text-ink">Ingredientes</h2>
          <span
            v-if="totalIngredients"
            class="text-[0.72rem] font-semibold px-2 py-0.5 rounded-full tabular-nums"
            :class="missingCount === 0 ? 'bg-herb-tint text-herb-ink' : 'bg-warn-tint text-warn-ink'"
          >
            {{ missingCount === 0 ? '✓ Tienes todo' : `Te faltan ${missingCount}` }}
          </span>
        </div>
        <ul class="divide-y divide-line-soft">
          <li
            v-for="ing in recipe.recipe_ingredients"
            :key="ing.id"
            class="flex justify-between items-baseline gap-3 py-2 text-sm first:pt-0 last:pb-0"
          >
            <span class="flex items-baseline gap-2 min-w-0">
              <span
                class="shrink-0 text-xs"
                :class="inPantry(ing.ingredient_name) ? 'text-herb' : 'text-ink-faint'"
                :title="inPantry(ing.ingredient_name) ? 'En tu despensa' : 'Te falta'"
                aria-hidden="true"
              >
                {{ inPantry(ing.ingredient_name) ? '✓' : '○' }}
              </span>
              <span :class="inPantry(ing.ingredient_name) ? 'text-ink' : 'text-ink-soft'">{{ ing.ingredient_name }}</span>
            </span>
            <span class="text-ink-soft tabular-nums text-right shrink-0">
              {{ scaledQty(ing.quantity) }} {{ ing.unit }}
              <span v-if="ing.unit_cost > 0" class="text-ink-faint ml-1">
                · ${{ (scaledQty(ing.quantity) * ing.unit_cost).toLocaleString('es-CO', { maximumFractionDigits: 0 }) }}
              </span>
            </span>
          </li>
        </ul>
        <button
          v-if="missingCount > 0"
          @click="addMissing"
          class="mt-4 w-full text-sm font-medium text-brand hover:text-brand-strong border border-brand/30 bg-brand-tint/40 rounded-xl py-2.5 pressable"
        >
          🛒 Añadir lo que falta a la compra
        </button>
      </div>

      <!-- Steps -->
      <div class="card p-5">
        <h2 class="font-display text-lg font-semibold text-ink mb-4">Preparación</h2>
        <ol class="space-y-4">
          <li
            v-for="step in recipe.steps"
            :key="step.order"
            class="flex gap-3.5"
          >
            <span class="shrink-0 w-7 h-7 grid place-items-center bg-brand text-white rounded-full font-display text-sm font-semibold mt-0.5">
              {{ step.order }}
            </span>
            <p class="text-[0.95rem] text-ink leading-relaxed pt-0.5">{{ step.description }}</p>
          </li>
        </ol>
      </div>

      <!-- Valoración -->
      <div class="card p-5 mt-5 bg-gold-tint/30 border-gold/25">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 class="font-display text-lg font-semibold text-ink">¿Ya la preparaste?</h2>
            <p class="text-sm text-ink-soft mt-0.5">
              {{ recipe.rating ? `Tu nota: ${recipe.rating} de 5` : 'Márcala como preparada y ponle tu nota.' }}
            </p>
          </div>
          <button
            @click="toggleCooked"
            :disabled="savingMeta"
            :class="[
              'text-sm font-semibold px-4 py-2 rounded-xl pressable shrink-0',
              recipe.cooked
                ? 'bg-herb-tint text-herb-ink border border-herb/30'
                : 'bg-brand text-white shadow-warm-sm',
            ]"
          >
            {{ recipe.cooked ? '✓ Preparada' : 'Marcar como preparada' }}
          </button>
        </div>
        <div class="flex items-center gap-3 mt-4">
          <StarRating :model-value="recipe.rating" @update:model-value="setRating" />
          <button
            v-if="recipe.rating"
            @click="setRating(null)"
            class="text-xs text-ink-faint hover:text-danger pressable"
          >
            Quitar nota
          </button>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import StarRating from '@/components/StarRating.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useRecipesStore } from '@/stores/recipes'
import { useProductsStore } from '@/stores/products'
import { useShoppingStore } from '@/stores/shopping'
import { useToastStore } from '@/stores/toast'
import { reportError, logError } from '@/lib/errors'
import { scaleIngredient, adjustedCost, buildInventoryIndex, hasIngredient } from '@/lib/recipeMatching'
import type { Recipe } from '@/types'

const route = useRoute()
const recipesStore = useRecipesStore()
const productsStore = useProductsStore()
const shopping = useShoppingStore()
const toast = useToastStore()

const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const loadError = ref('')
const targetServings = ref(1)

const invIndex = computed(() => buildInventoryIndex(productsStore.products))
function inPantry(name: string): boolean {
  return hasIngredient(name, invIndex.value)
}

const missingCount = computed(
  () => recipe.value?.recipe_ingredients?.filter((i) => !inPantry(i.ingredient_name)).length ?? 0,
)
const totalIngredients = computed(() => recipe.value?.recipe_ingredients?.length ?? 0)

const savingMeta = ref(false)

async function persistMeta(patch: { cooked?: boolean; rating?: number | null }): Promise<boolean> {
  if (!recipe.value) return false
  savingMeta.value = true
  try {
    recipe.value = await recipesStore.updateRecipe(recipe.value.id, patch)
    return true
  } catch (err: unknown) {
    await reportError(err, 'guardar valoración')
    return false
  } finally {
    savingMeta.value = false
  }
}

async function setRating(n: number | null) {
  if (n !== null && (!Number.isInteger(n) || n < 1 || n > 5)) return
  // Poner nota implica que ya la preparaste; quitar la nota no la marca como no preparada.
  const ok = await persistMeta(n === null ? { rating: null } : { rating: n, cooked: true })
  if (ok) toast.success(n === null ? 'Nota quitada' : 'Nota guardada')
}

async function toggleCooked() {
  if (!recipe.value) return
  const next = !recipe.value.cooked
  // Si la desmarcas como preparada, también se quita la nota.
  const ok = await persistMeta(next ? { cooked: true } : { cooked: false, rating: null })
  if (!ok) return
  if (next) {
    const spent = await spendPantry()
    toast.success(spent > 0 ? `Preparada · desconté ${spent} de tu despensa` : 'Marcada como preparada')
  } else {
    toast.success('Marcada como pendiente')
  }
}

/** Descuenta de la despensa los ingredientes cuyo producto coincide en nombre y unidad. */
async function spendPantry(): Promise<number> {
  if (!recipe.value) return 0
  let n = 0
  for (const ing of recipe.value.recipe_ingredients ?? []) {
    const p = productsStore.products.find(
      (x) => x.name.toLowerCase().trim() === ing.ingredient_name.toLowerCase().trim(),
    )
    if (p && p.unit === ing.unit && p.quantity > 0) {
      const newQty = Math.max(0, Math.round((p.quantity - ing.quantity) * 1000) / 1000)
      try {
        await productsStore.updateProduct(p.id, { quantity: newQty })
        n++
      } catch {
        /* si falla uno, seguimos con el resto */
      }
    }
  }
  return n
}

async function addMissing() {
  const missing = recipe.value?.recipe_ingredients?.filter((i) => !inPantry(i.ingredient_name)) ?? []
  if (!missing.length) return
  try {
    const n = await shopping.addMany(
      missing.map((i) => ({ name: i.ingredient_name, quantity: i.quantity, unit: i.unit })),
    )
    toast.success(
      n > 0
        ? `${n} ${n === 1 ? 'artículo añadido' : 'artículos añadidos'} a tu lista de compras`
        : 'Ya estaban en tu lista',
    )
  } catch (err: unknown) {
    await reportError(err, 'añadir a la compra')
  }
}

onMounted(async () => {
  if (!productsStore.products.length) await productsStore.fetchProducts()
  try {
    recipe.value = await recipesStore.fetchRecipeById(route.params.id as string)
    if (recipe.value) targetServings.value = recipe.value.servings
  } catch (err: unknown) {
    loadError.value = (await logError(err, 'cargar receta')).message
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
