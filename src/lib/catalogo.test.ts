import { describe, expect, it } from 'vitest'
import { RECETAS_BASE } from './catalogo'
import { normalizarUnidad, UNIDADES } from './unidades'

/**
 * Auditoría del catálogo.
 *
 * No es ceremonia: una unidad que no normaliza no rompe nada visible, simplemente cae a
 * 'unidades' y el match empieza a comparar peras con litros EN SILENCIO. Este archivo
 * existe para que eso falle ruidosamente al cambiar el catálogo.
 */
describe('catálogo de recetas base', () => {
  it('trae recetas', () => {
    expect(RECETAS_BASE.length).toBeGreaterThan(0)
  })

  it('todas las unidades están en el enum y normalizan a sí mismas', () => {
    const invalidas: string[] = []
    for (const r of RECETAS_BASE) {
      for (const i of r.ingredientes) {
        if (!UNIDADES.includes(i.unidad) || normalizarUnidad(i.unidad) !== i.unidad) {
          invalidas.push(`${r.id} · ${i.nombre} · "${i.unidad}"`)
        }
      }
    }
    expect(invalidas).toEqual([])
  })

  it('los ids son únicos', () => {
    const ids = RECETAS_BASE.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toda receta tiene ingredientes, pasos y porciones utilizables', () => {
    for (const r of RECETAS_BASE) {
      expect(r.ingredientes.length, r.id).toBeGreaterThan(0)
      expect(r.pasos.length, r.id).toBeGreaterThan(0)
      expect(r.porciones, r.id).toBeGreaterThan(0)
      expect(r.origen, r.id).toBe('base')
    }
  })

  it('ninguna cantidad es cero o negativa: rompería el cálculo de coste y de escala', () => {
    for (const r of RECETAS_BASE) {
      for (const i of r.ingredientes) {
        expect(i.cantidad, `${r.id} · ${i.nombre}`).toBeGreaterThan(0)
      }
    }
  })

  it('los pasos van numerados desde 1 y sin saltos', () => {
    for (const r of RECETAS_BASE) {
      const ordenes = r.pasos.map((p) => p.orden).sort((a, b) => a - b)
      expect(ordenes, r.id).toEqual(ordenes.map((_, i) => i + 1))
    }
  })
})
