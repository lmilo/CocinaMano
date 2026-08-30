import { describe, expect, it } from 'vitest'
import { buscarProducto, construirIndice, escalar, evaluarRecetas } from './coincidencia'
import type { Ingrediente, Producto, Receta, Unidad } from './dominio'

const AHORA = new Date(2026, 7, 30, 10, 30)

function prod(
  nombre: string,
  cantidad = 1,
  unidad: Unidad = 'unidades',
  extra: Partial<Producto> = {},
): Producto {
  return {
    id: nombre,
    nombre,
    categoria: 'otro',
    cantidad,
    unidad,
    precioUnitario: 0,
    caducaISO: null,
    creadoISO: '',
    ...extra,
  }
}

function ing(nombre: string, cantidad = 1, unidad: Unidad = 'unidades'): Ingrediente {
  return { nombre, cantidad, unidad }
}

function receta(id: string, ingredientes: Ingrediente[], origen: Receta['origen'] = 'base'): Receta {
  return {
    id,
    origen,
    nombre: id,
    descripcion: '',
    porciones: 2,
    cocina: null,
    ingredientes,
    pasos: [],
  }
}

describe('búsqueda por palabra', () => {
  const indice = construirIndice([
    prod('Sal'),
    prod('Ajo'),
    prod('Tomate'),
    prod('Frijol cargamanto'),
    prod('Huevos'),
  ])

  it('reconoce coincidencias exactas, plurales y acentos', () => {
    expect(buscarProducto(ing('sal'), indice)?.nombre).toBe('Sal')
    expect(buscarProducto(ing('tomates'), indice)?.nombre).toBe('Tomate')
    expect(buscarProducto(ing('frijol'), indice)?.nombre).toBe('Frijol cargamanto')
    expect(buscarProducto(ing('huevo'), indice)?.nombre).toBe('Huevos')
  })

  it('NO genera falsos positivos por subcadena', () => {
    expect(buscarProducto(ing('salchicha'), indice)).toBeNull()
    expect(buscarProducto(ing('ajonjolí'), indice)).toBeNull()
  })

  it('entre varios candidatos se queda con el que más alcanza', () => {
    const dos = construirIndice([prod('Arroz viejo', 100, 'g'), prod('Arroz nuevo', 2, 'kg')])
    expect(buscarProducto(ing('arroz', 1, 'kg'), dos)?.nombre).toBe('Arroz nuevo')
  })
})

describe('las cantidades importan — lo que la versión web no miraba', () => {
  it('5 g de arroz no alcanzan para una receta que pide 500 g', () => {
    const [r] = evaluarRecetas([receta('r', [ing('arroz', 500, 'g')])], [prod('Arroz', 5, 'g')], AHORA)
    expect(r.ingredientes[0].estado).toBe('insuficiente')
    expect(r.porcentaje).toBe(0)
    expect(r.faltantes).toContain('arroz')
  })

  it('5 kg de arroz sí alcanzan', () => {
    const [r] = evaluarRecetas([receta('r', [ing('arroz', 500, 'g')])], [prod('Arroz', 5, 'kg')], AHORA)
    expect(r.ingredientes[0].estado).toBe('tiene')
    expect(r.porcentaje).toBe(100)
  })

  it('una libra alcanza para 500 g exactos', () => {
    const [r] = evaluarRecetas([receta('r', [ing('arroz', 500, 'g')])], [prod('Arroz', 1, 'lb')], AHORA)
    expect(r.ingredientes[0].estado).toBe('tiene')
  })

  it('cuando las unidades no son comparables se asume que alcanza', () => {
    // Es el caso de casi toda especia: tienes "sal" suelta y la receta pide una cucharadita.
    const [r] = evaluarRecetas([receta('r', [ing('sal', 1, 'cucharaditas')])], [prod('Sal', 1)], AHORA)
    expect(r.ingredientes[0].estado).toBe('tiene')
  })
})

describe('evaluarRecetas', () => {
  it('corre también sobre las recetas propias y las de IA', () => {
    const recetas = [
      receta('base', [ing('pollo')], 'base'),
      receta('mia', [ing('arroz')], 'propia'),
      receta('generada', [ing('arroz')], 'ia'),
    ]
    const res = evaluarRecetas(recetas, [prod('Arroz')], AHORA)
    expect(res.filter((r) => r.porcentaje === 100).map((r) => r.receta.id).sort()).toEqual([
      'generada',
      'mia',
    ])
  })

  it('ordena por cuánto falta, no por porcentaje', () => {
    // 'larga' tiene mejor porcentaje (75%) pero deja 3 cosas por comprar;
    // 'corta' tiene 66% y deja solo 1. La accionable es 'corta'.
    const larga = receta('larga', [
      ing('arroz'), ing('sal'), ing('ajo'), ing('aceite'),
      ing('pollo'), ing('papa'), ing('cebolla'), ing('cilantro'),
    ])
    const corta = receta('corta', [ing('arroz'), ing('sal'), ing('curry')])
    const despensa = [
      prod('Arroz'), prod('Sal'), prod('Ajo'), prod('Aceite'),
      prod('Papa'), prod('Cebolla'),
    ]
    const res = evaluarRecetas([larga, corta], despensa, AHORA)
    expect(res[0].receta.id).toBe('corta')
  })

  it('señala lo que aprovecha algo por vencerse, y no lo ya vencido', () => {
    const porVencerse = prod('Tomate', 3, 'unidades', { caducaISO: '2026-08-31' })
    const vencido = prod('Leche', 1, 'L', { caducaISO: '2026-08-20' })
    const [r] = evaluarRecetas(
      [receta('r', [ing('tomate'), ing('leche', 1, 'L')])],
      [porVencerse, vencido],
      AHORA,
    )
    expect(r.aprovecha.map((p) => p.nombre)).toEqual(['Tomate'])
  })

  it('a igualdad de faltantes, sube la que aprovecha lo urgente', () => {
    const conUrgente = receta('urgente', [ing('tomate')])
    const normal = receta('normal', [ing('arroz')])
    const res = evaluarRecetas(
      [normal, conUrgente],
      [prod('Arroz'), prod('Tomate', 3, 'unidades', { caducaISO: '2026-08-31' })],
      AHORA,
    )
    expect(res[0].receta.id).toBe('urgente')
  })
})

describe('escalar', () => {
  it('escala proporcionalmente', () => {
    expect(escalar(2, 4, 2)).toBe(1)
    expect(escalar(2, 4, 8)).toBe(4)
  })

  it('evita la división por cero', () => {
    expect(escalar(3, 0, 5)).toBe(0)
  })
})
