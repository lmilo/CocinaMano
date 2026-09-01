/**
 * El reloj de la comida.
 *
 * La versión web guardaba `expiry_date` y solo la mostraba. Aquí es la mitad del producto:
 * decide el color de cada tarjeta, el orden de la despensa, qué recetas suben en "Qué
 * cocino" y de qué avisa la app. Ver `_branding/BRAND.md` §4.
 *
 * TODO SE COMPARA POR DÍA CALENDARIO LOCAL, NUNCA POR HORAS. Una libra de tomates que
 * caduca "hoy" caduca hoy, sean las 7 de la mañana o las 11 de la noche.
 */

export type EstadoReloj = 'conTiempo' | 'estaSemana' | 'pronto' | 'vencido'

/**
 * Convierte 'YYYY-MM-DD' a medianoche LOCAL.
 *
 * `new Date('2026-08-30')` interpreta la cadena como UTC, así que en Colombia (UTC-5)
 * devuelve las 7 p.m. del día 29. Ese desfase de un día es el error clásico de esta clase
 * de código y aquí haría que un producto se marcara vencido un día antes de tiempo.
 */
export function parseFechaLocal(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

/** La fecha de un `Date` como 'YYYY-MM-DD' local. */
export function comoISO(fecha: Date): string {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

/** Días calendario que faltan. Negativo = ya pasó. 0 = hoy. */
export function diasHasta(caducaISO: string, ahora: Date): number {
  const objetivo = parseFechaLocal(caducaISO)
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const MS_DIA = 86_400_000
  return Math.round((objetivo.getTime() - hoy.getTime()) / MS_DIA)
}

/**
 * Los umbrales viven aquí y en ningún otro sitio. Están en `_branding/BRAND.md` §4 y en
 * `TOKENS.md` §3, y los nombres coinciden exactamente con los tokens de color: un estado
 * nuevo obliga a tocar los tres, que es justo lo que se quiere.
 */
export function estadoDeCaducidad(caducaISO: string | null, ahora: Date): EstadoReloj {
  // Sin fecha no es un problema: es la mayoría de la despensa. Arroz, sal, aceite.
  if (!caducaISO) return 'conTiempo'

  const dias = diasHasta(caducaISO, ahora)
  if (dias < 0) return 'vencido'
  if (dias <= 2) return 'pronto'
  if (dias <= 7) return 'estaSemana'
  return 'conTiempo'
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Cómo se le dice al usuario. Informa, nunca regaña: "se venció el jueves", no "¡se te
 * dañó!". Ver `_branding/BRAND.md` §8 — el usuario ya sabe que perdió plata, y
 * recordárselo con signos de admiración no cambia su conducta, solo hace que cierre la app.
 */
export function textoCaducidad(caducaISO: string | null, ahora: Date): string {
  if (!caducaISO) return ''

  const dias = diasHasta(caducaISO, ahora)
  const fecha = parseFechaLocal(caducaISO)

  if (dias === 0) return 'se vence hoy'
  if (dias === 1) return 'se vence mañana'
  if (dias === -1) return 'se venció ayer'

  if (dias < 0) {
    const pasados = Math.abs(dias)
    // Dentro de la semana pasada el día tiene nombre y se ubica solo; más allá ya no
    // significa nada ("se venció el jueves" de hace tres semanas confunde más que informa).
    if (pasados <= 6) return `se venció el ${DIAS[fecha.getDay()]}`
    return `se venció el ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
  }

  if (dias <= 6) return `se vence el ${DIAS[fecha.getDay()]}`
  if (dias <= 14) return `se vence en ${dias} días`
  return `se vence el ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
}

/** Orden de urgencia para listar: lo que está por perderse va primero. */
export const PESO_RELOJ: Record<EstadoReloj, number> = {
  vencido: 0,
  pronto: 1,
  estaSemana: 2,
  conTiempo: 3,
}
