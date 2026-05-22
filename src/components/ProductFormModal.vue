<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/40 z-20 flex items-end sm:items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
      <h3 class="text-lg font-bold text-gray-800 mb-5">
        {{ editing ? 'Editar ingrediente' : 'Nuevo ingrediente' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            v-model="form.name"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="ej. Arroz"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              v-model="form.category"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option v-for="(label, val) in CATEGORY_LABELS" :key="val" :value="val">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <select
              v-model="form.unit"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad disponible</label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              step="any"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Precio por unidad ($)</label>
            <input
              v-model.number="form.unit_price"
              type="number"
              min="0"
              step="any"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
          >
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useProductsStore } from '@/stores/products'
import type { Product, ProductCategory, Unit } from '@/types'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  nevera: '❄️ Nevera',
  congelador: '🧊 Congelador',
  despensa: '🏠 Despensa',
  especias: '🌶️ Especias',
  panaderia: '🍞 Panadería',
  bebidas: '🥤 Bebidas',
  otro: '📦 Otro',
}

const UNITS: Unit[] = ['kg', 'g', 'L', 'ml', 'unidades', 'tazas', 'cucharadas', 'cucharaditas']

const props = defineProps<{ editing: Product | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const productsStore = useProductsStore()
const saving = ref(false)
const errorMsg = ref('')

const form = reactive({
  name: '',
  category: 'despensa' as ProductCategory,
  unit: 'unidades' as Unit,
  quantity: 0,
  unit_price: 0,
})

watch(
  () => props.editing,
  (val) => {
    if (val) {
      form.name = val.name
      form.category = val.category
      form.unit = val.unit
      form.quantity = val.quantity
      form.unit_price = val.unit_price
    }
  },
  { immediate: true },
)

async function handleSubmit() {
  saving.value = true
  errorMsg.value = ''
  try {
    if (props.editing) {
      await productsStore.updateProduct(props.editing.id, { ...form })
    } else {
      await productsStore.addProduct({ ...form })
    }
    emit('saved')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>
