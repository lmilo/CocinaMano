<template>
  <AppLayout>
    <RouterLink to="/recetas" class="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink pressable mb-4">
      ← Volver
    </RouterLink>
    <h1 class="font-display text-3xl font-semibold text-ink mb-6">Nueva receta</h1>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Basic info -->
      <section class="card p-5 space-y-4">
        <h2 class="font-display text-lg font-semibold text-ink">Información básica</h2>
        <div>
          <label :class="labelCls">Nombre de la receta</label>
          <input v-model="form.name" required :class="fieldCls" placeholder="ej. Arroz con pollo" />
        </div>
        <div>
          <label :class="labelCls">Descripción</label>
          <textarea v-model="form.description" rows="2" :class="fieldCls" placeholder="Breve descripción de la receta" />
        </div>
        <div>
          <label :class="labelCls">Porciones</label>
          <input v-model.number="form.servings" type="number" min="1" required :class="[fieldCls, 'w-32']" />
        </div>
      </section>

      <!-- Ingredients -->
      <section class="card p-5 space-y-4">
        <h2 class="font-display text-lg font-semibold text-ink">Ingredientes</h2>

        <div v-if="ingredients.length === 0" class="text-sm text-ink-faint">Agrega al menos un ingrediente.</div>

        <div v-for="(ing, idx) in ingredients" :key="idx" class="flex gap-2 items-start">
          <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="col-span-2 sm:col-span-1">
              <select v-model="ing.product_id" @change="onProductSelect(idx)" :class="fieldCls" aria-label="Ingrediente del inventario">
                <option value="">Ingrediente libre</option>
                <option v-for="p in productsStore.products" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <input
              v-if="!ing.product_id"
              v-model="ing.ingredient_name"
              placeholder="Nombre"
              required
              aria-label="Nombre del ingrediente"
              :class="[fieldCls, 'col-span-2 sm:col-span-1']"
            />
            <div v-else class="col-span-2 sm:col-span-1 flex items-center px-3 text-sm text-ink-soft bg-paper/60 rounded-xl border border-line">
              {{ ing.ingredient_name }}
            </div>
            <input v-model.number="ing.quantity" type="number" min="0" step="any" placeholder="Cant." required aria-label="Cantidad" :class="fieldCls" />
            <select v-model="ing.unit" :class="fieldCls" aria-label="Unidad de medida">
              <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
          <button type="button" @click="removeIngredient(idx)" class="grid place-items-center w-9 h-9 mt-0.5 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-tint pressable" aria-label="Quitar ingrediente">✕</button>
        </div>

        <button type="button" @click="addIngredient" class="text-sm text-brand hover:text-brand-strong font-medium pressable">
          + Agregar ingrediente
        </button>

        <!-- Cost preview -->
        <div v-if="totalCost > 0" class="p-3 bg-brand-tint/60 border border-brand/20 rounded-xl text-sm text-ink tabular-nums">
          Costo estimado: <strong>${{ totalCost.toLocaleString('es-CO') }}</strong>
          · <span class="text-brand font-semibold">${{ costPerServing.toLocaleString('es-CO') }}</span> por porción
        </div>
      </section>

      <!-- Steps -->
      <section class="card p-5 space-y-4">
        <h2 class="font-display text-lg font-semibold text-ink">Pasos de preparación</h2>

        <div v-for="(step, idx) in steps" :key="idx" class="flex gap-3 items-start">
          <span class="shrink-0 w-7 h-7 grid place-items-center bg-brand text-white rounded-full font-display text-sm font-semibold mt-2">
            {{ idx + 1 }}
          </span>
          <textarea v-model="step.description" rows="2" required :class="[fieldCls, 'flex-1']" :placeholder="`Paso ${idx + 1}…`" />
          <button type="button" @click="removeStep(idx)" class="grid place-items-center w-9 h-9 mt-2 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-tint pressable" aria-label="Quitar paso">✕</button>
        </div>

        <button type="button" @click="addStep" class="text-sm text-brand hover:text-brand-strong font-medium pressable">
          + Agregar paso
        </button>
      </section>

      <p v-if="errorMsg" class="text-danger text-sm">{{ errorMsg }}</p>

      <button
        type="submit"
        :disabled="saving"
        class="w-full bg-brand hover:bg-brand-strong disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl shadow-warm pressable"
      >
        {{ saving ? 'Guardando…' : 'Guardar receta' }}
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
import { useToastStore } from '@/stores/toast'
import { logError } from '@/lib/errors'
import type { RecipeIngredientInsert, RecipeStep, Unit } from '@/types'

const productsStore = useProductsStore()
const recipesStore = useRecipesStore()
const toast = useToastStore()
const router = useRouter()

const saving = ref(false)
const errorMsg = ref('')

const UNITS: Unit[] = ['kg', 'g', 'L', 'ml', 'unidades', 'tazas', 'cucharadas', 'cucharaditas']

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5'
const fieldCls =
  'w-full bg-paper/50 border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out'

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
  steps.value.forEach((s, i) => {
    s.order = i + 1
  })
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
  if (!Number.isFinite(form.servings) || form.servings < 1) {
    errorMsg.value = 'Las porciones deben ser al menos 1.'
    return
  }
  if (ingredients.value.some((ing) => !Number.isFinite(ing.quantity) || ing.quantity <= 0)) {
    errorMsg.value = 'Cada ingrediente debe tener una cantidad mayor que cero.'
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
    toast.success('Receta creada')
    router.push(`/recetas/${recipe.id}`)
  } catch (err: unknown) {
    errorMsg.value = (await logError(err, 'crear receta')).message
  } finally {
    saving.value = false
  }
}
</script>
