import { describe, it, expect, vi, afterEach } from 'vitest'
import { AuthError } from '@supabase/supabase-js'
import { normalizeError } from './errors'

afterEach(() => vi.unstubAllGlobals())

describe('normalizeError', () => {
  it('mapea errores de PostgREST a mensajes claros en español', async () => {
    const e = await normalizeError({ code: '23505', message: 'duplicate key', details: 'x', hint: null })
    expect(e.message).toMatch(/ya existe/i)
    expect(e.code).toBe('23505')
  })

  it('mapea 42501 (RLS) a falta de permiso', async () => {
    const e = await normalizeError({ code: '42501', message: 'denied', details: null, hint: null })
    expect(e.message).toMatch(/permiso/i)
  })

  it('mapea un AuthError conocido', async () => {
    const e = await normalizeError(new AuthError('rate', 429, 'over_request_rate_limit'))
    expect(e.message).toMatch(/demasiados/i)
  })

  it('detecta sin conexión antes que cualquier otra cosa', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const e = await normalizeError(new Error('lo que sea'))
    expect(e.code).toBe('offline')
  })

  it('conserva el mensaje de un Error genérico', async () => {
    const e = await normalizeError(new Error('algo salió mal'))
    expect(e.message).toBe('algo salió mal')
    expect(e.code).toBe('Error')
  })

  it('no revienta con valores no-Error', async () => {
    const e = await normalizeError('cadena suelta')
    expect(e.code).toBe('unknown')
    expect(e.message).toBeTruthy()
  })
})
