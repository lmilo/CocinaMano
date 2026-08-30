import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'
import { useColorScheme } from 'react-native'
import {
  dark,
  light,
  Paleta,
  Tipografia,
  Toque,
  toque,
  toqueCocina,
  type,
  typeCocina,
} from '../constants/tokens'

/**
 * Apariencia: la preferencia de tema.
 *
 * El tema oscuro no es una preferencia estética. La app se usa de noche frente a la nevera
 * abierta, que suele ser la única luz del cuarto — ver `_branding/BRAND.md` §9.
 *
 * NO usa contexto de React a propósito. `useTema` se llama desde RootLayout y desde
 * ErrorBoundary, ambos POR ENCIMA de cualquier provider, así que un contexto obligaría a
 * envolver el árbol desde afuera del propio layout. Un store de módulo funciona en los dos
 * sitios y encima sobrevive a que la pantalla de fallo sea lo único que quede en pie.
 *
 * CUIDADO con cómo se lee ese store — esta trampa ya costó una sesión de depuración en
 * Recargo, así que queda escrita aquí también. Con el React Compiler activo, leer las
 * variables de módulo POR FUERA del snapshot (devolviendo un contador de versión desde
 * `useSyncExternalStore` y luego un objeto armado a mano) hace que el compilador memorice
 * el objeto devuelto: el componente re-renderiza pero recibe el valor viejo, y un Switch
 * nativo vuelve solo a su posición anterior porque su prop `value` nunca cambia.
 *
 * El estado tiene que SER el snapshot y salir por el `return` del hook. Ese es el contrato.
 */

export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro'

const CLAVE = 'cocina:tema'

/** El snapshot. Se REEMPLAZA en cada cambio y nunca se muta: su identidad es lo que
 *  `useSyncExternalStore` compara para decidir si hay que re-renderizar. */
let ajustes: { readonly tema: PreferenciaTema } = { tema: 'sistema' }

const suscriptores = new Set<() => void>()

function suscribir(fn: () => void) {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}

function leer() {
  return ajustes
}

function emitir(siguiente: { readonly tema: PreferenciaTema }) {
  ajustes = siguiente
  suscriptores.forEach((fn) => fn())
}

/** Se llama una vez desde RootLayout. Si AsyncStorage falla, se queda en 'sistema'. */
export async function cargarTema() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE)
    if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'sistema') {
      emitir({ tema: guardado })
    }
  } catch {
    // Sin preferencia guardada se sigue el sistema, que es el valor por defecto.
  }
}

export async function cambiarTema(tema: PreferenciaTema) {
  emitir({ tema })
  try {
    await AsyncStorage.setItem(CLAVE, tema)
  } catch {
    // El cambio ya se aplicó en memoria; que no persista es preferible a no responder.
  }
}

export type Tema = {
  /** Colores */
  c: Paleta
  /** Tipografía */
  t: Tipografia
  /** Áreas táctiles */
  tq: Toque
  esOscuro: boolean
  preferencia: PreferenciaTema
}

/**
 * @param cocina Escala del modo cocina: texto más grande y área táctil de 64dp. Solo la usa
 * la pantalla de preparación, donde el teléfono se lee de pie y a un metro. NO es el "modo
 * fácil" de Recargo y no debe extenderse al resto de la app — ver `_branding/TOKENS.md` §6.
 */
export function useTema(cocina = false): Tema {
  const { tema } = useSyncExternalStore(suscribir, leer, leer)
  const delSistema = useColorScheme()

  const esOscuro = tema === 'sistema' ? delSistema === 'dark' : tema === 'oscuro'

  return {
    c: esOscuro ? dark : light,
    t: cocina ? typeCocina : type,
    tq: cocina ? toqueCocina : toque,
    esOscuro,
    preferencia: tema,
  }
}
