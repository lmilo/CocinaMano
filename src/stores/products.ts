import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errors'
import type { Product, ProductInsert } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.from('products').select('*').order('name')
      if (err) throw err
      products.value = data ?? []
    } catch (e) {
      error.value = (await logError(e, 'cargar inventario')).message
    } finally {
      loading.value = false
    }
  }

  async function addProduct(payload: ProductInsert) {
    const { data, error: err } = await supabase.from('products').insert(payload).select().single()
    if (err) throw err
    products.value.push(data)
    products.value.sort((a, b) => a.name.localeCompare(b.name))
  }

  async function updateProduct(id: string, payload: Partial<ProductInsert>) {
    const { data, error: err } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx !== -1) products.value[idx] = data
  }

  async function deleteProduct(id: string) {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) throw err
    products.value = products.value.filter((p) => p.id !== id)
  }

  return { products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct }
})
