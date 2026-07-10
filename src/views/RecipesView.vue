<template>
  <AppLayout>
    <div class="flex items-end justify-between gap-3 mb-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-1">Tu recetario</p>
        <h1 class="font-display text-3xl font-semibold text-ink leading-none">Mis recetas</h1>
      </div>
      <div class="flex gap-2 shrink-0">
        <RouterLink
          to="/recetas/generar"
          class="bg-gold-tint hover:bg-gold/30 text-gold-ink text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-gold/40 pressable"
        >
          ✨ Generar
        </RouterLink>
        <RouterLink
          to="/recetas/crear"
          class="bg-brand hover:bg-brand-strong text-white text-sm font-semibold px-3.5 py-2.5 rounded-xl shadow-warm-sm pressable"
        >
          + Crear
        </RouterLink>
      </div>
    </div>

    <ErrorBanner :message="recipesStore.error" @dismiss="recipesStore.error = null" />

    <div v-if="recipesStore.loading" class="text-center py-16 text-ink-faint text-sm">Cargando recetas…</div>

    <div v-else-if="recipesStore.recipes.length === 0 && !recipesStore.error" class="card text-center py-16 px-6">
      <p class="text-5xl mb-3">📖</p>
      <p class="font-display text-lg text-ink">Tu recetario está en blanco</p>
      <p class="text-sm text-ink-soft mt-1">Crea una receta o genera una a partir de tu despensa.</p>
    </div>

    <div v-else class="grid sm:grid-cols-2 gap-3 sm:gap-4">
      <div
        v-for="(recipe, i) in recipesStore.recipes"
        :key="recipe.id"
        class="rise-in"
        :style="{ animationDelay: `${Math.min(i * 40, 360)}ms` }"
      >
        <RecipeCard :recipe="recipe" @delete="handleDelete" />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useRecipesStore } from '@/stores/recipes'
import { useToastStore } from '@/stores/toast'
import { reportError } from '@/lib/errors'

const recipesStore = useRecipesStore()
const toast = useToastStore()

async function handleDelete(id: string) {
  if (!confirm('¿Eliminar esta receta?')) return
  try {
    await recipesStore.deleteRecipe(id)
    toast.success('Receta eliminada')
  } catch (err: unknown) {
    await reportError(err, 'eliminar receta')
  }
}

onMounted(() => recipesStore.fetchRecipes())
</script>
