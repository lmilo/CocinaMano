<template>
  <div
    v-if="message"
    class="flex items-start gap-2.5 bg-danger-tint border border-danger/25 text-danger rounded-xl px-4 py-3 mb-4 text-sm rise-in"
  >
    <span class="shrink-0">⚠️</span>
    <p class="flex-1 leading-snug">{{ message }}</p>
    <button
      v-if="dismissible"
      @click="$emit('dismiss')"
      class="shrink-0 text-danger/60 hover:text-danger pressable"
      aria-label="Cerrar"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string | null; dismissible?: boolean }>(), {
  message: '',
  dismissible: true,
})
defineEmits<{ dismiss: [] }>()
</script>
