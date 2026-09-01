import type { Unidad } from './dominio'

export const UNIDADES: readonly Unidad[] = [
  'g',
  'kg',
  'lb',
  'ml',
  'L',
  'unidades',
  'tazas',
  'cucharadas',
  'cucharaditas',
] as const

/**
 * LA LIBRA SON 500 g, NO 453,592.
 *
 * Es una decisión de dominio, no un error de conversión. La libra avoirdupois de 453,592 g
 * es la del sistema imperial; la que se usa en la plaza de mercado en Colombia es medio
 * kilo, y cuando alguien pide "una libra de arroz" le entregan 500 g. Usar el valor
 * imperial metería un 10% de error en cada compra por el gusto de ser técnicamente correcto
 * en un sistema de medidas que aquí nadie usa.
 */
const EN_GRAMOS: Partial<Record<Unidad, number>> = {
  g: 1,
  kg: 1000,
  lb: 500,
}

/**
 * La taza son 250 ml y no los 240 de la taza estadounidense: es la medida de las recetas en
 * español, y hace que cuatro tazas den un litro exacto, que es como la gente mide de verdad.
 */
const EN_MILILITROS: Partial<Record<Unidad, number>> = {
  ml: 1,
  L: 1000,
  tazas: 250,
  cucharadas: 15,
  cucharaditas: 5,
}

export type Magnitud = 'masa' | 'volumen' | 'conteo'

export function magnitud(u: Unidad): Magnitud {
  if (u in EN_GRAMOS) return 'masa'
  if (u in EN_MILILITROS) return 'volumen'
  return 'conteo'
}

/**
 * Convierte entre unidades de la MISMA magnitud. Devuelve `null` cuando no son comparables.
 *
 * Masa y volumen NO se convierten entre sí a propósito: hacen falta densidades por
 * ingrediente (una taza de harina y una taza de miel no pesan lo mismo ni de lejos), y una
 * tabla de densidades inventada daría cifras que parecen exactas y no lo son. Es mejor que
 * la app admita que no puede comparar y caiga a comprobar presencia — ver `coincidencia.ts`.
 */
export function convertir(cantidad: number, desde: Unidad, hacia: Unidad): number | null {
  if (desde === hacia) return cantidad

  const m = magnitud(desde)
  if (m !== magnitud(hacia)) return null
  if (m === 'conteo') return null

  const tabla = m === 'masa' ? EN_GRAMOS : EN_MILILITROS
  const factorDesde = tabla[desde]
  const factorHacia = tabla[hacia]
  if (factorDesde === undefined || factorHacia === undefined) return null

  return (cantidad * factorDesde) / factorHacia
}

/** True si las dos unidades se pueden comparar numéricamente. */
export function comparables(a: Unidad, b: Unidad): boolean {
  if (a === b) return true
  const m = magnitud(a)
  return m === magnitud(b) && m !== 'conteo'
}

const ALIAS: Record<string, Unidad> = {
  // masa
  kilogramo: 'kg', kilogramos: 'kg', kilo: 'kg', kilos: 'kg', kgs: 'kg',
  gramo: 'g', gramos: 'g', gr: 'g', grs: 'g', grms: 'g',
  libra: 'lb', libras: 'lb', lbs: 'lb', lb: 'lb',
  // volumen
  l: 'L', lt: 'L', lts: 'L', litro: 'L', litros: 'L',
  mililitro: 'ml', mililitros: 'ml', cc: 'ml',
  taza: 'tazas',
  cucharada: 'cucharadas', cda: 'cucharadas', cdas: 'cucharadas', cucharadas: 'cucharadas',
  cucharadita: 'cucharaditas', cdta: 'cucharaditas', cdtas: 'cucharaditas', cditas: 'cucharaditas',
  // conteo — todo lo que en la práctica se cuenta de a uno
  unidad: 'unidades', und: 'unidades', unds: 'unidades', u: 'unidades', un: 'unidades',
  pieza: 'unidades', piezas: 'unidades', pza: 'unidades',
  diente: 'unidades', dientes: 'unidades',
  manojo: 'unidades', manojos: 'unidades',
  rama: 'unidades', ramas: 'unidades',
  hoja: 'unidades', hojas: 'unidades',
  pizca: 'unidades', pizcas: 'unidades',
  'al gusto': 'unidades',
  paquete: 'unidades', paquetes: 'unidades',
  bolsa: 'unidades', bolsas: 'unidades',
  lata: 'unidades', latas: 'unidades',
  sobre: 'unidades', sobres: 'unidades',
}

/** Normaliza una unidad arbitraria —de la IA, de una factura o dictada— al enum válido. */
export function normalizarUnidad(bruta: string | null | undefined): Unidad {
  if (!bruta) return 'unidades'
  const n = bruta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.$/, '')
    .trim()

  if ((UNIDADES as readonly string[]).includes(n)) return n as Unidad
  // 'L' pierde la mayúscula al pasar a minúsculas, así que se resuelve por alias.
  return ALIAS[n] ?? 'unidades'
}

/** Cómo se escribe una unidad al lado de una cantidad. */
export function abreviar(unidad: Unidad, cantidad: number): string {
  if (unidad === 'unidades') return cantidad === 1 ? 'unidad' : 'unidades'
  if (unidad === 'tazas') return cantidad === 1 ? 'taza' : 'tazas'
  if (unidad === 'cucharadas') return cantidad === 1 ? 'cda' : 'cdas'
  if (unidad === 'cucharaditas') return cantidad === 1 ? 'cdta' : 'cdtas'
  return unidad
}

/** Cantidad legible: sin decimales inútiles y con coma decimal, como se escribe aquí. */
export function formatearCantidad(cantidad: number, unidad: Unidad): string {
  const redondeada = Math.round(cantidad * 100) / 100
  const texto = Number.isInteger(redondeada)
    ? String(redondeada)
    : String(redondeada).replace('.', ',')
  return `${texto} ${abreviar(unidad, redondeada)}`
}
