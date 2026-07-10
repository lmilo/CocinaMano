<template>
  <div class="card p-4 flex flex-col gap-2">
    <span
      class="grid place-items-center w-9 h-9 rounded-xl text-lg"
      :class="accentClass"
    >
      {{ icon }}
    </span>
    <div>
      <p class="font-display text-3xl font-semibold text-ink leading-none tabular-nums">{{ value }}</p>
      <p class="text-xs text-ink-soft mt-1.5 leading-tight">{{ label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ label: string; value: number; icon: string; accent?: 'brand' | 'herb' | 'gold' }>(),
  { accent: 'brand' },
)

const accentClass = computed(
  () =>
    ({
      brand: 'bg-brand-tint text-brand',
      herb: 'bg-herb-tint text-herb',
      gold: 'bg-gold-tint text-gold',
    })[props.accent],
)
</script>
