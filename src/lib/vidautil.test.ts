import { describe, expect, it } from 'vitest'
import { fechaDesdePlazo, plazoMasCercano, sugerirParaProducto, textoDuracion } from './vidautil'

describe('sugerirParaProducto', () => {
  it('lo más perecedero sale con pocos días y a la nevera', () => {
    expect(sugerirParaProducto('Pechuga de pollo')).toEqual({ dias: 2, categoria: 'nevera' })
    expect(sugerirParaProducto('Carne molida')).toEqual({ dias: 3, categoria: 'nevera' })
    expect(sugerirParaProducto('Tilapia')).toEqual({ dias: 2, categoria: 'nevera' })
  })

  it('la despensa seca no se vence', () => {
    for (const n of ['Arroz Diana', 'Aceite de girasol', 'Lenteja', 'Harina de trigo']) {
      expect(sugerirParaProducto(n).dias, n).toBeNull()
      expect(sugerirParaProducto(n).categoria, n).toBe('despensa')
    }
  })

  it('las excepciones le ganan a su regla general', () => {
    // "Pollo congelado" no dura dos días aunque diga pollo.
    expect(sugerirParaProducto('Pollo congelado')).toEqual({ dias: 90, categoria: 'congelador' })
    // "Leche en polvo" no dura cinco días aunque diga leche.
    expect(sugerirParaProducto('Leche en polvo')).toEqual({ dias: null, categoria: 'despensa' })
    // El atún de lata no es pescado fresco.
    expect(sugerirParaProducto('Atún en lata')).toEqual({ dias: null, categoria: 'despensa' })
  })

  it('los tubérculos y aliños NO van a la nevera', () => {
    expect(sugerirParaProducto('Papa pastusa').categoria).toBe('despensa')
    expect(sugerirParaProducto('Cebolla cabezona').categoria).toBe('despensa')
    expect(sugerirParaProducto('Ajo').categoria).toBe('despensa')
  })

  it('reconoce lo que sale de una factura, con marca y todo', () => {
    expect(sugerirParaProducto('Leche deslactosada')).toEqual({ dias: 5, categoria: 'nevera' })
    expect(sugerirParaProducto('Pan tajado')).toEqual({ dias: 4, categoria: 'panaderia' })
    expect(sugerirParaProducto('Tomate chonto')).toEqual({ dias: 7, categoria: 'nevera' })
    expect(sugerirParaProducto('Azúcar morena').dias).toBeNull()
  })

  it('ignora tildes, mayúsculas y plurales', () => {
    expect(sugerirParaProducto('HUEVOS')).toEqual({ dias: 21, categoria: 'nevera' })
    expect(sugerirParaProducto('platanos').categoria).toBe('nevera')
    expect(sugerirParaProducto('Frijoles').dias).toBeNull()
  })

  it('NO inventa fecha para lo que no reconoce', () => {
    // Es la respuesta honesta: mejor que el usuario le ponga fecha a tres productos raros
    // a que la app se invente la de todos.
    expect(sugerirParaProducto('Ñoquis artesanales')).toEqual({ dias: null, categoria: 'despensa' })
    expect(sugerirParaProducto('xyz123')).toEqual({ dias: null, categoria: 'despensa' })
    expect(sugerirParaProducto('')).toEqual({ dias: null, categoria: 'despensa' })
  })

  it('NO engancha por subcadena', () => {
    // "sal" está dentro de "salchicha", y son cosas muy distintas: una no se vence y la
    // otra dura una semana en la nevera.
    expect(sugerirParaProducto('Salchicha')).toEqual({ dias: 7, categoria: 'nevera' })
    expect(sugerirParaProducto('Sal marina')).toEqual({ dias: null, categoria: 'especias' })
  })
})

