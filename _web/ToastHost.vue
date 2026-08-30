<template>
  <div
    class="fixed inset-x-0 bottom-20 sm:bottom-6 z-40 flex flex-col items-center gap-2 px-4 pointer-events-none"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-2 max-w-sm rounded-xl px-4 py-2.5 text-sm font-medium shadow-warm-lg border"
        :class="t.type === 'error' ? 'bg-danger-tint border-danger/30 text-danger-ink' : 'bg-ink text-paper border-ink'"
        role="status"
      >
        <span aria-hidden="true">{{ t.type === 'error' ? '⚠️' : '✓' }}</span>
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
