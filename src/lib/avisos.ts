import { comoISO, diasHasta, parseFechaLocal } from './caducidad'
import type { Ajustes, Producto } from './dominio'

/**
 * Avisos de caducidad.
 *
 * MISMA TRAMPA QUE EL RECONOCEDOR DE VOZ: `expo-notifications` es un módulo nativo y desde
 * el SDK 53 no funciona dentro de Expo Go en Android. Se carga perezosamente dentro de un
 * try/catch para que la app no se caiga en desarrollo; en el APK sí funciona, y la pantalla
 * de ajustes lo explica en vez de dejar al usuario creyendo que están activos.
 *
 * SE AVISA AGRUPADO POR DÍA, NO POR PRODUCTO. Cinco notificaciones el mismo martes son
 * spam, y a la tercera el usuario apaga los avisos de la app entera — con lo cual deja de
 * enterarse también de lo que sí le importaba.
 */

/** Las 6 de la tarde: la hora en que alguien se pregunta qué va a hacer de comer. */
const HORA_AVISO = 18

/** Más allá de dos semanas el aviso no sirve: el usuario ya habrá abierto la app. */
const DIAS_MAXIMOS = 14

type Modulo = typeof import('expo-notifications')

/** undefined = no se ha intentado · null = no disponible */
let modulo: Modulo | null | undefined

function cargar(): Modulo | null {
  if (modulo !== undefined) return modulo
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications') as Modulo
  } catch {
    modulo = null
  }
  return modulo
}

export function hayAvisos(): boolean {
  return cargar() !== null
}

export async function pedirPermisoAvisos(): Promise<boolean> {
  const m = cargar()
  if (!m) return false
  try {
    const actual = await m.getPermissionsAsync()
    if (actual.granted) return true
    const pedido = await m.requestPermissionsAsync()
    return pedido.granted
  } catch {
    return false
  }
}

/**
 * Qué se le dice al usuario ese día. Informa, nunca regaña.
 *
 * EL PLAZO SE CALCULA, NO SE ASUME. Antes decía "se vence mañana" fijo, y como el aviso
 * sale `diasAviso` antes (3 por defecto), un producto que vencía el 10 disparaba el día 7
 * un aviso que decía "mañana". La app mentía por tres días en su propia notificación —
 * justo el dato por el que existe el aviso.
 *
 * `cuando` es el día en que se muestra, no el de hoy: se programa con antelación y hay que
 * contar desde allí.
 */
export function textoDelAviso(productos: Producto[], cuando: Date): { titulo: string; cuerpo: string } {
  const cuantosDias = (p: Producto) => (p.caducaISO ? diasHasta(p.caducaISO, cuando) : 0)

  if (productos.length === 1) {
    // Con uno solo se nombra: es mucho más útil que un contador y cabe de sobra.
    return {
      titulo: `${productos[0].nombre} ${enCuanto(cuantosDias(productos[0]))}`,
      cuerpo: 'Mira qué puedes cocinar con eso.',
    }
  }

  // Con varios manda el más urgente: es el que decide si esto hay que mirarlo hoy.
  const antes = Math.min(...productos.map(cuantosDias))
  return {
    titulo: `${productos.length} cosas ${enCuanto(antes, true)}`,
    cuerpo: productos
      .slice(0, 3)
      .map((p) => p.nombre)
      .join(', '),
  }
}

/** "se vence mañana", "se vence en 3 días". En plural cuando son varias cosas. */
function enCuanto(dias: number, plural = false): string {
  const verbo = plural ? 'se vencen' : 'se vence'
  if (dias <= 0) return `${verbo} hoy`
  if (dias === 1) return `${verbo} mañana`
  return `${verbo} en ${dias} días`
}

/**
 * Agrupa lo que hay que avisar por el día en que toca avisarlo.
 *
 * Pura y exportada para poder probarla: la aritmética de "avisar N días antes" es
 * exactamente donde este tipo de código se equivoca por uno.
 */
export function agruparAvisos(
  productos: Producto[],
  ahora: Date,
  diasAviso: number,
): Map<string, Producto[]> {
  const porDia = new Map<string, Producto[]>()

  for (const p of productos) {
    if (!p.caducaISO) continue

    const faltan = diasHasta(p.caducaISO, ahora)
    // Lo ya vencido no se avisa: el daño está hecho y una notificación solo sería un
    // reproche. Y lo que cae hoy tampoco, porque el aviso saldría después de la hora.
    if (faltan <= 0 || faltan > DIAS_MAXIMOS) continue

    // El aviso sale `diasAviso` antes, pero nunca antes de hoy: si algo entra a la despensa
    // venciéndose en dos días y el ajuste es avisar con tres, el aviso es esta misma tarde.
    const cuando = parseFechaLocal(p.caducaISO)
    cuando.setDate(cuando.getDate() - diasAviso)

    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const dia = comoISO(cuando < hoy ? hoy : cuando)

    const lista = porDia.get(dia)
    if (lista) lista.push(p)
    else porDia.set(dia, [p])
  }

  return porDia
}

/**
 * Cancela todo y reprograma desde cero.
 *
 * Reprogramar en bloque, en vez de ir añadiendo y quitando avisos sueltos, es lo que hace
 * que el estado de las notificaciones no pueda desincronizarse de la despensa. Cuesta unos
 * milisegundos y ahorra toda una clase de errores.
 */
export async function reprogramarAvisos(
  productos: Producto[],
  ajustes: Ajustes,
  ahora: Date = new Date(),
): Promise<void> {
  const m = cargar()
  if (!m) return

  try {
    await m.cancelAllScheduledNotificationsAsync()
    if (!ajustes.avisarCaducidad) return

    const permitido = await m.getPermissionsAsync().then((p) => p.granted).catch(() => false)
    if (!permitido) return

    const porDia = agruparAvisos(productos, ahora, ajustes.diasAviso)

    for (const [dia, lista] of porDia) {
      const cuando = parseFechaLocal(dia)
      cuando.setHours(HORA_AVISO, 0, 0, 0)
      // Si la hora ya pasó hoy, ese aviso no se programa: dispararía de inmediato y
      // sonaría como un error de la app.
      if (cuando.getTime() <= ahora.getTime()) continue

      const { titulo, cuerpo } = textoDelAviso(lista, cuando)
      await m.scheduleNotificationAsync({
        content: { title: titulo, body: cuerpo },
        trigger: { type: m.SchedulableTriggerInputTypes.DATE, date: cuando },
      })
    }
  } catch {
    // Un fallo programando avisos no puede tumbar la app ni bloquear un guardado.
  }
}

/** La prueba de 5 segundos de la pantalla de ajustes. */
export async function avisoDePrueba(): Promise<boolean> {
  const m = cargar()
  if (!m) return false
  try {
    if (!(await pedirPermisoAvisos())) return false
    await m.scheduleNotificationAsync({
      content: {
        title: 'Así se ven los avisos',
        body: 'Cuando algo esté por vencerse, te llega uno como este.',
      },
      trigger: { type: m.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
    })
    return true
  } catch {
    return false
  }
}
