import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Recipe, RecipeInsert, RecipeIngredientInsert } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRecipes() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .order('created_at', { ascending: false })
    if (err) {
      error.value = err.message
    } else {
      recipes.value = data ?? []
    }
    loading.value = false
  }

  async function fetchRecipeById(id: string): Promise<Recipe | null> {
    const { data, error: err } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('id', id)
      .single()
    if (err) throw new Error(err.message)
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
    if (recipeErr) throw new Error(recipeErr.message)

    if (ingredients.length > 0) {
      const rows = ingredients.map((ing) => ({ ...ing, recipe_id: recipe.id }))
      const { error: ingErr } = await supabase.from('recipe_ingredients').insert(rows)
      if (ingErr) throw new Error(ingErr.message)
    }

    const full = await fetchRecipeById(recipe.id)
    if (full) recipes.value.unshift(full)
    return full ?? recipe
  }

  async function deleteRecipe(id: string) {
    const { error: err } = await supabase.from('recipes').delete().eq('id', id)
    if (err) throw new Error(err.message)
    recipes.value = recipes.value.filter((r) => r.id !== id)
  }

  return { recipes, loading, error, fetchRecipes, fetchRecipeById, createRecipe, deleteRecipe }
})
