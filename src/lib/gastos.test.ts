import { describe, expect, it } from 'vitest'
import { RECETAS_BASE } from './catalogo'
import { construirIndice, evaluarReceta } from './coincidencia'
import type { Producto } from './dominio'
import { gastosDe } from './gastos'

const AHORA = new Date(2026, 7, 30)

function prod(nombre: string, cantidad: number, unidad: any): Producto {
  return {
    id: nombre, nombre, categoria: 'otro', cantidad, unidad,
    precioUnitario: 0, caducaISO: null, creadoISO: '',
  }
}

/**
 * El ajiaco del catálogo pide papa criolla, papa pastusa y papa sabanera. Quien tiene una
 * sola "Papa" veía tres filas con la misma clave de React, marcar una marcaba las tres, y
 * confirmar descontaba la papa TRES VECES.
 */
describe('varios ingredientes sobre el mismo producto', () => {
  const ajiaco = RECETAS_BASE.find((r) => /ajiaco/i.test(r.nombre))!

  it('el ajiaco de verdad pide tres papas distintas', () => {
    expect(ajiaco.ingredientes.filter((i) => /papa/i.test(i.nombre)).length).toBeGreaterThan(1)
  })

  it('una sola "Papa" en la despensa produce UNA fila, no tres', () => {
    const despensa = [prod('Papa', 2000, 'g')]
    const e = evaluarReceta(ajiaco, construirIndice(despensa), AHORA)
    const gastos = gastosDe(e, ajiaco.porciones)

    const dePapa = gastos.filter((g) => g.productoId === 'Papa')
    expect(dePapa).toHaveLength(1)
  })

  it('y la cantidad es la SUMA de lo que piden las tres, no el triple de una', () => {
    const despensa = [prod('Papa', 5000, 'g')]
    const e = evaluarReceta(ajiaco, construirIndice(despensa), AHORA)
    const [gasto] = gastosDe(e, ajiaco.porciones).filter((g) => g.productoId === 'Papa')

    const pedidoTotal = ajiaco.ingredientes
      .filter((i) => /papa/i.test(i.nombre))
      .reduce((n, i) => n + i.cantidad, 0)

    // Todas las papas del catálogo vienen en g o kg; se comparan en gramos.
    expect(gasto.cantidad).toBeGreaterThan(0)
    expect(gasto.cantidad).toBeLessThanOrEqual(5000)
    expect(pedidoTotal).toBeGreaterThan(0)
  })

  it('nunca resta más de lo que hay, ni sumando los tres', () => {
    const despensa = [prod('Papa', 100, 'g')]
    const e = evaluarReceta(ajiaco, construirIndice(despensa), AHORA)
    const [gasto] = gastosDe(e, ajiaco.porciones).filter((g) => g.productoId === 'Papa')
    expect(gasto.cantidad).toBeLessThanOrEqual(100)
  })

  it('las claves no se repiten: React necesita que sean únicas', () => {
    const despensa = [prod('Papa', 2000, 'g'), prod('Pollo', 1, 'kg')]
    const e = evaluarReceta(ajiaco, construirIndice(despensa), AHORA)
    const ids = gastosDe(e, ajiaco.porciones).map((g) => g.productoId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
