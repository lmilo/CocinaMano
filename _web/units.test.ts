import { describe, it, expect } from 'vitest'
import { normalizeUnit, VALID_UNITS } from './units'

describe('normalizeUnit', () => {
  it('mantiene intactas las unidades válidas', () => {
    for (const u of VALID_UNITS) expect(normalizeUnit(u)).toBe(u)
  })

  it('normaliza alias comunes al enum', () => {
    expect(normalizeUnit('gramos')).toBe('g')
    expect(normalizeUnit('Kilogramo')).toBe('kg')
    expect(normalizeUnit('litros')).toBe('L')
    expect(normalizeUnit('cda')).toBe('cucharadas')
    expect(normalizeUnit('cucharadita')).toBe('cucharaditas')
  })

  it('mapea unidades de cocina sueltas a "unidades"', () => {
    expect(normalizeUnit('diente')).toBe('unidades')
    expect(normalizeUnit('dientes')).toBe('unidades')
    expect(normalizeUnit('pizca')).toBe('unidades')
    expect(normalizeUnit('al gusto')).toBe('unidades')
  })

  it('cae a "unidades" para valores desconocidos o vacíos', () => {
    expect(normalizeUnit('xyz')).toBe('unidades')
    expect(normalizeUnit('')).toBe('unidades')
  })

  it('es case-insensitive y recorta espacios', () => {
    expect(normalizeUnit('  GRAMOS ')).toBe('g')
  })
})
