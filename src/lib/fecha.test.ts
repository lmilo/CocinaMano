import { describe, expect, it } from 'vitest'
import { enmascararFecha, parseFechaEscrita } from './fecha'

describe('enmascararFecha', () => {
  it('pone las barras sola mientras se teclea', () => {
    expect(enmascararFecha('2')).toBe('2')
    expect(enmascararFecha('25')).toBe('25')
    expect(enmascararFecha('251')).toBe('25/1')
    expect(enmascararFecha('2512')).toBe('25/12')
    expect(enmascararFecha('251220')).toBe('25/12/20')
    expect(enmascararFecha('25122026')).toBe('25/12/2026')
  })

  it('es idempotente: se aplica en cada pulsación', () => {
    expect(enmascararFecha('25/12/2026')).toBe('25/12/2026')
    expect(enmascararFecha(enmascararFecha('25122026'))).toBe('25/12/2026')
  })

  it('no estorba al borrar', () => {
    // El usuario borra el último dígito de "25/12/2026"
    expect(enmascararFecha('25/12/202')).toBe('25/12/202')
    // Y sigue borrando hasta pasar una barra
    expect(enmascararFecha('25/12/')).toBe('25/12')
    expect(enmascararFecha('25/1')).toBe('25/1')
  })

  it('ignora lo que no sea dígito y no deja pasar de 8', () => {
    expect(enmascararFecha('25-12-2026')).toBe('25/12/2026')
    expect(enmascararFecha('2512202699')).toBe('25/12/2026')
    expect(enmascararFecha('abc')).toBe('')
  })
})

describe('parseFechaEscrita', () => {
  it('convierte a ISO', () => {
    expect(parseFechaEscrita('25/12/2026')).toBe('2026-12-25')
    expect(parseFechaEscrita('01/01/2027')).toBe('2027-01-01')
  })

  it('acepta lo tecleado sin barras', () => {
    expect(parseFechaEscrita('25122026')).toBe('2026-12-25')
  })

  it('rechaza fechas que no existen', () => {
    // El 31 de febrero se desborda a marzo en silencio si no se comprueba.
    expect(parseFechaEscrita('31/02/2026')).toBeNull()
    expect(parseFechaEscrita('32/01/2026')).toBeNull()
    expect(parseFechaEscrita('01/13/2026')).toBeNull()
  })

  it('rechaza lo incompleto', () => {
    expect(parseFechaEscrita('25/12')).toBeNull()
    expect(parseFechaEscrita('')).toBeNull()
  })
})
