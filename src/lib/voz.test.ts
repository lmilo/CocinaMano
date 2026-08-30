import { describe, expect, it } from 'vitest'
import { interpretarDictado, parsearDictado, separarDictado } from './voz'

describe('parsearDictado', () => {
  it('la frase de siempre en la plaza de mercado', () => {
    expect(parsearDictado('dos libras de arroz')).toEqual({
      nombre: 'arroz',
      cantidad: 2,
      unidad: 'lb',
      asumido: false,
    })
  })

  it('entiende números escritos con dígitos', () => {
    expect(parsearDictado('500 gramos de queso')).toMatchObject({
      nombre: 'queso',
      cantidad: 500,
      unidad: 'g',
    })
  })

  it('entiende decimales con coma, que es como se dicta aquí', () => {
    expect(parsearDictado('1,5 kilos de papa')).toMatchObject({ cantidad: 1.5, unidad: 'kg' })
  })

  it('entiende "medio" y "media"', () => {
    expect(parsearDictado('medio kilo de carne')).toMatchObject({ cantidad: 0.5, unidad: 'kg' })
    expect(parsearDictado('media libra de mantequilla')).toMatchObject({ cantidad: 0.5, unidad: 'lb' })
  })

  it('entiende la docena', () => {
    expect(parsearDictado('una docena de huevos')).toMatchObject({
      nombre: 'huevos',
      cantidad: 12,
      unidad: 'unidades',
    })
    expect(parsearDictado('media docena de huevos')).toMatchObject({ cantidad: 6 })
  })

  it('sin unidad, cuenta unidades', () => {
    expect(parsearDictado('3 tomates')).toMatchObject({
      nombre: 'tomates',
      cantidad: 3,
      unidad: 'unidades',
    })
  })

  it('sin cantidad, asume 1 y lo marca para que el usuario lo revise', () => {
    expect(parsearDictado('arroz')).toEqual({
      nombre: 'arroz',
      cantidad: 1,
      unidad: 'unidades',
      asumido: true,
    })
  })

  it('NO se come el nombre cuando la palabra también es un alimento', () => {
    // "hoja" y "rama" normalizan a 'unidades' en el enum, pero aquí son parte del producto.
    expect(parsearDictado('dos hojas de laurel')).toMatchObject({ nombre: 'hojas de laurel' })
    expect(parsearDictado('una rama de apio')).toMatchObject({ nombre: 'rama de apio' })
  })

  it('conserva nombres de varias palabras', () => {
    expect(parsearDictado('una libra de pechuga de pollo')).toMatchObject({
      nombre: 'pechuga de pollo',
      cantidad: 1,
      unidad: 'lb',
    })
  })

  it('ignora tildes y mayúsculas del reconocedor', () => {
    expect(parsearDictado('Dos Libras de Plátano')).toMatchObject({
      nombre: 'platano',
      unidad: 'lb',
    })
  })

  it('devuelve null cuando no queda nombre', () => {
    expect(parsearDictado('')).toBeNull()
    expect(parsearDictado('dos libras')).toBeNull()
  })
})

describe('separarDictado', () => {
  it('separa cuando lo que sigue arranca una entrada nueva', () => {
    expect(separarDictado('dos libras de arroz y un litro de leche')).toEqual([
      'dos libras de arroz',
      'un litro de leche',
    ])
  })

  it('NO separa cuando la "y" es parte del producto', () => {
    expect(separarDictado('arroz y frijoles')).toEqual(['arroz y frijoles'])
  })

  it('aguanta varias entradas seguidas', () => {
    expect(separarDictado('3 tomates y 2 cebollas y una libra de arroz')).toHaveLength(3)
  })
})

describe('interpretarDictado', () => {
  it('devuelve todo lo que se pudo sacar del mercado dictado de corrido', () => {
    const res = interpretarDictado('dos libras de arroz y una docena de huevos y leche')
    expect(res).toEqual([
      { nombre: 'arroz', cantidad: 2, unidad: 'lb', asumido: false },
      { nombre: 'huevos', cantidad: 12, unidad: 'unidades', asumido: false },
      { nombre: 'leche', cantidad: 1, unidad: 'unidades', asumido: true },
    ])
  })

  it('con un dictado vacío no devuelve nada, y no revienta', () => {
    expect(interpretarDictado('')).toEqual([])
  })
})
