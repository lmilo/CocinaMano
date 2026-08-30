import type { Unidad } from './dominio'
import { normalizarUnidad } from './unidades'

/**
 * Convierte lo que el usuario dictó en productos.
 *
 * SE PARSEA EN LOCAL, SIN IA. El reconocimiento de voz de Android ya devuelve texto, y de
 * ahí a "dos libras de arroz" → {2, lb, arroz} no hay nada que un modelo haga mejor que una
 * tabla. Mandarlo a la red costaría una llamada, una espera y que la función deje de
 * servir sin señal — justo cuando alguien está guardando el mercado con las manos ocupadas.
 *
 * Lo que no se entienda no se descarta: se devuelve con lo que se pudo sacar y el usuario
 * lo corrige en el formulario. La app puede equivocarse oyendo, no guardando.
 */

export type ProductoDictado = {
  nombre: string
  cantidad: number
  unidad: Unidad
  /** No se reconoció una cantidad explícita; se asumió 1. */
  asumido: boolean
}

const NUMEROS: Record<string, number> = {
  un: 1, uno: 1, una: 1,
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50,
  cien: 100, ciento: 100, doscientos: 200, quinientos: 500, mil: 1000,
  medio: 0.5, media: 0.5,
}

/** Palabras que traen su propia cantidad. */
const CANTIDADES_ESPECIALES: Record<string, { cantidad: number; unidad: Unidad }> = {
  docena: { cantidad: 12, unidad: 'unidades' },
  docenas: { cantidad: 12, unidad: 'unidades' },
  par: { cantidad: 2, unidad: 'unidades' },
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // La puntuación se va, PERO no la que está dentro de un número: "1,5 kilos" llegaba
    // partido en "1" y "5 kilos", y la cantidad se perdía en silencio.
    .replace(/[.,;](?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Separa un dictado en varias entradas.
 *
 * LA "Y" ES AMBIGUA y no hay forma de resolverla siempre: "dos libras de arroz y un litro
 * de leche" son dos cosas, pero "arroz y frijoles" y "sal y pimienta" son una sola.
 *
 * La regla que mejor las distingue: se separa cuando lo que viene ACUMULADO ya trae una
 * cantidad explícita, o cuando lo que sigue arranca con una. Quien dice "una docena de
 * huevos y leche" ya cerró una entrada; quien dice "arroz y frijoles" no abrió ninguna.
 *
 * Cuando falla, falla hacia juntar de más: el usuario ve un producto raro y lo corrige en
 * la revisión, que es más fácil que descubrir dos productos fantasma en la despensa.
 */
export function separarDictado(texto: string): string[] {
  const limpio = normalizar(texto)
  const partes: string[] = []
  let actual: string[] = []

  const palabras = limpio.split(' ')
  for (let i = 0; i < palabras.length; i++) {
    const p = palabras[i]
    const siguiente = palabras[i + 1]

    const esUnion = p === 'y' || p === 'mas'
    const acumuladoTieneCantidad = actual.length > 0 && arrancaEntrada(actual[0])
    const siguienteAbreEntrada = !!siguiente && arrancaEntrada(siguiente)

    if (esUnion && siguiente && (acumuladoTieneCantidad || siguienteAbreEntrada)) {
      partes.push(actual.join(' '))
      actual = []
      continue
    }
    actual.push(p)
  }
  if (actual.length > 0) partes.push(actual.join(' '))

  return partes.filter((p) => p.trim().length > 0)
}

function arrancaEntrada(palabra: string): boolean {
  return /^\d/.test(palabra) || palabra in NUMEROS || palabra in CANTIDADES_ESPECIALES
}

/** Parsea UNA entrada ya separada. */
export function parsearDictado(texto: string): ProductoDictado | null {
  const palabras = normalizar(texto).split(' ').filter(Boolean)
  if (palabras.length === 0) return null

  let i = 0
  let cantidad: number | null = null
  let unidad: Unidad | null = null

  // 1. La cantidad, si viene al principio: dígitos ("500", "1,5") o palabra ("dos", "media")
  const primera = palabras[0]
  const comoNumero = Number(primera.replace(',', '.'))
  if (Number.isFinite(comoNumero) && comoNumero > 0) {
    cantidad = comoNumero
    i = 1
  } else if (primera in NUMEROS) {
    cantidad = NUMEROS[primera]
    i = 1
  } else if (primera in CANTIDADES_ESPECIALES) {
    cantidad = CANTIDADES_ESPECIALES[primera].cantidad
    unidad = CANTIDADES_ESPECIALES[primera].unidad
    i = 1
  }

  // "media docena de huevos": la especial puede venir después del número.
  if (cantidad !== null && !unidad && palabras[i] in CANTIDADES_ESPECIALES) {
    const especial = CANTIDADES_ESPECIALES[palabras[i]]
    cantidad = cantidad * especial.cantidad
    unidad = especial.unidad
    i++
  }

  // 2. La unidad, si la palabra siguiente es una
  if (!unidad && i < palabras.length) {
    const candidata = palabras[i]
    // `normalizarUnidad` cae a 'unidades' para lo desconocido, así que no sirve para
    // DETECTAR: hay que comprobar que la palabra sea de verdad una unidad.
    if (esUnidad(candidata)) {
      unidad = normalizarUnidad(candidata)
      i++
    }
  }

  // 3. El "de" que une cantidad y producto
  if (palabras[i] === 'de' || palabras[i] === 'del') i++

  const nombre = palabras.slice(i).join(' ').trim()
  if (!nombre) return null

  return {
    nombre,
    cantidad: cantidad ?? 1,
    unidad: unidad ?? 'unidades',
    asumido: cantidad === null,
  }
}

/**
 * Las palabras que cuentan como unidad al dictar.
 *
 * Es una lista propia y no la de alias de `unidades.ts` porque aquí sobran las que también
 * son alimentos: "hoja" y "rama" normalizan a 'unidades', pero "dos hojas de laurel" y
 * "una rama de apio" tienen que conservar el nombre completo del producto.
 */
const PALABRAS_UNIDAD = new Set([
  'kilo', 'kilos', 'kilogramo', 'kilogramos', 'kg',
  'gramo', 'gramos', 'gr', 'g',
  'libra', 'libras', 'lb',
  'litro', 'litros', 'l', 'lt',
  'mililitro', 'mililitros', 'ml',
  'taza', 'tazas',
  'cucharada', 'cucharadas', 'cda', 'cdas',
  'cucharadita', 'cucharaditas', 'cdta',
  'unidad', 'unidades', 'paquete', 'paquetes', 'bolsa', 'bolsas',
  'lata', 'latas', 'sobre', 'sobres',
])

function esUnidad(palabra: string): boolean {
  return PALABRAS_UNIDAD.has(palabra)
}

/** Todo junto: de lo que se dictó a la lista de productos candidatos. */
export function interpretarDictado(texto: string): ProductoDictado[] {
  return separarDictado(texto)
    .map(parsearDictado)
    .filter((p): p is ProductoDictado => p !== null)
}
