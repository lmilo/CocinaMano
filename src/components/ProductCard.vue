<template>
  <div class="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
    <div class="flex-1 min-w-0">
      <p class="font-medium text-gray-800 truncate">{{ product.name }}</p>
      <p class="text-xs text-gray-500 mt-0.5">
        {{ product.quantity }} {{ product.unit }} · ${{ product.unit_price.toLocaleString('es-CO') }}/{{ product.unit }}
      </p>
    </div>
    <div class="flex items-center gap-2 ml-4">
      <span class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
        {{ CATEGORY_LABELS[product.category] }}
      </span>
      <button @click="$emit('edit', product)" class="text-gray-400 hover:text-emerald-600 transition-colors text-sm">✏️</button>
      <button @click="$emit('delete', product.id)" class="text-gray-400 hover:text-red-500 transition-colors text-sm">🗑️</button>
    </div>
  </div>
</template>

<script setup lang="ts">
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

defineProps<{ product: Product }>()
defineEmits<{ edit: [product: Product]; delete: [id: string] }>()
</script>
