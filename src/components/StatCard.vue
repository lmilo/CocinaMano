<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 text-center">
    <p class="text-2xl">{{ icon }}</p>
    <p class="text-2xl font-bold text-gray-800 mt-1">{{ value }}</p>
    <p class="text-xs text-gray-500 mt-0.5">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number; icon: string }>()
</script>
