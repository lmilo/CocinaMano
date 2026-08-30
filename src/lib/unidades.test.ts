import { describe, expect, it } from 'vitest'
import { abreviar, comparables, convertir, formatearCantidad, normalizarUnidad, UNIDADES } from './unidades'

describe('normalizarUnidad', () => {
  it('mantiene intactas las unidades válidas', () => {
    for (const u of UNIDADES) expect(normalizarUnidad(u)).toBe(u)
  })

  it('normaliza alias comunes al enum', () => {
    expect(normalizarUnidad('gramos')).toBe('g')
    expect(normalizarUnidad('Kilogramo')).toBe('kg')
    expect(normalizarUnidad('litros')).toBe('L')
    expect(normalizarUnidad('cda')).toBe('cucharadas')
    expect(normalizarUnidad('cucharadita')).toBe('cucharaditas')
  })

  it('reconoce la libra, que es como se compra el mercado aquí', () => {
    expect(normalizarUnidad('libra')).toBe('lb')
    expect(normalizarUnidad('libras')).toBe('lb')
    expect(normalizarUnidad('LB')).toBe('lb')
  })

  it('mapea unidades de cocina sueltas a "unidades"', () => {
    expect(normalizarUnidad('diente')).toBe('unidades')
    expect(normalizarUnidad('dientes')).toBe('unidades')
    expect(normalizarUnidad('pizca')).toBe('unidades')
    expect(normalizarUnidad('al gusto')).toBe('unidades')
    expect(normalizarUnidad('paquete')).toBe('unidades')
  })

  it('cae a "unidades" para valores desconocidos, vacíos o nulos', () => {
    expect(normalizarUnidad('xyz')).toBe('unidades')
    expect(normalizarUnidad('')).toBe('unidades')
    expect(normalizarUnidad(null)).toBe('unidades')
    expect(normalizarUnidad(undefined)).toBe('unidades')
  })

  it('ignora mayúsculas, espacios, tildes y el punto de la abreviatura', () => {
    expect(normalizarUnidad('  GRAMOS ')).toBe('g')
    expect(normalizarUnidad('gr.')).toBe('g')
    expect(normalizarUnidad('Cucharadita')).toBe('cucharaditas')
  })
})

describe('convertir', () => {
  it('convierte dentro de la masa', () => {
    expect(convertir(1, 'kg', 'g')).toBe(1000)
    expect(convertir(500, 'g', 'kg')).toBe(0.5)
  })

  it('la libra son 500 g, no 453,592 — es la del mercado, no la imperial', () => {
    expect(convertir(1, 'lb', 'g')).toBe(500)
    expect(convertir(2, 'lb', 'kg')).toBe(1)
    expect(convertir(1, 'kg', 'lb')).toBe(2)
  })

  it('convierte dentro del volumen, incluidas las medidas de cocina', () => {
    expect(convertir(1, 'L', 'ml')).toBe(1000)
    expect(convertir(4, 'tazas', 'L')).toBe(1)
    expect(convertir(1, 'cucharadas', 'ml')).toBe(15)
    expect(convertir(3, 'cucharaditas', 'cucharadas')).toBe(1)
  })

  it('NO convierte entre masa y volumen: haría falta la densidad', () => {
    expect(convertir(1, 'tazas', 'g')).toBeNull()
    expect(convertir(100, 'g', 'ml')).toBeNull()
  })

  it('NO convierte conteos', () => {
    expect(convertir(3, 'unidades', 'g')).toBeNull()
    expect(convertir(3, 'unidades', 'unidades')).toBe(3)
  })
})

describe('comparables', () => {
  it('acepta la misma magnitud', () => {
    expect(comparables('g', 'lb')).toBe(true)
    expect(comparables('ml', 'tazas')).toBe(true)
  })

  it('rechaza magnitudes distintas y conteos', () => {
    expect(comparables('g', 'ml')).toBe(false)
    expect(comparables('unidades', 'g')).toBe(false)
  })

  it('una unidad siempre es comparable consigo misma, incluso el conteo', () => {
    expect(comparables('unidades', 'unidades')).toBe(true)
  })
})

describe('presentación', () => {
  it('singulariza cuando la cantidad es 1', () => {
    expect(abreviar('unidades', 1)).toBe('unidad')
    expect(abreviar('unidades', 2)).toBe('unidades')
    expect(abreviar('tazas', 1)).toBe('taza')
  })

  it('usa coma decimal y quita decimales inútiles', () => {
    expect(formatearCantidad(2, 'lb')).toBe('2 lb')
    expect(formatearCantidad(1.5, 'kg')).toBe('1,5 kg')
    expect(formatearCantidad(1.0, 'unidades')).toBe('1 unidad')
  })
})
