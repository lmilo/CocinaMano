import { describe, expect, it } from 'vitest'
import { comoISO, diasHasta, estadoDeCaducidad, parseFechaLocal, textoCaducidad } from './caducidad'

/** Domingo 30 de agosto de 2026, media mañana. */
const AHORA = new Date(2026, 7, 30, 10, 30)

describe('parseFechaLocal', () => {
  it('interpreta la fecha en local, no en UTC', () => {
    const d = parseFechaLocal('2026-08-30')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7)
    expect(d.getDate()).toBe(30)
  })

  it('ida y vuelta con comoISO', () => {
    expect(comoISO(parseFechaLocal('2026-01-05'))).toBe('2026-01-05')
  })
})

describe('diasHasta', () => {
  it('cuenta días calendario, no horas', () => {
    // Faltan menos de 24 horas reales, pero es mañana: son 1 día.
    expect(diasHasta('2026-08-31', new Date(2026, 7, 30, 23, 59))).toBe(1)
    // Han pasado minutos, pero sigue siendo hoy: son 0 días.
    expect(diasHasta('2026-08-30', new Date(2026, 7, 30, 0, 1))).toBe(0)
  })

  it('es negativo cuando ya pasó', () => {
    expect(diasHasta('2026-08-28', AHORA)).toBe(-2)
  })

  it('cruza el fin de mes y el fin de año', () => {
    expect(diasHasta('2026-09-01', AHORA)).toBe(2)
    expect(diasHasta('2027-01-01', new Date(2026, 11, 31, 12))).toBe(1)
  })
})

describe('estadoDeCaducidad', () => {
  it('sin fecha es "con tiempo": es la mayoría de la despensa', () => {
    expect(estadoDeCaducidad(null, AHORA)).toBe('conTiempo')
  })

  it('aplica los umbrales de la marca', () => {
    expect(estadoDeCaducidad('2026-08-29', AHORA)).toBe('vencido')
    expect(estadoDeCaducidad('2026-08-30', AHORA)).toBe('pronto') // hoy
    expect(estadoDeCaducidad('2026-09-01', AHORA)).toBe('pronto') // 2 días
    expect(estadoDeCaducidad('2026-09-02', AHORA)).toBe('estaSemana') // 3 días
    expect(estadoDeCaducidad('2026-09-06', AHORA)).toBe('estaSemana') // 7 días
    expect(estadoDeCaducidad('2026-09-07', AHORA)).toBe('conTiempo') // 8 días
  })
})

describe('textoCaducidad', () => {
  it('usa palabras para lo inmediato', () => {
    expect(textoCaducidad('2026-08-30', AHORA)).toBe('se vence hoy')
    expect(textoCaducidad('2026-08-31', AHORA)).toBe('se vence mañana')
    expect(textoCaducidad('2026-08-29', AHORA)).toBe('se venció ayer')
  })

  it('usa el nombre del día dentro de la semana', () => {
    expect(textoCaducidad('2026-09-03', AHORA)).toBe('se vence el jueves')
    expect(textoCaducidad('2026-08-27', AHORA)).toBe('se venció el jueves')
  })

  it('pasa a fecha cuando el nombre del día ya no ubica a nadie', () => {
    expect(textoCaducidad('2026-08-10', AHORA)).toBe('se venció el 10 de agosto')
    expect(textoCaducidad('2026-10-15', AHORA)).toBe('se vence el 15 de octubre')
  })

  it('nunca regaña: informa y ya', () => {
    const textos = ['2026-08-20', '2026-08-29', '2026-09-03'].map((f) => textoCaducidad(f, AHORA))
    for (const t of textos) expect(t).not.toContain('!')
  })

  it('sin fecha no dice nada', () => {
    expect(textoCaducidad(null, AHORA)).toBe('')
  })
})
