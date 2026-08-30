<template>
  <AppLayout>
    <div class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-1">Tu lista</p>
      <h1 class="font-display text-3xl font-semibold text-ink leading-none">Compras</h1>
    </div>

    <ErrorBanner :message="store.error" @dismiss="store.error = null" />

    <!-- Agregar -->
    <form @submit.prevent="add" class="flex gap-2 mb-5">
      <input
        v-model="newName"
        type="text"
        placeholder="Agregar a la lista…"
        aria-label="Nuevo artículo"
        class="flex-1 bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[color,border-color,box-shadow] duration-150 ease-out"
      />
      <button
        type="submit"
        :disabled="!newName.trim()"
        class="bg-brand hover:bg-brand-strong disabled:opacity-50 text-white text-sm font-semibold px-4 rounded-xl shadow-warm-sm pressable shrink-0"
      >
        Agregar
      </button>
    </form>

    <div v-if="store.loading" class="text-center py-16 text-ink-faint text-sm">Cargando lista…</div>

    <div v-else-if="store.items.length === 0 && !store.error" class="card text-center py-16 px-6">
      <p class="text-5xl mb-3">🛒</p>
      <p class="font-display text-lg text-ink">Tu lista está vacía</p>
      <p class="text-sm text-ink-soft mt-1">Agrega artículos, o súmalos desde una receta con "lo que te falta".</p>
    </div>

    <template v-else>
      <ul class="space-y-2">
        <li v-for="item in store.items" :key="item.id">
          <div class="card flex items-center gap-3 px-4 py-3 pressable">
            <button
              @click="toggle(item)"
              :aria-pressed="item.checked"
              :aria-label="item.checked ? 'Desmarcar' : 'Marcar como comprado'"
              :class="[
                'grid place-items-center w-6 h-6 rounded-full border-2 shrink-0 pressable transition-colors',
                item.checked ? 'bg-herb border-herb text-white' : 'border-line hover:border-brand',
              ]"
            >
              <span v-if="item.checked" class="text-xs">✓</span>
            </button>
            <div class="flex-1 min-w-0">
              <p :class="['truncate', item.checked ? 'text-ink-faint line-through' : 'text-ink']">{{ item.name }}</p>
              <p v-if="item.quantity" class="text-xs text-ink-faint tabular-nums">{{ item.quantity }} {{ item.unit }}</p>
            </div>
            <button
              @click="del(item.id)"
              class="grid place-items-center w-8 h-8 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-tint pressable shrink-0"
              aria-label="Quitar de la lista"
            >
              🗑️
            </button>
          </div>
        </li>
      </ul>

      <button
        v-if="checkedCount > 0"
        @click="buy"
        :disabled="buying"
        class="mt-5 w-full bg-herb text-white font-semibold py-3 rounded-2xl shadow-warm disabled:opacity-60 pressable"
      >
        {{ buying ? 'Guardando…' : `✓ Comprar marcados (${checkedCount}) → a mi despensa` }}
      </button>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useShoppingStore } from '@/stores/shopping'
import { useToastStore } from '@/stores/toast'
import { reportError } from '@/lib/errors'
import type { ShoppingItem } from '@/types'

const store = useShoppingStore()
const toast = useToastStore()

const newName = ref('')
const buying = ref(false)

const checkedCount = computed(() => store.items.filter((i) => i.checked).length)

async function add() {
  const name = newName.value.trim()
  if (!name) return
  newName.value = ''
  try {
    const n = await store.addMany([{ name }])
    if (n === 0) toast.error('Ya está en la lista')
  } catch (err: unknown) {
    await reportError(err, 'agregar a la lista')
  }
}

async function toggle(item: ShoppingItem) {
  try {
    await store.setChecked(item.id, !item.checked)
  } catch (err: unknown) {
    await reportError(err, 'actualizar artículo')
  }
}

async function del(id: string) {
  try {
    await store.remove(id)
  } catch (err: unknown) {
    await reportError(err, 'quitar artículo')
  }
}

async function buy() {
  buying.value = true
  try {
    const n = await store.buyChecked()
    toast.success(`${n} ${n === 1 ? 'artículo añadido' : 'artículos añadidos'} a tu despensa`)
  } catch (err: unknown) {
    await reportError(err, 'comprar marcados')
  } finally {
    buying.value = false
  }
}

onMounted(() => store.fetchItems())
</script>
