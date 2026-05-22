<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">Inventario</h2>
      <button
        @click="showForm = true"
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
          'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
          activeCategory === cat
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400',
        ]"
      >
        {{ CATEGORY_LABELS[cat] }}
      </button>
    </div>

    <!-- Search -->
    <input
      v-model="search"
      type="search"
      placeholder="Buscar ingrediente..."
      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />

    <!-- Loading -->
    <div v-if="productsStore.loading" class="text-center py-12 text-gray-400">Cargando...</div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="text-center py-12 text-gray-400">
      <p class="text-4xl mb-2">🥦</p>
      <p class="text-sm">No hay ingredientes aquí. ¡Agrega uno!</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <ProductCard
        v-for="product in filtered"
        :key="product.id"
        :product="product"
        @edit="startEdit"
        @delete="handleDelete"
      />
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
import { useProductsStore } from '@/stores/products'
import type { Product, ProductCategory } from '@/types'

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

const filtered = computed(() => {
  let list = productsStore.products
  if (activeCategory.value) list = list.filter((p) => p.category === activeCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  return list
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
  closeForm()
}

async function handleDelete(id: string) {
  if (!confirm('¿Eliminar este ingrediente?')) return
  await productsStore.deleteProduct(id)
}

onMounted(() => productsStore.fetchProducts())
</script>
