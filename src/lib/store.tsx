import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as A from './acciones'
import { Estado, ESTADO_INICIAL } from './acciones'

/**
 * El estado de la app, en una sola clave de AsyncStorage.
 *
 * NO HAY SERVIDOR NI CUENTAS, y esa es la decisión que sostiene todo lo demás. La versión
 * web usaba login anónimo de Supabase, que tenía lo peor de los dos mundos: dependía de un
 * servidor pero no daba recuperación real —borrabas la app y perdías todo igual— y un
 * proyecto gratuito se pausa por inactividad, así que la app instalada podía dejar de abrir
 * a los meses. Sin cuentas ese punto de falla no existe.
 *
 * La contrapartida honesta: sin servidor no hay respaldo automático, así que **la
 * exportación ES el respaldo** y la app tiene que recordárselo al usuario.
 *
 * Las transformaciones viven en `acciones.ts` como funciones puras y están probadas allí.
 * Aquí solo se les añade React y persistencia.
 */

const CLAVE = 'cocina:v1'

export function nuevoId(): string {
  return Crypto.randomUUID()
}

type Contexto = {
  estado: Estado
  cargando: boolean
  /** Aplica una transformación de `acciones.ts` y persiste el resultado. */
  aplicar: (fn: (estado: Estado) => Estado) => void
  borrarTodo: () => Promise<void>
  /** Reemplaza el estado entero. Solo para restaurar un respaldo. */
  restaurar: (estado: Estado) => void
}

const Ctx = createContext<Contexto | null>(null)

export function EstadoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(ESTADO_INICIAL)
  const [cargando, setCargando] = useState(true)
  // No se persiste hasta que terminó la carga: si no, el estado inicial vacío pisaría lo
  // guardado en el primer render y borraría la despensa entera.
  const cargado = useRef(false)

  useEffect(() => {
    ;(async () => {
      try {
        const crudo = await AsyncStorage.getItem(CLAVE)
        if (crudo) {
          const guardado = JSON.parse(crudo) as Partial<Estado>
          // Se mezcla contra el inicial para que una versión vieja sin campos nuevos no
          // llegue a las pantallas con propiedades en `undefined`.
          setEstado({ ...ESTADO_INICIAL, ...guardado })
        }
      } catch {
        // Un estado corrupto no puede dejar la app sin arrancar: se sigue con el inicial.
      } finally {
        cargado.current = true
        setCargando(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!cargado.current) return
    AsyncStorage.setItem(CLAVE, JSON.stringify(estado)).catch(() => {
      // El cambio ya está en memoria. Que no persista es malo, pero perder la sesión en
      // curso por lanzar aquí sería peor.
    })
  }, [estado])

  const aplicar = useCallback((fn: (estado: Estado) => Estado) => {
    setEstado((previo) => fn(previo))
  }, [])

  const borrarTodo = useCallback(async () => {
    setEstado(ESTADO_INICIAL)
    await AsyncStorage.removeItem(CLAVE).catch(() => {})
  }, [])

  const restaurar = useCallback((nuevo: Estado) => {
    setEstado(nuevo)
  }, [])

  return (
    <Ctx.Provider value={{ estado, cargando, aplicar, borrarTodo, restaurar }}>
      {children}
    </Ctx.Provider>
  )
}

export function useEstado() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEstado fuera de EstadoProvider')
  return ctx
}

/** Las acciones, ya ligadas al store. Cada una es la función pura de `acciones.ts`. */
export function useAcciones() {
  const { aplicar } = useEstado()

  return {
    agregarProducto: (p: Parameters<typeof A.agregarProducto>[1]) =>
      aplicar((e) => A.agregarProducto(e, p)),
    agregarProductos: (ps: Parameters<typeof A.agregarProductos>[1]) =>
      aplicar((e) => A.agregarProductos(e, ps)),
    editarProducto: (id: string, cambios: Parameters<typeof A.editarProducto>[2]) =>
      aplicar((e) => A.editarProducto(e, id, cambios)),
    borrarProducto: (id: string) => aplicar((e) => A.borrarProducto(e, id)),

    agregarReceta: (r: Parameters<typeof A.agregarReceta>[1]) =>
      aplicar((e) => A.agregarReceta(e, r)),
    editarReceta: (id: string, cambios: Parameters<typeof A.editarReceta>[2]) =>
      aplicar((e) => A.editarReceta(e, id, cambios)),
    borrarReceta: (id: string) => aplicar((e) => A.borrarReceta(e, id)),

    agregarCompra: (i: Parameters<typeof A.agregarCompra>[1]) =>
      aplicar((e) => A.agregarCompra(e, i)),
    alternarComprado: (id: string) => aplicar((e) => A.alternarComprado(e, id)),
    borrarCompra: (id: string) => aplicar((e) => A.borrarCompra(e, id)),
    quitarComprados: () => aplicar(A.quitarComprados),
    pasarADespensa: (compraId: string, p: Parameters<typeof A.pasarADespensa>[2]) =>
      aplicar((e) => A.pasarADespensa(e, compraId, p)),

    marcarPreparada: (recetaId: string, p: Parameters<typeof A.marcarPreparada>[2]) =>
      aplicar((e) => A.marcarPreparada(e, recetaId, p)),
    recordarCodigo: (ean: string, nombre: string) =>
      aplicar((e) => A.recordarCodigo(e, ean, nombre)),
    guardarAjustes: (cambios: Parameters<typeof A.guardarAjustes>[1]) =>
      aplicar((e) => A.guardarAjustes(e, cambios)),
    aceptarLegal: (version: string, cuandoISO: string) =>
      aplicar((e) => A.aceptarLegal(e, version, cuandoISO)),
  }
}
