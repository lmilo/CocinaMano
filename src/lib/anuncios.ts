/**
 * Publicidad (AdMob).
 *
 * MISMA TRAMPA QUE LOS AVISOS Y EL DICTADO: `react-native-google-mobile-ads` es un módulo
 * NATIVO y no existe dentro de Expo Go. Se carga perezosamente dentro de un try/catch y, si
 * no está, la app funciona igual — simplemente sin banner. En el APK sí carga.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LOS IDs DE PRUEBA SON EL VALOR POR DEFECTO, Y ESO ES DELIBERADO.
 *
 * Tocar tus propios anuncios reales es "actividad inválida" y Google cierra cuentas por
 * eso. El riesgo no es teórico: los APK de perfil `preview` son los que se instalan a mano
 * para probar, y en ellos `__DEV__` es `false` — así que atarlo a `__DEV__` serviría
 * anuncios REALES en cada prueba.
 *
 * Por eso la unidad real solo entra cuando existe `EXPO_PUBLIC_ADS_REALES`, que se define
 * ÚNICAMENTE en el perfil `production` de `eas.json`. El resto del mundo —Expo Go, dev
 * client, preview— ve anuncios de prueba. Falla hacia el lado seguro: si alguien olvida la
 * variable, el peor caso es que producción muestre anuncios de prueba y no se gane un peso,
 * que se nota enseguida y se arregla. Al revés se perdería la cuenta.
 * ────────────────────────────────────────────────────────────────────────────
 */

import Constants, { ExecutionEnvironment } from 'expo-constants'

/** Unidad de banner de prueba de Google. Es pública y no identifica ninguna cuenta. */
const UNIDAD_PRUEBA = 'ca-app-pub-3940256099942544/6300978111'

/**
 * PENDIENTE: la unidad real de esta app.
 *
 * Se crea en AdMob (Apps → Añadir app → Android → `com.crincon.cocinamano`), y hay que
 * poner también el `androidAppId` en el plugin de `app.json`. Hasta que exista, esto queda
 * igual al de prueba a propósito: así una build de producción hecha por error no sirve
 * anuncios de una unidad equivocada.
 */
const UNIDAD_REAL = UNIDAD_PRUEBA

/** Solo el perfil `production` de EAS define esta variable. Ver eas.json. */
export const CON_ANUNCIOS_REALES = process.env.EXPO_PUBLIC_ADS_REALES === '1'

export const UNIDAD_BANNER = CON_ANUNCIOS_REALES ? UNIDAD_REAL : UNIDAD_PRUEBA

/** En Expo Go el módulo nativo no existe. */
export const EN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

type Modulo = typeof import('react-native-google-mobile-ads')

/** undefined = no se ha intentado · null = no disponible */
let modulo: Modulo | null | undefined
let inicializado = false

export function cargarAnuncios(): Modulo | null {
  if (modulo !== undefined) return modulo
  if (EN_EXPO_GO) {
    modulo = null
    return null
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('react-native-google-mobile-ads') as Modulo
    if (!inicializado) {
      modulo.default().initialize().catch(() => {})
      inicializado = true
    }
  } catch {
    modulo = null
  }
  return modulo
}
