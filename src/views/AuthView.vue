<template>
  <div class="relative min-h-screen flex items-center justify-center px-5 overflow-hidden">
    <!-- Fondo cálido decorativo -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10"
      style="
        background:
          radial-gradient(60% 50% at 15% 0%, var(--color-gold-tint), transparent 70%),
          radial-gradient(55% 45% at 95% 100%, var(--color-brand-tint), transparent 70%);
      "
    />
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-10 -right-6 text-[7rem] opacity-10 rotate-12 select-none"
    >
      🍅
    </div>

    <div class="w-full max-w-sm text-center rise-in">
      <span
        class="inline-grid place-items-center w-16 h-16 rounded-2xl bg-brand text-white text-3xl shadow-warm mb-7"
      >
        🍳
      </span>

      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand mb-3">
        Tu despensa, tus recetas
      </p>
      <h1 class="font-display text-[2.7rem] leading-[1.05] font-semibold text-ink mb-4">
        Cocina a Mano
      </h1>
      <p class="text-ink-soft text-[0.95rem] leading-relaxed mb-9 text-balance">
        Lleva el inventario de tu cocina y descubre qué preparar con lo que ya tienes en casa.
      </p>

      <p v-if="errorMsg" class="text-danger text-sm mb-4">{{ errorMsg }}</p>

      <button
        @click="handleEnter"
        :disabled="loading"
        class="group w-full bg-brand hover:bg-brand-strong disabled:opacity-60 text-white font-semibold text-[0.95rem] py-3.5 rounded-2xl shadow-warm pressable inline-flex items-center justify-center gap-2"
      >
        {{ loading ? 'Entrando…' : 'Entrar a mi cocina' }}
        <span v-if="!loading" class="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
      </button>

      <p class="text-xs text-ink-faint mt-6 leading-relaxed">
        Sin correo ni contraseña. Tu sesión se guarda en este navegador.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { logError } from '@/lib/errors'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')

async function handleEnter() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.signInAnonymously()
    router.push('/')
  } catch (err: unknown) {
    errorMsg.value = (await logError(err, 'entrar')).message
  } finally {
    loading.value = false
  }
}
</script>
