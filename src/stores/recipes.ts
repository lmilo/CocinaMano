import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errors'
import type { Recipe, RecipeInsert, RecipeIngredientInsert } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRecipes() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .order('created_at', { ascending: false })
      if (err) throw err
      recipes.value = data ?? []
    } catch (e) {
      error.value = (await logError(e, 'cargar recetas')).message
    } finally {
      loading.value = false
    }
  }

  async function fetchRecipeById(id: string): Promise<Recipe | null> {
    const { data, error: err } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('id', id)
      .single()
    if (err) throw err
    return data
  }

  async function createRecipe(
    payload: RecipeInsert,
    ingredients: RecipeIngredientInsert[],
  ): Promise<Recipe> {
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .insert(payload)
      .select()
      .single()
    if (recipeErr) throw recipeErr

    if (ingredients.length > 0) {
      const rows = ingredients.map((ing) => ({ ...ing, recipe_id: recipe.id }))
      const { error: ingErr } = await supabase.from('recipe_ingredients').insert(rows)
      if (ingErr) throw ingErr
    }

    const full = await fetchRecipeById(recipe.id)
    if (full) recipes.value.unshift(full)
    return full ?? recipe
  }

  async function deleteRecipe(id: string) {
    const { error: err } = await supabase.from('recipes').delete().eq('id', id)
    if (err) throw err
    recipes.value = recipes.value.filter((r) => r.id !== id)
  }

  async function updateRecipe(
    id: string,
    patch: { cooked?: boolean; rating?: number | null },
  ): Promise<Recipe> {
    const { data, error: err } = await supabase
      .from('recipes')
      .update(patch)
      .eq('id', id)
      .select('*, recipe_ingredients(*)')
      .single()
    if (err) throw err
    const idx = recipes.value.findIndex((r) => r.id === id)
    if (idx !== -1) recipes.value[idx] = data
    return data
  }

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    fetchRecipeById,
    createRecipe,
    deleteRecipe,
    updateRecipe,
  }
})
