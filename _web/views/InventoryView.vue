<template>
  <AppLayout>
    <div class="flex items-end justify-between gap-3 mb-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-1">Tu despensa</p>
        <h1 class="font-display text-3xl font-semibold text-ink leading-none">Inventario</h1>
      </div>
      <button
        @click="showForm = true"
        class="bg-brand hover:bg-brand-strong text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-warm-sm pressable shrink-0"
      >
        + Agregar
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 flex-wrap mb-4">
      <button
        v-for="cat in allCategories"
        :key="cat"
        @click="activeCategory = activeCategory === cat ? null : cat"
        :class="[
          'px-3 py-1.5 rounded-full text-xs font-medium border pressable',
          activeCategory === cat
            ? 'bg-ink text-paper border-ink'
            : 'bg-surface text-ink-soft border-line hover:border-brand/50 hover:text-ink',
        ]"
      >
        {{ CATEGORY_LABELS[cat] }}
      </button>
    </div>

    <!-- Search -->
    <input
      v-model="search"
      type="search"
      placeholder="Buscar ingrediente…"
      class="w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint mb-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[color,border-color,box-shadow] duration-150 ease-out"
    />

    <!-- Ordenar -->
    <div class="flex items-center justify-end gap-2 mb-4 text-xs">
      <span class="text-ink-faint">Ordenar por</span>
      <div class="inline-flex p-0.5 bg-paper-deep/60 rounded-lg" role="group" aria-label="Ordenar por">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          @click="sortBy = opt.value"
          :aria-pressed="sortBy === opt.value"
          :class="[
            'px-2.5 py-1 rounded-md font-medium pressable',
            sortBy === opt.value ? 'bg-surface text-ink shadow-warm-sm' : 'text-ink-soft hover:text-ink',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Error de carga -->
    <ErrorBanner :message="productsStore.error" @dismiss="productsStore.error = null" />

    <!-- Loading -->
    <div v-if="productsStore.loading" class="text-center py-16 text-ink-faint text-sm">Cargando despensa…</div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0 && !productsStore.error" class="card text-center py-16 px-6">
      <p class="text-5xl mb-3">🧺</p>
      <p class="font-display text-lg text-ink">Tu despensa está vacía aquí</p>
      <p class="text-sm text-ink-soft mt-1">Agrega un ingrediente para empezar.</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-2.5">
      <div
        v-for="(product, i) in filtered"
        :key="product.id"
        class="rise-in"
        :style="{ animationDelay: `${Math.min(i * 35, 350)}ms` }"
      >
        <ProductCard :product="product" @edit="startEdit" @delete="handleDelete" />
      </div>
    </div>

    <!-- Modal -->
    <ProductFormModal
      v-if="showForm"
      :editing="editingProduct"
      @close="closeForm"
      @saved="onSaved"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import ProductCard from '@/components/ProductCard.vue'
import ProductFormModal from '@/components/ProductFormModal.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useProductsStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import { reportError } from '@/lib/errors'
import type { Product, ProductCategory } from '@/types'

const toast = useToastStore()

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  nevera: '❄️ Nevera',
  congelador: '🧊 Congelador',
  despensa: '🏠 Despensa',
  especias: '🌶️ Especias',
  panaderia: '🍞 Panadería',
  bebidas: '🥤 Bebidas',
  otro: '📦 Otro',
}

const allCategories = Object.keys(CATEGORY_LABELS) as ProductCategory[]

const productsStore = useProductsStore()
const showForm = ref(false)
const editingProduct = ref<Product | null>(null)
const activeCategory = ref<ProductCategory | null>(null)
const search = ref('')

type SortBy = 'name' | 'expiry'
const sortBy = ref<SortBy>('name')
const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'expiry', label: 'Caducidad' },
]

const filtered = computed(() => {
  let list = productsStore.products.slice()
  if (activeCategory.value) list = list.filter((p) => p.category === activeCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  return list.sort((a, b) => {
    if (sortBy.value === 'expiry') {
      // Sin fecha de caducidad van al final; el resto, lo que vence/venció primero arriba.
      if (!a.expiry_date && !b.expiry_date) return a.name.localeCompare(b.name)
      if (!a.expiry_date) return 1
      if (!b.expiry_date) return -1
      return a.expiry_date.localeCompare(b.expiry_date) // YYYY-MM-DD ⇒ orden cronológico
    }
    return a.name.localeCompare(b.name)
  })
})

function startEdit(product: Product) {
  editingProduct.value = product
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingProduct.value = null
}

function onSaved() {
  const editing = editingProduct.value !== null
  closeForm()
  toast.success(editing ? 'Ingrediente actualizado' : 'Ingrediente agregado')
}

async function handleDelete(id: string) {
  if (!confirm('¿Eliminar este ingrediente?')) return
  try {
    await productsStore.deleteProduct(id)
    toast.success('Ingrediente eliminado')
  } catch (err: unknown) {
    await reportError(err, 'eliminar ingrediente')
  }
}

onMounted(() => productsStore.fetchProducts())
</script>
