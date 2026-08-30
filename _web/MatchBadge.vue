<template>
  <div class="flex items-center gap-3" :title="label">
    <svg viewBox="0 0 44 44" class="w-12 h-12 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="22" cy="22" r="19" fill="none" stroke="var(--color-line)" stroke-width="4" />
      <circle
        cx="22"
        cy="22"
        r="19"
        fill="none"
        :stroke="color"
        stroke-width="4"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
    <div class="leading-tight">
      <p class="font-display text-lg font-semibold tabular-nums" :style="{ color: textColor }">{{ percent }}%</p>
      <p class="text-[0.7rem] text-ink-soft">{{ label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ percent: number }>()

const circumference = 2 * Math.PI * 19

const dashOffset = computed(() => circumference * (1 - Math.min(100, Math.max(0, props.percent)) / 100))

const color = computed(() => {
  if (props.percent >= 70) return 'var(--color-herb)'
  if (props.percent >= 40) return 'var(--color-gold)'
  return 'var(--color-danger)'
})

// Texto más oscuro para legibilidad sobre la superficie clara (WCAG AA)
const textColor = computed(() => {
  if (props.percent >= 70) return 'var(--color-herb-ink)'
  if (props.percent >= 40) return 'var(--color-gold-ink)'
  return 'var(--color-danger-ink)'
})

const label = computed(() => {
  if (props.percent >= 70) return 'Puedes hacerla'
  if (props.percent >= 40) return 'Casi lista'
  return 'Faltan cosas'
})
</script>
