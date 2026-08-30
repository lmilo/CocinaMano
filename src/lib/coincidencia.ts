import { estadoDeCaducidad } from './caducidad'
import type { Ingrediente, Producto, Receta } from './dominio'
import { comparables, convertir } from './unidades'

/**
 * Cuánto te alcanza de cada receta.
 *
 * DOS COSAS CAMBIAN RESPECTO A LA VERSIÓN WEB:
 *
 * 1. Corre sobre TODAS las recetas —base, propias y generadas por IA— porque ahora hay un
 *    solo tipo. Antes solo evaluaba las del catálogo, así que las que el usuario escribía
 *    o generaba quedaban fuera del match, que es lo único que hace útil tenerlas.
 *
 * 2. MIRA LAS CANTIDADES. Antes solo comprobaba presencia por palabra: tener 5 g de arroz
 *    puntuaba igual que tener 5 kg, y la app decía "te alcanza" cuando no alcanzaba. Ahora
 *    compara cuando las unidades son convertibles y lo admite cuando no lo son.
 */

export type EstadoIngrediente =
  /** Lo tienes, y en cantidad suficiente (o no se puede comparar y se asume que sí). */
  | 'tiene'
  /** Lo tienes, pero no alcanza: 200 g cuando pide 500 g. */
  | 'insuficiente'
  /** No está en la despensa. */
  | 'falta'

export type IngredienteEvaluado = {
  ingrediente: Ingrediente
  estado: EstadoIngrediente
  /** El producto de la despensa que lo cubre, si hay alguno. */
  producto: Producto | null
}

export type RecetaEvaluada = {
  receta: Receta
  ingredientes: IngredienteEvaluado[]
  /** Cuántos ingredientes están cubiertos de verdad. */
  cubiertos: number
  total: number
  /** 0–100, sobre los cubiertos. `insuficiente` NO cuenta: decir que alcanza sería mentir. */
  porcentaje: number
  /** Nombres de lo que hay que comprar, incluido lo que está corto. */
  faltantes: string[]
  /**
   * Productos que se están por perder y esta receta usa.
   *
   * Es el momento estrella del producto y la única razón por la que inventario y recetas
   * viven en la misma app: "el ajiaco usa los tomates que se vencen mañana".
   */
  aprovecha: Producto[]
}

const VACIAS = new Set(['del', 'de', 'con', 'los', 'las', 'una', 'para', 'sin', 'sal_no'])

/** Divide un nombre en palabras significativas. */
function palabras(texto: string): string[] {
  return normalizar(texto)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !VACIAS.has(t))
}

/**
 * Variantes de raíz para tolerar plurales del español sin confundirlos: vocal+s
 * ("tomates"→"tomate") y consonante+es ("frijoles"→"frijol").
 *
 * Se compara por palabra completa y no por subcadena, que es lo que evitaba el falso
 * positivo de "sal" dentro de "salchicha".
 */
