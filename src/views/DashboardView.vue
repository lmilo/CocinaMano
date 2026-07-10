<template>
  <AppLayout>
    <!-- Hero -->
    <header class="mb-8 rise-in">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-2">{{ today }}</p>
      <h1 class="font-display text-[2.1rem] sm:text-4xl font-semibold text-ink leading-[1.1]">
        {{ greeting }}.
      </h1>
      <p class="text-ink-soft mt-2 text-[0.95rem]">
        Esto es lo que hay en tu cocina hoy.
      </p>
    </header>

    <!-- Stats -->
    <section class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <StatCard label="Ingredientes" :value="productsStore.products.length" icon="🧺" accent="herb" />
      <StatCard label="Recetas guardadas" :value="recipesStore.recipes.length" icon="📖" accent="brand" />
      <StatCard label="Por vencer" :value="expiringSoonCount" icon="⏳" accent="gold" />
      <StatCard label="Categorías" :value="categoryCount" icon="🗂️" accent="brand" />
    </section>

    <!-- Por usar pronto -->
    <section v-if="expiringSoon.length" class="card p-5 mb-6 border-warn/40 bg-warn-tint/40">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-display text-lg font-semibold text-ink">⏳ Por usar pronto</h2>
        <RouterLink to="/inventario" class="text-xs font-medium text-brand hover:text-brand-strong pressable">
          Ver despensa →
        </RouterLink>
      </div>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="p in expiringSoon"
          :key="p.id"
          class="inline-flex items-center gap-1.5 bg-surface border border-line rounded-full pl-3 pr-2.5 py-1 text-sm"
        >
          <span class="text-ink">{{ p.name }}</span>
          <span
            class="text-[0.72rem] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
            :class="p.days < 0 ? 'bg-danger-tint text-danger-ink' : 'bg-warn-tint text-warn-ink'"
          >
            {{ p.tag }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Accesos -->
    <section class="grid sm:grid-cols-2 gap-3 sm:gap-4">
      <RouterLink
        v-for="a in actions"
        :key="a.to"
        :to="a.to"
        :class="[
          'group card p-5 flex items-center gap-4 pressable hover:shadow-warm hover:border-brand/40',
          a.feature ? 'sm:col-span-2 bg-brand-tint/60 border-brand/25' : '',
        ]"
      >
        <span
          class="grid place-items-center w-12 h-12 rounded-2xl text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105"
          :class="a.feature ? 'bg-brand text-white shadow-warm-sm' : 'bg-paper-deep/50'"
        >
          {{ a.icon }}
        </span>
        <div class="min-w-0">
          <p class="font-display text-lg font-semibold leading-tight text-ink">
            {{ a.title }}
          </p>
          <p class="text-sm mt-0.5 text-ink-soft">
            {{ a.desc }}
          </p>
        </div>
        <span
          class="ml-auto text-xl shrink-0 transition-transform duration-200 group-hover:translate-x-1"
          :class="a.feature ? 'text-brand' : 'text-ink-faint'"
        >
          →
        </span>
      </RouterLink>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import StatCard from '@/components/StatCard.vue'
import { useProductsStore } from '@/stores/products'
import { useRecipesStore } from '@/stores/recipes'

const productsStore = useProductsStore()
const recipesStore = useRecipesStore()

const now = new Date()

const greeting = computed(() => {
  const h = now.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const today = computed(() =>
  now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
)

const categoryCount = computed(() => new Set(productsStore.products.map((p) => p.category)).size)

const soonAll = computed(() => {
  const today0 = new Date()
  today0.setHours(0, 0, 0, 0)
  return productsStore.products
    .filter((p) => p.expiry_date)
    .map((p) => {
      const days = Math.round(
        (new Date(`${p.expiry_date}T00:00:00`).getTime() - today0.getTime()) / 86_400_000,
      )
      const tag = days < 0 ? 'vencido' : days === 0 ? 'hoy' : `${days}d`
      return { id: p.id, name: p.name, days, tag }
    })
    .filter((p) => p.days <= 3)
    .sort((a, b) => a.days - b.days)
})
const expiringSoon = computed(() => soonAll.value.slice(0, 8))
const expiringSoonCount = computed(() => soonAll.value.length)

const actions = [
  { to: '/inventario', icon: '🧺', title: 'Mi despensa', desc: 'Gestiona tus ingredientes', feature: false },
  { to: '/recetas', icon: '📖', title: 'Mis recetas', desc: 'Ver y crear recetas', feature: false },
  {
    to: '/recetas/generar',
    icon: '✨',
    title: 'Generar una receta',
    desc: 'Según lo que tienes, o con ayuda de IA',
    feature: true,
  },
]

onMounted(async () => {
  await Promise.all([productsStore.fetchProducts(), recipesStore.fetchRecipes()])
})
</script>
