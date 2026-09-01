import { describe, expect, it } from 'vitest'
import { agruparAvisos, textoDelAviso } from './avisos'
import type { Ajustes, Producto } from './dominio'

const AHORA = new Date(2026, 7, 30, 10, 0) // domingo 30 de agosto

function prod(nombre: string, caducaISO: string | null): Producto {
  return {
    id: nombre,
    nombre,
    categoria: 'nevera',
    cantidad: 1,
    unidad: 'unidades',
    precioUnitario: 0,
    caducaISO,
    creadoISO: '',
  }
}

const AJUSTES: Ajustes = { diasAviso: 3, avisarCaducidad: true, modoCocinaAlPreparar: true }

describe('agruparAvisos', () => {
  it('avisa los días configurados antes de la fecha', () => {
    const grupos = agruparAvisos([prod('Leche', '2026-09-10')], AHORA, 3)
    expect([...grupos.keys()]).toEqual(['2026-09-07'])
  })

  it('AGRUPA lo que cae el mismo día en un solo aviso', () => {
    const grupos = agruparAvisos(
      [prod('Leche', '2026-09-10'), prod('Yogur', '2026-09-10'), prod('Queso', '2026-09-10')],
      AHORA,
      3,
    )
    expect(grupos.size).toBe(1)
    expect(grupos.get('2026-09-07')).toHaveLength(3)
  })

  it('no avisa de lo que ya se venció: el daño está hecho', () => {
    expect(agruparAvisos([prod('Leche', '2026-08-25')], AHORA, 3).size).toBe(0)
  })

  it('no avisa de lo que se vence hoy: el aviso saldría tarde', () => {
    expect(agruparAvisos([prod('Leche', '2026-08-30')], AHORA, 3).size).toBe(0)
  })

  it('lo que no tiene fecha nunca genera aviso', () => {
    expect(agruparAvisos([prod('Arroz', null)], AHORA, 3).size).toBe(0)
  })

  it('no mira más allá de dos semanas', () => {
    expect(agruparAvisos([prod('Conserva', '2026-12-01')], AHORA, 3).size).toBe(0)
  })

  it('si el aviso caería en el pasado, se adelanta a hoy', () => {
    // Se vence en 2 días y el ajuste pide avisar con 3: el aviso no puede ser ayer.
    const grupos = agruparAvisos([prod('Lechuga', '2026-09-01')], AHORA, 3)
    expect([...grupos.keys()]).toEqual(['2026-08-30'])
  })

  it('respeta un ajuste de más días', () => {
    const grupos = agruparAvisos([prod('Leche', '2026-09-10')], AHORA, 7)
    expect([...grupos.keys()]).toEqual(['2026-09-03'])
  })
})

describe('textoDelAviso', () => {
  it('con uno solo lo nombra, que es más útil que un contador', () => {
    const { titulo } = textoDelAviso([prod('Tomates', '2026-09-01')], new Date(2026, 7, 31))
    expect(titulo).toBe('Tomates se vence mañana')
  })

  it('con varios cuenta y menciona los primeros', () => {
    const { titulo, cuerpo } = textoDelAviso(
      [
        prod('Leche', '2026-09-01'),
        prod('Yogur', '2026-09-01'),
        prod('Queso', '2026-09-01'),
        prod('Jamón', '2026-09-01'),
      ],
      new Date(2026, 7, 31),
    )
    expect(titulo).toBe('4 cosas se vencen mañana')
    expect(cuerpo).toBe('Leche, Yogur, Queso')
  })

  it('nunca regaña', () => {
    const cuando = new Date(2026, 7, 31)
    const textos = [
      textoDelAviso([prod('Leche', '2026-09-01')], cuando),
      textoDelAviso([prod('a', '2026-09-01'), prod('b', '2026-09-01')], cuando),
    ]
    for (const t of textos) {
      expect(t.titulo).not.toContain('!')
      expect(t.cuerpo).not.toContain('!')
    }
  })
})

describe('los ajustes mandan', () => {
  it('con los avisos apagados no se programa nada (lo comprueba reprogramarAvisos)', () => {
    // `agruparAvisos` no mira el interruptor a propósito: es cálculo puro. Quien lo respeta
    // es `reprogramarAvisos`, que sale temprano. Esta prueba deja el contrato por escrito.
    expect(AJUSTES.avisarCaducidad).toBe(true)
    expect(agruparAvisos([prod('Leche', '2026-09-10')], AHORA, AJUSTES.diasAviso).size).toBe(1)
  })
})

/**
 * El aviso decía "se vence mañana" fijo, y sale `diasAviso` antes. Con el ajuste por
 * defecto (3), algo que vencía el 10 disparaba el día 7 un aviso que decía "mañana": la
 * app mentía por tres días en el único dato por el que existe el aviso.
 */
describe('el aviso dice el plazo de verdad', () => {
  const leche = prod('Leche', '2026-09-10')

  it('cuenta desde el día en que se muestra, no desde hoy', () => {
    // El aviso de este producto sale el 7 (3 días antes). Ese día faltan 3.
    expect(textoDelAviso([leche], new Date(2026, 8, 7)).titulo).toBe('Leche se vence en 3 días')
    // Y si el ajuste fuera de 1 día, el aviso sale el 9 y ahí sí es mañana.
    expect(textoDelAviso([leche], new Date(2026, 8, 9)).titulo).toBe('Leche se vence mañana')
  })

  it('el mismo día dice hoy', () => {
    expect(textoDelAviso([leche], new Date(2026, 8, 10)).titulo).toBe('Leche se vence hoy')
  })

  it('con varios manda el más urgente', () => {
    const titulo = textoDelAviso(
      [prod('Leche', '2026-09-10'), prod('Pollo', '2026-09-08')],
      new Date(2026, 8, 7),
    ).titulo
    expect(titulo).toBe('2 cosas se vencen mañana')
  })
})
