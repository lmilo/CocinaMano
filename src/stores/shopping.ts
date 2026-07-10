import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errors'
import { useProductsStore } from './products'
import type { ShoppingItem, ShoppingItemInsert } from '@/types'

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<ShoppingItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('shopping_list_items')
        .select('*')
        .order('created_at')
      if (err) throw err
      items.value = data ?? []
    } catch (e) {
      error.value = (await logError(e, 'cargar lista de compras')).message
    } finally {
      loading.value = false
    }
  }

  /** Agrega ítems evitando duplicados por nombre (case-insensitive) con lo ya pendiente. */
  async function addMany(newItems: ShoppingItemInsert[]) {
    const existing = new Set(items.value.map((i) => i.name.toLowerCase().trim()))
    const fresh = newItems.filter((i) => i.name.trim() && !existing.has(i.name.toLowerCase().trim()))
    if (!fresh.length) return 0
    const { data, error: err } = await supabase.from('shopping_list_items').insert(fresh).select()
    if (err) throw err
    items.value.push(...(data ?? []))
    return data?.length ?? 0
  }

  async function setChecked(id: string, checked: boolean) {
    const { data, error: err } = await supabase
      .from('shopping_list_items')
      .update({ checked })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) items.value[idx] = data
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('shopping_list_items').delete().eq('id', id)
    if (err) throw err
    items.value = items.value.filter((i) => i.id !== id)
  }

  /**
   * "Comprar" los marcados: repone el inventario (suma cantidad si el producto ya
   * existe y la unidad coincide; lo crea si no) y los quita de la lista.
   * Devuelve cuántos se procesaron.
   */
  async function buyChecked(): Promise<number> {
    const products = useProductsStore()
    if (!products.products.length) await products.fetchProducts()
    const bought = items.value.filter((i) => i.checked)

    for (const it of bought) {
      const existing = products.products.find(
        (p) => p.name.toLowerCase().trim() === it.name.toLowerCase().trim(),
      )
      if (existing) {
        if (it.quantity && it.unit === existing.unit) {
          await products.updateProduct(existing.id, { quantity: existing.quantity + it.quantity })
        }
      } else {
        await products.addProduct({
          name: it.name,
          category: 'otro',
          quantity: it.quantity ?? 1,
          unit: it.unit ?? 'unidades',
          unit_price: 0,
          expiry_date: null,
        })
      }
    }

    const ids = bought.map((b) => b.id)
    if (ids.length) {
      const { error: err } = await supabase.from('shopping_list_items').delete().in('id', ids)
      if (err) throw err
      items.value = items.value.filter((i) => !i.checked)
    }
    return bought.length
  }

  return { items, loading, error, fetchItems, addMany, setChecked, remove, buyChecked }
})
