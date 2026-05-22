<template>
  <div class="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
      <h1 class="text-2xl font-bold text-emerald-600 text-center mb-1">🍳 Cocina a Mano</h1>
      <p class="text-center text-gray-500 text-sm mb-8">
        {{ mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratuita' }}
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="tuemail@ejemplo.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            minlength="8"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <p v-if="errorMsg" class="text-red-500 text-sm text-center">{{ errorMsg }}</p>
        <p v-if="successMsg" class="text-emerald-600 text-sm text-center">{{ successMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {{ loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Registrarse' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        {{ mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
        <button
          @click="toggleMode"
          class="text-emerald-600 font-medium hover:underline ml-1"
        >
          {{ mode === 'login' ? 'Regístrate' : 'Inicia sesión' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  errorMsg.value = ''
  successMsg.value = ''
}

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    if (mode.value === 'login') {
      await authStore.signIn(email.value, password.value)
      router.push('/')
    } else {
      await authStore.signUp(email.value, password.value)
      successMsg.value = 'Revisa tu correo para confirmar tu cuenta.'
    }
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>
