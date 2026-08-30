export type ProductCategory =
  | 'nevera'
  | 'congelador'
  | 'despensa'
  | 'especias'
  | 'panaderia'
  | 'bebidas'
  | 'otro'

export type Unit =
  | 'kg'
  | 'g'
  | 'L'
  | 'ml'
  | 'unidades'
  | 'tazas'
  | 'cucharadas'
  | 'cucharaditas'

export interface Product {
  id: string
  user_id: string
  name: string
  category: ProductCategory
  quantity: number
  unit: Unit
  unit_price: number
  expiry_date: string | null
  created_at: string
  updated_at: string
}

export interface ProductInsert {
  name: string
  category: ProductCategory
  quantity: number
  unit: Unit
  unit_price: number
  expiry_date: string | null
}

export interface ShoppingItem {
  id: string
  user_id: string
  name: string
  quantity: number | null
  unit: Unit | null
  checked: boolean
  created_at: string
}

export interface ShoppingItemInsert {
  name: string
  quantity?: number | null
  unit?: Unit | null
}

export interface RecipeStep {
  order: number
  description: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  product_id: string | null
  ingredient_name: string
  quantity: number
  unit: Unit
  unit_cost: number
}

export interface RecipeIngredientInsert {
  product_id: string | null
  ingredient_name: string
  quantity: number
  unit: Unit
  unit_cost: number
}

export interface Recipe {
  id: string
  user_id: string
  name: string
  description: string
  servings: number
  total_cost: number
  is_ai_generated: boolean
  cooked: boolean
  rating: number | null
  steps: RecipeStep[]
  cuisine_type: string | null
  created_at: string
  updated_at: string
  recipe_ingredients?: RecipeIngredient[]
}

export interface RecipeInsert {
  name: string
  description: string
  servings: number
  total_cost: number
  is_ai_generated: boolean
  steps: RecipeStep[]
  cuisine_type: string | null
}

export interface MatchedRecipe {
  recipe: BaseRecipe
  matchCount: number
  totalIngredients: number
  matchPercent: number
  missingIngredients: string[]
}

export interface BaseRecipe {
  id: string
  name: string
  description: string
  servings: number
  cuisine_type: string
  ingredients: { name: string; quantity: number; unit: Unit }[]
  steps: RecipeStep[]
}