function raices(palabra: string): string[] {
  const out = [palabra]
  if (palabra.length > 3 && palabra.endsWith('s')) out.push(palabra.slice(0, -1))
  if (palabra.length > 4 && palabra.endsWith('es')) out.push(palabra.slice(0, -2))
  return out
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Índice de raíz → productos que la contienen. */
export function construirIndice(productos: Producto[]): Map<string, Producto[]> {
  const indice = new Map<string, Producto[]>()
  for (const p of productos) {
    for (const palabra of palabras(p.nombre)) {
      for (const raiz of raices(palabra)) {
        const lista = indice.get(raiz)
        if (lista) {
          if (!lista.includes(p)) lista.push(p)
        } else {
          indice.set(raiz, [p])
        }
      }
    }
  }
  return indice
}

/**
 * El producto de la despensa que cubre este ingrediente, o `null`.
 *
 * Cuando varios coinciden se queda con el de mayor cantidad convertida: si hay dos bolsas
 * de arroz abiertas, la que sirve es la que alcanza.
 */
export function buscarProducto(
  ingrediente: Ingrediente,
  indice: Map<string, Producto[]>,
): Producto | null {
  const candidatos: Producto[] = []
  for (const palabra of palabras(ingrediente.nombre)) {
    for (const raiz of raices(palabra)) {
      for (const p of indice.get(raiz) ?? []) {
        if (!candidatos.includes(p)) candidatos.push(p)
      }
    }
  }
  if (candidatos.length === 0) return null

  return candidatos.reduce((mejor, p) => {
    const a = convertir(p.cantidad, p.unidad, ingrediente.unidad) ?? -1
    const b = convertir(mejor.cantidad, mejor.unidad, ingrediente.unidad) ?? -1
    return a > b ? p : mejor
  })
}

function evaluarIngrediente(
  ingrediente: Ingrediente,
  indice: Map<string, Producto[]>,
): IngredienteEvaluado {
  const producto = buscarProducto(ingrediente, indice)
  if (!producto) return { ingrediente, estado: 'falta', producto: null }

  // Sin unidades comparables no se puede saber si alcanza, y suponer que no alcanza sería
  // peor: la mayoría de las especias entran así ("sal", "1 cucharadita de sal") y marcarlas
  // todas como insuficientes llenaría de rojo una despensa que está bien.
  if (!comparables(producto.unidad, ingrediente.unidad)) {
    return { ingrediente, estado: 'tiene', producto }
  }

  const disponible = convertir(producto.cantidad, producto.unidad, ingrediente.unidad)
  if (disponible === null) return { ingrediente, estado: 'tiene', producto }

  return {
    ingrediente,
    estado: disponible >= ingrediente.cantidad ? 'tiene' : 'insuficiente',
    producto,
  }
}

export function evaluarReceta(
  receta: Receta,
  indice: Map<string, Producto[]>,
  ahora: Date,
): RecetaEvaluada {
  const ingredientes = receta.ingredientes.map((i) => evaluarIngrediente(i, indice))

  const cubiertos = ingredientes.filter((i) => i.estado === 'tiene').length
  const total = ingredientes.length || 1

  const aprovecha: Producto[] = []
  for (const i of ingredientes) {
    if (!i.producto || aprovecha.includes(i.producto)) continue
    const estado = estadoDeCaducidad(i.producto.caducaISO, ahora)
    // Lo vencido no se aprovecha: ya se perdió y proponer cocinarlo sería un consejo malo.
    if (estado === 'pronto' || estado === 'estaSemana') aprovecha.push(i.producto)
  }

  return {
    receta,
    ingredientes,
    cubiertos,
    total: ingredientes.length,
    porcentaje: Math.round((cubiertos / total) * 100),
    faltantes: ingredientes
      .filter((i) => i.estado !== 'tiene')
      .map((i) => i.ingrediente.nombre),
    aprovecha,
  }
}

/**
 * Todas las recetas evaluadas y ordenadas.
 *
 * El orden es por CUÁNTO FALTA, no por porcentaje: "te faltan 2" es la pregunta que el
 * usuario se hace, y con recetas de 6 y de 14 ingredientes el porcentaje ordena mal —un 80%
 * de 14 deja tres cosas por comprar y un 75% de 4 deja una sola.
 *
 * A igualdad de faltantes, sube la que aprovecha algo que se está por perder.
 */
export function evaluarRecetas(
  recetas: Receta[],
  productos: Producto[],
  ahora: Date = new Date(),
): RecetaEvaluada[] {
  const indice = construirIndice(productos)

  return recetas
    .map((r) => evaluarReceta(r, indice, ahora))
    .sort((a, b) => {
      const faltanA = a.total - a.cubiertos
      const faltanB = b.total - b.cubiertos
      if (faltanA !== faltanB) return faltanA - faltanB
      if (a.aprovecha.length !== b.aprovecha.length) return b.aprovecha.length - a.aprovecha.length
      return b.porcentaje - a.porcentaje
    })
}

/** Escala las cantidades de una receta a otro número de porciones. */
export function escalar(cantidad: number, porcionesOriginales: number, porciones: number): number {
  if (porcionesOriginales <= 0) return 0
  return Math.round(cantidad * (porciones / porcionesOriginales) * 100) / 100
}

/** Coste estimado del plato con los precios que el usuario tiene registrados. */
export function costeEstimado(evaluada: RecetaEvaluada, porciones?: number): number {
  const factor =
    porciones && evaluada.receta.porciones > 0 ? porciones / evaluada.receta.porciones : 1

  let total = 0
  for (const i of evaluada.ingredientes) {
    if (!i.producto) continue
    const enUnidadDelProducto = convertir(
      i.ingrediente.cantidad * factor,
      i.ingrediente.unidad,
      i.producto.unidad,
    )
    if (enUnidadDelProducto === null) continue
    total += enUnidadDelProducto * i.producto.precioUnitario
  }
  return Math.round(total)
}
