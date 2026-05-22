import type { BaseRecipe, MatchedRecipe, Product } from '@/types'

/**
 * Calculates how many ingredients from a base recipe are available in the user's inventory.
 * Returns matched recipes sorted by match percentage descending.
 */
export function matchRecipes(
  baseRecipes: BaseRecipe[],
  inventory: Product[],
): MatchedRecipe[] {
  const inventoryNames = inventory.map((p) => normalize(p.name))

  return baseRecipes
    .map((recipe) => {
      const matched = recipe.ingredients.filter((ing) =>
        inventoryNames.some((name) => name.includes(normalize(ing.name)) || normalize(ing.name).includes(name)),
      )
      const missing = recipe.ingredients
        .filter(
          (ing) =>
            !inventoryNames.some(
              (name) => name.includes(normalize(ing.name)) || normalize(ing.name).includes(name),
            ),
        )
        .map((ing) => ing.name)

      const matchPercent = Math.round((matched.length / recipe.ingredients.length) * 100)

      return {
        recipe,
        matchCount: matched.length,
        totalIngredients: recipe.ingredients.length,
        matchPercent,
        missingIngredients: missing,
      } satisfies MatchedRecipe
    })
    .sort((a, b) => b.matchPercent - a.matchPercent)
}

/**
 * Scales recipe ingredient quantities to a new serving count.
 */
export function scaleIngredient(
  originalQty: number,
  originalServings: number,
  targetServings: number,
): number {
  if (originalServings === 0) return 0
  return Math.round((originalQty * (targetServings / originalServings)) * 100) / 100
}

/**
 * Calculates the adjusted total cost for a given serving count.
 */
export function adjustedCost(
  totalCost: number,
  originalServings: number,
  targetServings: number,
): number {
  if (originalServings === 0) return 0
  return Math.round((totalCost * (targetServings / originalServings)) * 100) / 100
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
