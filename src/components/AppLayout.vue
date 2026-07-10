<template>
  <div class="min-h-screen flex flex-col">
    <!-- Top navbar -->
    <header
      class="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-4">
        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <span
            class="grid place-items-center w-9 h-9 rounded-xl bg-brand text-white text-lg shadow-warm-sm pressable group-hover:rotate-6"
          >
            🍳
          </span>
          <span class="font-display text-xl font-semibold text-ink leading-none tracking-tight">
            Cocina<span class="text-brand">·</span>Mano
          </span>
        </RouterLink>

        <nav class="hidden sm:flex items-center gap-1 text-sm font-medium">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="px-3 py-1.5 rounded-full text-ink-soft hover:text-ink hover:bg-paper-deep/60 pressable"
            exact-active-class="!text-brand !bg-brand-tint"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <button
          @click="handleSignOut"
          class="text-sm text-ink-faint hover:text-danger pressable px-2 py-1 rounded-lg"
        >
          Salir
        </button>
      </div>
    </header>

    <!-- Mobile bottom nav -->
    <nav
      class="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-line bg-surface/92 backdrop-blur-md flex pb-[env(safe-area-inset-bottom)]"
    >
      <RouterLink
        v-for="item in mobileNav"
        :key="item.to"
        :to="item.to"
        class="group flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[0.68rem] font-medium text-ink-faint pressable"
        exact-active-class="!text-brand"
      >
        <span
          class="grid place-items-center w-10 h-7 rounded-full text-lg transition-colors duration-200 group-aria-[current=page]:bg-brand-tint"
        >
          {{ item.icon }}
        </span>
        {{ item.label }}
      </RouterLink>
    </nav>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-5 py-7 pb-28 sm:pb-10">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/recetas', label: 'Recetas' },
  { to: '/compras', label: 'Compras' },
]

const mobileNav = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/inventario', label: 'Despensa', icon: '🧺' },
  { to: '/recetas', label: 'Recetas', icon: '📖' },
  { to: '/compras', label: 'Compras', icon: '🛒' },
]

async function handleSignOut() {
  await authStore.signOut()
  router.push('/auth')
}
</script>
