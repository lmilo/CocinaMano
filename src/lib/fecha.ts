/**
 * La fecha escrita a mano, sin pelear con el teclado.
 *
 * El usuario teclea 25122026 y sale 25/12/2026. Antes tenía que poner las barras él, con
 * el teclado numérico abierto — o sea cambiando de teclado dos veces para escribir dos
 * caracteres que la app puede poner sola.
 *
 * Se aplica en cada pulsación, así que tiene que ser idempotente y no estorbar al borrar:
 * si el resultado ya trae la barra, volver a pasarlo por aquí devuelve lo mismo.
 */

/** Deja solo dígitos y va poniendo las barras donde toca. */
export function enmascararFecha(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/**
 * 'DD/MM/AAAA' → 'AAAA-MM-DD', o null si no es una fecha usable.
 *
 * Rechaza fechas que no existen: `new Date(2026, 1, 31)` se desborda a marzo sin avisar, y
 * un 31 de febrero guardado como 3 de marzo es un error que el usuario no vería.
 */
export function parseFechaEscrita(texto: string): string | null {
  const m = enmascararFecha(texto).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, d, mes, a] = m
  const fecha = new Date(Number(a), Number(mes) - 1, Number(d))
  if (fecha.getDate() !== Number(d) || fecha.getMonth() !== Number(mes) - 1) return null
  return `${a}-${mes}-${d}`
}
