<template>
  <div class="inline-flex items-center gap-0.5" role="group" aria-label="Calificación">
    <template v-if="readonly">
      <span
        v-for="n in 5"
        :key="n"
        :class="[sizeClass, n <= (modelValue || 0) ? 'text-gold' : 'text-ink-faint/50']"
        aria-hidden="true"
      >★</span>
    </template>
    <template v-else>
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        @click="emit('update:modelValue', n)"
        @mouseenter="hover = n"
        @mouseleave="hover = 0"
        :aria-label="`Calificar con ${n} de 5`"
        :aria-pressed="n <= (modelValue || 0)"
        :class="[sizeClass, 'leading-none p-1 pressable']"
      >
        <span :class="n <= display ? 'text-gold' : 'text-ink-faint'">★</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{ modelValue: number | null; readonly?: boolean; size?: 'sm' | 'lg' }>(),
  { readonly: false, size: 'lg' },
)
const emit = defineEmits<{ 'update:modelValue': [n: number] }>()

const hover = ref(0)
const display = computed(() => hover.value || props.modelValue || 0)
const sizeClass = computed(() => (props.size === 'sm' ? 'text-sm' : 'text-2xl'))
</script>
