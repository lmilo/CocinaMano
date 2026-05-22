<template>
  <AppLayout>
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/recetas" class="text-gray-400 hover:text-gray-600">← Volver</RouterLink>
      <h2 class="text-xl font-bold text-gray-800">Nueva Receta</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic info -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Información básica</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la receta</label>
          <input
            v-model="form.name"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="ej. Arroz con pollo"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            v-model="form.description"
            rows="2"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Breve descripción de la receta"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Porciones</label>
          <input
            v-model.number="form.servings"
            type="number"
            min="1"
            required
            class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <!-- Ingredients -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Ingredientes</h3>

        <div v-if="ingredients.length === 0" class="text-sm text-gray-400">
          Agrega al menos un ingrediente.
        </div>

        <div v-for="(ing, idx) in ingredients" :key="idx" class="flex gap-2 items-start">
          <div class="flex-1 grid grid-cols-3 gap-2">
            <div class="col-span-3 sm:col-span-1">
              <select
                v-model="ing.product_id"
                @change="onProductSelect(idx)"
                class="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Ingrediente libre</option>
                <option v-for="p in productsStore.products" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
            <input
              v-if="!ing.product_id"
              v-model="ing.ingredient_name"
              placeholder="Nombre"
              required
              class="col-span-3 sm:col-span-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div v-else class="col-span-3 sm:col-span-1 flex items-center px-2 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
              {{ ing.ingredient_name }}
            </div>
            <input
              v-model.number="ing.quantity"
              type="number"
              min="0"
              step="any"
              placeholder="Cant."
              required
              class="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button type="button" @click="removeIngredient(idx)" class="text-gray-400 hover:text-red-400 pt-2">✕</button>
        </div>

        <button
          type="button"
          @click="addIngredient"
          class="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          + Agregar ingrediente
        </button>

        <!-- Cost preview -->
        <div v-if="totalCost > 0" class="mt-2 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
          Costo estimado: <strong>${{ totalCost.toLocaleString('es-CO') }}</strong>
          · ${{ costPerServing.toLocaleString('es-CO') }} por porción
        </div>
      </div>

      <!-- Steps -->
      <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Pasos de preparación</h3>

        <div v-for="(step, idx) in steps" :key="idx" class="flex gap-3 items-start">
          <span class="shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mt-2">
            {{ idx + 1 }}
          </span>
          <textarea
            v-model="step.description"
            rows="2"
            required
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            :placeholder="`Paso ${idx + 1}...`"
          />
          <button type="button" @click="removeStep(idx)" class="text-gray-400 hover:text-red-400 pt-2">✕</button>
        </div>

        <button
          type="button"
          @click="addStep"
          class="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          + Agregar paso
        </button>
      </div>

      <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="saving"
        class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {{ saving ? 'Guardando...' : 'Guardar receta' }}
      </button>
    </form>
  </AppLayout>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useProductsStore } from '@/stores/products'
import { useRecipesStore } from '@/stores/recipes'
import type { RecipeIngredientInsert, RecipeStep, Unit } from '@/types'

const productsStore = useProductsStore()
const recipesStore = useRecipesStore()
const router = useRouter()

const saving = ref(false)
const errorMsg = ref('')

const form = reactive({ name: '', description: '', servings: 4 })

interface IngredientRow {
  product_id: string
  ingredient_name: string
  quantity: number
  unit: Unit
  unit_cost: number
}

const ingredients = ref<IngredientRow[]>([])
const steps = ref<RecipeStep[]>([{ order: 1, description: '' }])

function addIngredient() {
  ingredients.value.push({ product_id: '', ingredient_name: '', quantity: 0, unit: 'unidades', unit_cost: 0 })
}

function removeIngredient(idx: number) {
  ingredients.value.splice(idx, 1)
}

function onProductSelect(idx: number) {
  const row = ingredients.value[idx]
  const product = productsStore.products.find((p) => p.id === row.product_id)
  if (product) {
    row.ingredient_name = product.name
    row.unit = product.unit
    row.unit_cost = product.unit_price
  }
}

function addStep() {
  steps.value.push({ order: steps.value.length + 1, description: '' })
}

function removeStep(idx: number) {
  steps.value.splice(idx, 1)
  steps.value.forEach((s, i) => { s.order = i + 1 })
}

const totalCost = computed(() =>
  ingredients.value.reduce((sum, ing) => sum + ing.quantity * ing.unit_cost, 0),
)

const costPerServing = computed(() =>
  form.servings > 0 ? Math.round(totalCost.value / form.servings) : 0,
)

async function handleSubmit() {
  if (ingredients.value.length === 0) {
    errorMsg.value = 'Agrega al menos un ingrediente.'
    return
  }
  if (steps.value.length === 0) {
    errorMsg.value = 'Agrega al menos un paso.'
    return
  }

  saving.value = true
  errorMsg.value = ''

  const ingPayload: RecipeIngredientInsert[] = ingredients.value.map((ing) => ({
    product_id: ing.product_id || null,
    ingredient_name: ing.ingredient_name,
    quantity: ing.quantity,
    unit: ing.unit,
    unit_cost: ing.unit_cost,
  }))

  try {
    const recipe = await recipesStore.createRecipe(
      {
        name: form.name,
        description: form.description,
        servings: form.servings,
        total_cost: totalCost.value,
        is_ai_generated: false,
        steps: steps.value,
        cuisine_type: null,
      },
      ingPayload,
    )
    router.push(`/recetas/${recipe.id}`)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>
