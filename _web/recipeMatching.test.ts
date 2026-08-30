import { describe, it, expect } from 'vitest'
import {
  matchRecipes,
  buildInventoryIndex,
  hasIngredient,
  scaleIngredient,
  adjustedCost,
} from './recipeMatching'
import type { Product, BaseRecipe } from '@/types'

function prod(name: string): Product {
  return {
    id: name,
    user_id: 'u',
    name,
    category: 'otro',
    quantity: 1,
    unit: 'unidades',
    unit_price: 0,
    expiry_date: null,
    created_at: '',
    updated_at: '',
  }
}

function recipe(id: string, ingredients: string[]): BaseRecipe {
  return {
    id,
    name: id,
    description: '',
    servings: 2,
    cuisine_type: 'x',
    ingredients: ingredients.map((name) => ({ name, quantity: 1, unit: 'unidades' as const })),
    steps: [],
  }
}

describe('hasIngredient — matching por palabra', () => {
  const idx = buildInventoryIndex([
    prod('Sal'),
    prod('Ajo'),
    prod('Tomate'),
    prod('Frijol cargamanto'),
    prod('Huevos'),
  ])

  it('reconoce coincidencias exactas, plurales y acentos', () => {
    expect(hasIngredient('sal', idx)).toBe(true)
    expect(hasIngredient('tomates', idx)).toBe(true) // plural
    expect(hasIngredient('frijol', idx)).toBe(true) // palabra dentro de "Frijol cargamanto"
    expect(hasIngredient('huevo', idx)).toBe(true) // singular
  })

  it('NO genera falsos positivos por substring', () => {
    expect(hasIngredient('salchicha', idx)).toBe(false) // no debe enganchar con "Sal"
    expect(hasIngredient('ajonjolí', idx)).toBe(false) // no debe enganchar con "Ajo"
  })
})

describe('matchRecipes', () => {
  const recetas = [recipe('r1', ['arroz', 'sal']), recipe('r2', ['pollo'])]

  it('ordena por compatibilidad descendente y calcula faltantes', () => {
    const res = matchRecipes(recetas, [prod('Arroz'), prod('Sal')])
    expect(res[0].recipe.id).toBe('r1')
    expect(res[0].matchPercent).toBe(100)
    expect(res[1].matchPercent).toBe(0)
    expect(res[1].missingIngredients).toContain('pollo')
  })
})

describe('escalado de porciones', () => {
  it('scaleIngredient escala proporcionalmente', () => {
    expect(scaleIngredient(2, 4, 2)).toBe(1)
    expect(scaleIngredient(2, 4, 8)).toBe(4)
  })

  it('scaleIngredient evita división por cero', () => {
    expect(scaleIngredient(3, 0, 5)).toBe(0)
  })

  it('adjustedCost escala proporcionalmente', () => {
    expect(adjustedCost(1000, 4, 2)).toBe(500)
  })
})
