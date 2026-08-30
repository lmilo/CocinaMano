<template>
  <RouterLink
    :to="`/recetas/${recipe.id}`"
    class="group card p-4 flex flex-col pressable hover:shadow-warm hover:border-brand/30"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-display text-lg font-semibold text-ink leading-snug truncate group-hover:text-brand transition-colors">
          {{ recipe.name }}
        </h3>
        <p class="text-sm text-ink-soft mt-1 line-clamp-2 leading-normal">{{ recipe.description }}</p>
        <div v-if="recipe.rating || recipe.cooked" class="mt-1.5">
          <StarRating v-if="recipe.rating" :model-value="recipe.rating" readonly size="sm" />
          <span v-else class="text-[0.7rem] font-semibold text-herb-ink bg-herb-tint rounded-full px-2 py-0.5">✓ Preparada</span>
        </div>
      </div>
      <span
        v-if="recipe.is_ai_generated"
        class="shrink-0 inline-flex items-center gap-1 text-[0.7rem] font-semibold bg-gold-tint text-gold-ink rounded-full px-2 py-0.5"
      >
        ✨ IA
      </span>
    </div>

    <div class="flex items-center gap-3 mt-4 pt-3 border-t border-line-soft text-xs text-ink-soft tabular-nums">
      <span class="inline-flex items-center gap-1">🍽️ {{ recipe.servings }} porc.</span>
      <span class="inline-flex items-center gap-1">💰 ${{ recipe.total_cost.toLocaleString('es-CO') }}</span>
      <span class="inline-flex items-center gap-1 font-medium text-ink">${{ costPerServing }}<span class="text-ink-faint font-normal">/porc.</span></span>
      <button
        @click.prevent="$emit('delete', recipe.id)"
        class="ml-auto grid place-items-center w-7 h-7 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-tint pressable"
        aria-label="Eliminar receta"
      >
        🗑️
      </button>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StarRating from '@/components/StarRating.vue'
import type { Recipe } from '@/types'

const props = defineProps<{ recipe: Recipe }>()
defineEmits<{ delete: [id: string] }>()

const costPerServing = computed(() =>
  props.recipe.servings > 0
    ? (props.recipe.total_cost / props.recipe.servings).toLocaleString('es-CO', {
        maximumFractionDigits: 0,
      })
    : '0',
)
</script>
