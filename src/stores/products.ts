import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Product, ProductInsert } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (err) {
      error.value = err.message
    } else {
      products.value = data ?? []
    }
    loading.value = false
  }

  async function addProduct(payload: ProductInsert) {
    const { data, error: err } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()
    if (err) throw new Error(err.message)
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
    if (err) throw new Error(err.message)
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx !== -1) products.value[idx] = data
  }

  async function deleteProduct(id: string) {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) throw new Error(err.message)
    products.value = products.value.filter((p) => p.id !== id)
  }

  return { products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct }
})
