<template>
  <RouterLink
    :to="`/recetas/${recipe.id}`"
    class="block bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-sm transition-all group"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-semibold text-gray-800 group-hover:text-emerald-600 truncate">{{ recipe.name }}</p>
          <span v-if="recipe.is_ai_generated" class="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 shrink-0">✨ IA</span>
        </div>
        <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ recipe.description }}</p>
      </div>
      <button
        @click.prevent="$emit('delete', recipe.id)"
        class="text-gray-300 hover:text-red-400 transition-colors text-sm shrink-0"
      >
        🗑️
      </button>
    </div>
    <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
      <span>🍽️ {{ recipe.servings }} porciones</span>
      <span>💰 ${{ recipe.total_cost.toLocaleString('es-CO') }}</span>
      <span>💵 ${{ costPerServing }}/porción</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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