describe('textoDuracion', () => {
  it('siempre dice "como": es duración típica, no fecha de vencimiento', () => {
    for (const d of [2, 4, 7, 14, 21]) {
      expect(textoDuracion(d)).toContain('como')
    }
  })

  it('lo que no se vence lo dice sin número', () => {
    expect(textoDuracion(null)).toBe('no se vence pronto')
  })

  it('redondea a plazos que una persona usa', () => {
    expect(textoDuracion(7)).toBe('dura como una semana')
    expect(textoDuracion(14)).toBe('dura como dos semanas')
    expect(textoDuracion(90)).toBe('dura meses')
  })
})

describe('plazos', () => {
  it('el plazo más cercano cae en uno de los ofrecidos', () => {
    expect(plazoMasCercano(2)).toBe(2)
    expect(plazoMasCercano(4)).toBe(3) // entre 3 y 5, empata y gana el primero
    expect(plazoMasCercano(8)).toBe(7)
    expect(plazoMasCercano(21)).toBe(15)
    expect(plazoMasCercano(90)).toBe(30)
  })

  it('lo que no se vence no recibe plazo', () => {
    expect(plazoMasCercano(null)).toBeNull()
    expect(fechaDesdePlazo(null)).toBeNull()
  })

  it('la fecha se calcula en local y sin horas', () => {
    const ahora = new Date(2026, 7, 30, 23, 40)
    expect(fechaDesdePlazo(7, ahora)).toBe('2026-09-06')
    expect(fechaDesdePlazo(2, ahora)).toBe('2026-09-01')
  })
})

/**
 * El caso que motivó todo esto: los ocho productos que devolvió el Worker con un recibo
 * de supermercado real. Antes entraban todos sin fecha y a "despensa", así que el reloj
 * de la comida no marcaba nada y había que editarlos uno por uno.
 */
describe('un mercado completo, tal como sale de la factura', () => {
  const DEL_RECIBO = [
    'Leche deslactosada',
    'Pechuga de pollo',
    'Arroz',
    'Azúcar morena',
    'Tomate chonto',
    'Cebolla cabezona',
    'Aceite de girasol',
    'Pan tajado',
  ]

  /** Los que de verdad no se vencen. Todo lo demás tiene que salir reconocido. */
  const SECOS = ['Arroz', 'Azúcar morena', 'Aceite de girasol']

  it('reconoce los ocho: ninguno cae en el saco de "no sé qué es esto"', () => {
    const sinReconocer = DEL_RECIBO.filter((n) => {
      if (SECOS.includes(n)) return false
      const s = sugerirParaProducto(n)
      return s.dias === null && s.categoria === 'despensa'
    })
    expect(sinReconocer).toEqual([])
  })

  it('lo perecedero recibe fecha y lo seco no', () => {
    const conFecha = DEL_RECIBO.filter((n) => sugerirParaProducto(n).dias !== null)
    expect(conFecha.sort()).toEqual(
      ['Cebolla cabezona', 'Leche deslactosada', 'Pan tajado', 'Pechuga de pollo', 'Tomate chonto'].sort(),
    )
  })

  it('los reparte por donde de verdad se guardan', () => {
    const porCategoria: Record<string, string[]> = {}
    for (const n of DEL_RECIBO) {
      const cat = sugerirParaProducto(n).categoria
      ;(porCategoria[cat] ??= []).push(n)
    }
    expect(porCategoria.nevera?.sort()).toEqual(
      ['Leche deslactosada', 'Pechuga de pollo', 'Tomate chonto'].sort(),
    )
    expect(porCategoria.panaderia).toEqual(['Pan tajado'])
    // La cebolla NO va a la nevera, aunque sea fresca.
    expect(porCategoria.despensa).toContain('Cebolla cabezona')
  })

  it('el pollo es lo primero que hay que gastar', () => {
    const dias = DEL_RECIBO.map((n) => ({ n, d: sugerirParaProducto(n).dias })).filter(
      (x): x is { n: string; d: number } => x.d !== null,
    )
    dias.sort((a, b) => a.d - b.d)
    expect(dias[0].n).toBe('Pechuga de pollo')
  })
})
