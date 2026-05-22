<template>
  <span
    :class="[
      'text-xs font-semibold px-2 py-0.5 rounded-full',
      percent >= 70 ? 'bg-emerald-100 text-emerald-700' : percent >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-500',
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ percent: number }>()

const label = computed(() => {
  if (props.percent >= 70) return '✅ Puedes hacerlo'
  if (props.percent >= 40) return '⚠️ Casi lista'
  return '❌ Faltan ingredientes'
})
</script>
