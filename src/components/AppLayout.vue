<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top navbar -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="text-lg font-bold text-emerald-600 tracking-tight">
          🍳 Cocina a Mano
        </RouterLink>
        <nav class="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
          <RouterLink to="/" class="hover:text-emerald-600 transition-colors" active-class="text-emerald-600">Inicio</RouterLink>
          <RouterLink to="/inventario" class="hover:text-emerald-600 transition-colors" active-class="text-emerald-600">Inventario</RouterLink>
          <RouterLink to="/recetas" class="hover:text-emerald-600 transition-colors" active-class="text-emerald-600">Recetas</RouterLink>
        </nav>
        <button
          @click="handleSignOut"
          class="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Salir
        </button>
      </div>
    </header>

    <!-- Mobile bottom nav -->
    <nav class="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10 flex">
      <RouterLink to="/" class="flex-1 flex flex-col items-center py-2 text-xs text-gray-500" active-class="text-emerald-600">
        <span class="text-xl">🏠</span>Inicio
      </RouterLink>
      <RouterLink to="/inventario" class="flex-1 flex flex-col items-center py-2 text-xs text-gray-500" active-class="text-emerald-600">
        <span class="text-xl">🥦</span>Inventario
      </RouterLink>
      <RouterLink to="/recetas" class="flex-1 flex flex-col items-center py-2 text-xs text-gray-500" active-class="text-emerald-600">
        <span class="text-xl">📖</span>Recetas
      </RouterLink>
      <RouterLink to="/recetas/generar" class="flex-1 flex flex-col items-center py-2 text-xs text-gray-500" active-class="text-emerald-600">
        <span class="text-xl">✨</span>Generar
      </RouterLink>
    </nav>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 sm:pb-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  await authStore.signOut()
  router.push('/auth')
}
</script>
