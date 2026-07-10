<template>
  <div
    class="group card flex items-stretch overflow-hidden pressable hover:shadow-warm hover:border-brand/30"
  >
    <!-- Acento por categoría -->
    <span class="w-1.5 shrink-0" :style="{ backgroundColor: categoryColor }" aria-hidden="true" />

    <div class="flex items-center justify-between gap-3 flex-1 min-w-0 pl-3.5 pr-3 py-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="font-medium text-ink truncate">{{ product.name }}</p>
          <span class="text-sm shrink-0" aria-hidden="true">{{ CATEGORY_META[product.category].icon }}</span>
        </div>
        <p class="text-xs text-ink-soft mt-0.5 tabular-nums">
          {{ formatQty(product.quantity) }} {{ product.unit }}
          <span class="text-ink-faint">· ${{ product.unit_price.toLocaleString('es-CO') }}/{{ product.unit }}</span>
        </p>
        <p v-if="expiry" :class="['inline-flex items-center gap-1 text-[0.7rem] mt-1.5 font-semibold px-1.5 py-0.5 rounded-md', expiry.class]">
          {{ expiry.label }}
        </p>
      </div>

      <div class="flex items-center gap-0.5 shrink-0">
        <button
          @click="$emit('edit', product)"
          class="grid place-items-center w-8 h-8 rounded-lg text-ink-faint hover:text-brand hover:bg-brand-tint pressable"
          aria-label="Editar"
        >
          ✏️
        </button>
        <button
          @click="$emit('delete', product.id)"
          class="grid place-items-center w-8 h-8 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-tint pressable"
          aria-label="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product, ProductCategory } from '@/types'

const CATEGORY_META: Record<ProductCategory, { label: string; icon: string; color: string }> = {
  nevera: { label: 'Nevera', icon: '❄️', color: 'oklch(0.7 0.12 230)' },
  congelador: { label: 'Congelador', icon: '🧊', color: 'oklch(0.72 0.1 255)' },
  despensa: { label: 'Despensa', icon: '🏠', color: 'oklch(0.74 0.13 78)' },
  especias: { label: 'Especias', icon: '🌶️', color: 'oklch(0.6 0.18 30)' },
  panaderia: { label: 'Panadería', icon: '🍞', color: 'oklch(0.72 0.11 70)' },
  bebidas: { label: 'Bebidas', icon: '🥤', color: 'oklch(0.68 0.13 200)' },
  otro: { label: 'Otro', icon: '📦', color: 'oklch(0.62 0.03 58)' },
}

const props = defineProps<{ product: Product }>()
defineEmits<{ edit: [product: Product]; delete: [id: string] }>()

const categoryColor = computed(() => CATEGORY_META[props.product.category].color)

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
}

const expiry = computed(() => {
  if (!props.product.expiry_date) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${props.product.expiry_date}T00:00:00`)
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)

  const formatted = target.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  const danger = 'bg-danger-tint text-danger-ink'
  const warn = 'bg-warn-tint text-warn-ink'
  const calm = 'text-ink-faint'

  if (days < 0) return { label: `⚠️ Vencido · ${formatted}`, class: danger }
  if (days === 0) return { label: '⚠️ Vence hoy', class: danger }
  if (days <= 3) return { label: `⏳ Vence en ${days} día${days === 1 ? '' : 's'}`, class: warn }
  return { label: `Caduca ${formatted}`, class: calm }
})
</script>
