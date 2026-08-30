<template>
  <RouterView />
  <ToastHost />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastHost from '@/components/ToastHost.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
onMounted(() => authStore.init())
</script>
