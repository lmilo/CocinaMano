import type { BaseRecipe, MatchedRecipe, Product } from '@/types'

const STOPWORDS = new Set(['del', 'con', 'los', 'las', 'una', 'para', 'sin'])

/**
 * Builds a set of significant word tokens from the user's inventory, used to
 * check ingredient availability by whole word (not fragile substring).
 */
export function buildInventoryIndex(inventory: Product[]): Set<string> {
  const set = new Set<string>()
  for (const p of inventory) {
    for (const tok of tokens(p.name)) {
      for (const c of stemCandidates(tok)) set.add(c)
    }
  }
  return set
}

/**
 * True if any significant word of the ingredient matches a word in the inventory.
 * Compara por palabra completa (no substring) y prueba variantes singular/plural,
 * evitando falsos positivos como "sal" ⊂ "salchicha".
 */
export function hasIngredient(ingredientName: string, index: Set<string>): boolean {
  return tokens(ingredientName).some((t) => stemCandidates(t).some((c) => index.has(c)))
}

/**
 * Calculates how many ingredients from a base recipe are available in the user's inventory.
 * Returns matched recipes sorted by match percentage descending.
 */
export function matchRecipes(baseRecipes: BaseRecipe[], inventory: Product[]): MatchedRecipe[] {
  const index = buildInventoryIndex(inventory)

  return baseRecipes
    .map((recipe) => {
      const matched = recipe.ingredients.filter((ing) => hasIngredient(ing.name, index))
      const missing = recipe.ingredients
        .filter((ing) => !hasIngredient(ing.name, index))
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
  return Math.round(originalQty * (targetServings / originalServings) * 100) / 100
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
  return Math.round(totalCost * (targetServings / originalServings) * 100) / 100
}

/** Splits a name into significant word tokens (sin stemming). */
function tokens(str: string): string[] {
  return normalize(str)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

/**
 * Variantes de raíz para tolerar plurales del español sin confundirlos:
 * vocal+s ("tomates"→"tomate") y consonante+es ("frijoles"→"frijol").
 * Devuelve la palabra y sus posibles singulares; el match acierta si
 * cualquiera coincide en ambos lados.
 */
function stemCandidates(word: string): string[] {
  const out = [word]
  if (word.length > 3 && word.endsWith('s')) out.push(word.slice(0, -1))
  if (word.length > 4 && word.endsWith('es')) out.push(word.slice(0, -2))
  return out
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}
