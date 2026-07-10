<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-4 bg-ink/40 backdrop-blur-sm modal-backdrop"
    @click.self="$emit('close')"
  >
    <div class="card !shadow-warm-lg w-full max-w-md p-6 modal-panel mb-24 sm:mb-0 max-h-[calc(100dvh-7rem)] overflow-y-auto">
      <h3 class="font-display text-xl font-semibold text-ink mb-5">
        {{ editing ? 'Editar ingrediente' : 'Nuevo ingrediente' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="pf-name" :class="labelCls">Nombre</label>
          <input id="pf-name" v-model="form.name" required :class="fieldCls" placeholder="ej. Arroz" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="pf-category" :class="labelCls">Categoría</label>
            <select id="pf-category" v-model="form.category" required :class="fieldCls">
              <option v-for="(label, val) in CATEGORY_LABELS" :key="val" :value="val">{{ label }}</option>
            </select>
          </div>
          <div>
            <label for="pf-unit" :class="labelCls">Unidad</label>
            <select id="pf-unit" v-model="form.unit" required :class="fieldCls">
              <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="pf-quantity" :class="labelCls">Cantidad disponible</label>
            <input id="pf-quantity" v-model.number="form.quantity" type="number" min="0" step="any" required :class="fieldCls" />
          </div>
          <div>
            <label for="pf-price" :class="labelCls">Precio por unidad ($)</label>
            <input id="pf-price" v-model.number="form.unit_price" type="number" min="0" step="any" required :class="fieldCls" />
          </div>
        </div>

        <div>
          <label for="pf-expiry" :class="labelCls">
            Fecha de caducidad <span class="text-ink-faint font-normal normal-case">(opcional)</span>
          </label>
          <input id="pf-expiry" v-model="form.expiry_date" type="date" :class="fieldCls" />
        </div>

        <p v-if="errorMsg" class="text-danger text-sm">{{ errorMsg }}</p>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 border border-line text-ink-soft hover:bg-paper-deep/50 font-medium py-2.5 rounded-xl pressable text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 bg-brand hover:bg-brand-strong disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl shadow-warm-sm pressable text-sm"
          >
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useProductsStore } from '@/stores/products'
import { logError } from '@/lib/errors'
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

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5'
const fieldCls =
  'w-full bg-paper/50 border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out'

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
  expiry_date: '',
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
      form.expiry_date = val.expiry_date ?? ''
    }
  },
  { immediate: true },
)

async function handleSubmit() {
  if (!Number.isFinite(form.quantity) || form.quantity <= 0) {
    errorMsg.value = 'La cantidad debe ser mayor que cero.'
    return
  }
  if (!Number.isFinite(form.unit_price) || form.unit_price < 0) {
    errorMsg.value = 'El precio no puede ser negativo.'
    return
  }

  saving.value = true
  errorMsg.value = ''
  const payload = { ...form, expiry_date: form.expiry_date || null }
  try {
    if (props.editing) {
      await productsStore.updateProduct(props.editing.id, payload)
    } else {
      await productsStore.addProduct(payload)
    }
    emit('saved')
  } catch (err: unknown) {
    errorMsg.value = (await logError(err, 'guardar ingrediente')).message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  animation: backdrop-in 0.2s ease-out both;
}
.modal-panel {
  animation: panel-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}
@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
}
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop,
  .modal-panel {
    animation: none;
  }
}
</style>
