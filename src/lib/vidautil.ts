import type { Categoria } from './dominio'
import { mencionaAlguno } from './texto'

/**
 * Cuánto dura un alimento, y dónde va guardado.
 *
 * POR QUÉ EXISTE ESTO. Cuando alguien carga el mercado —ocho o diez productos de una
 * factura— todo entraba sin fecha de caducidad, y sin fecha el reloj de la comida no
 * existe. O sea que la función que justifica la app entera quedaba muerta salvo que el
 * usuario editara cada producto a mano, uno por uno. Nadie hace eso, y una app que exige
 * eso para servir es una app que no sirve.
 *
 * LA APP PROPONE, NO AFIRMA — y esa distinción no es cosmética, es lo que separa esto de
 * mentirle al usuario. Los términos de uso dicen que la app no sabe cómo guardaste el
 * producto ni si se rompió la cadena de frío, y eso sigue siendo verdad. Estos números son
 * duraciones TÍPICAS de producto fresco bien refrigerado, no fechas de vencimiento: se
 * muestran como sugerencia editable, se anuncian con la palabra "como" ("dura como una
 * semana"), y nunca se guardan sin que el usuario los haya visto.
 *
 * Un producto que la tabla no reconoce NO recibe fecha inventada: se queda sin ella, que es
 * la respuesta honesta.
 */

export type Sugerencia = {
  /** Días de duración típica. `null` = no se vence en un plazo útil. */
  dias: number | null
  categoria: Categoria
}

type Regla = {
  terminos: readonly string[]
  dias: number | null
  categoria: Categoria
}

/**
 * El orden IMPORTA: se toma la primera regla que coincide.
 *
 * Lo específico va antes que lo general, porque muchos nombres contienen a otro. "Leche en
 * polvo" no dura cinco días aunque diga leche, y "pollo congelado" no dura dos aunque diga
 * pollo. Cada par de esos que aparezca se resuelve poniendo el caso raro más arriba.
 */
const REGLAS: readonly Regla[] = [
  // ── Excepciones que tienen que ganarle a su regla general ─────────────
  { terminos: ['congelado', 'congelada', 'congelados', 'congeladas'], dias: 90, categoria: 'congelador' },
  { terminos: ['leche en polvo', 'polvo'], dias: null, categoria: 'despensa' },
  { terminos: ['atun', 'sardina', 'enlatado', 'lata', 'conserva'], dias: null, categoria: 'despensa' },
  { terminos: ['salsa', 'mayonesa', 'mostaza', 'vinagre'], dias: null, categoria: 'despensa' },

  // ── Lo más perecedero ─────────────────────────────────────────────────
  { terminos: ['pescado', 'tilapia', 'trucha', 'salmon', 'camaron', 'mojarra'], dias: 2, categoria: 'nevera' },
  { terminos: ['pollo', 'pechuga', 'muslo', 'pernil', 'alas'], dias: 2, categoria: 'nevera' },
  { terminos: ['carne', 'res', 'cerdo', 'lomo', 'costilla', 'molida', 'chuleta'], dias: 3, categoria: 'nevera' },
  { terminos: ['fresa', 'mora', 'uva', 'aguacate', 'papaya'], dias: 4, categoria: 'nevera' },

  // ── Lácteos y derivados ───────────────────────────────────────────────
  { terminos: ['leche', 'kumis', 'avena'], dias: 5, categoria: 'nevera' },
  { terminos: ['yogur', 'yogurt'], dias: 10, categoria: 'nevera' },
  { terminos: ['queso', 'cuajada', 'requeson'], dias: 7, categoria: 'nevera' },
  { terminos: ['mantequilla', 'margarina', 'crema'], dias: 21, categoria: 'nevera' },
  { terminos: ['huevo'], dias: 21, categoria: 'nevera' },

  // ── Embutidos ─────────────────────────────────────────────────────────
  { terminos: ['jamon', 'salchicha', 'chorizo', 'mortadela', 'salchichon', 'tocineta'], dias: 7, categoria: 'nevera' },

  // ── Verduras de hoja y hierbas ────────────────────────────────────────
  { terminos: ['lechuga', 'espinaca', 'acelga', 'cilantro', 'perejil', 'albahaca', 'repollo'], dias: 5, categoria: 'nevera' },

  // ── Verduras y frutas firmes ──────────────────────────────────────────
  { terminos: ['tomate', 'pepino', 'calabacin', 'champiñon', 'esparrago'], dias: 7, categoria: 'nevera' },
  { terminos: ['brocoli', 'coliflor', 'pimenton', 'apio', 'habichuela', 'arveja'], dias: 8, categoria: 'nevera' },
  { terminos: ['banano', 'platano', 'guayaba', 'maracuya', 'mango'], dias: 6, categoria: 'nevera' },
  { terminos: ['zanahoria', 'remolacha', 'naranja', 'mandarina', 'limon', 'manzana', 'pera'], dias: 14, categoria: 'nevera' },

  // ── Tubérculos y aliños, que van fuera de la nevera ───────────────────
  { terminos: ['papa', 'yuca', 'ñame', 'arracacha', 'ahuyama'], dias: 15, categoria: 'despensa' },
  { terminos: ['cebolla', 'ajo'], dias: 21, categoria: 'despensa' },

  // ── Panadería ─────────────────────────────────────────────────────────
  { terminos: ['pan', 'arepa', 'tortilla', 'pandebono', 'buñuelo', 'croissant'], dias: 4, categoria: 'panaderia' },
  { terminos: ['galleta', 'tostada'], dias: null, categoria: 'panaderia' },

  // ── Especias ──────────────────────────────────────────────────────────
  { terminos: ['sal', 'pimienta', 'comino', 'oregano', 'canela', 'laurel', 'color', 'curry', 'azafran'], dias: null, categoria: 'especias' },

  // ── Bebidas ───────────────────────────────────────────────────────────
  { terminos: ['jugo', 'gaseosa', 'cerveza', 'agua', 'refresco', 'te', 'malta'], dias: null, categoria: 'bebidas' },
  { terminos: ['cafe', 'chocolate', 'aromatica'], dias: null, categoria: 'bebidas' },

  // ── Despensa seca ─────────────────────────────────────────────────────
  { terminos: ['arroz', 'pasta', 'espagueti', 'macarron', 'harina', 'azucar', 'panela', 'aceite', 'lenteja', 'frijol', 'garbanzo', 'maiz', 'avena en hojuelas', 'cereal'], dias: null, categoria: 'despensa' },
]

/**
 * Qué proponer para un producto recién cargado.
 *
 * Si nada coincide devuelve `dias: null` y categoría `despensa`: sin fecha inventada. Es
 * preferible que el usuario ponga la fecha de tres productos raros a que la app se invente
 * la de todos.
 */
export function sugerirParaProducto(nombre: string): Sugerencia {
  for (const regla of REGLAS) {
    if (mencionaAlguno(nombre, regla.terminos)) {
      return { dias: regla.dias, categoria: regla.categoria }
    }
  }
  return { dias: null, categoria: 'despensa' }
}

/**
 * Cómo se le anuncia al usuario. Siempre con "como": es una duración típica, no una fecha
 * de vencimiento, y el copy tiene que dejarlo claro sin obligar a leer los términos.
 */
export function textoDuracion(dias: number | null): string {
  if (dias === null) return 'no se vence pronto'
  if (dias <= 2) return 'dura como dos días'
  if (dias <= 5) return `dura como ${dias} días`
  if (dias <= 8) return 'dura como una semana'
  if (dias <= 16) return 'dura como dos semanas'
  if (dias <= 24) return 'dura como tres semanas'
  return 'dura meses'
}

/**
 * Los plazos que se le ofrecen al usuario.
 *
 * Vivían dentro del formulario de producto, pero ahora los usan también las pantallas de
 * factura y de dictado. Son plazos redondos a propósito: nadie sabe la fecha exacta en que
 * se vence una lechuga, y obligar a elegirla en un calendario para algo que se sabe "como
 * en una semana" es fricción pura.
 */
export const PLAZOS: readonly (number | null)[] = [null, 2, 3, 5, 7, 15, 30]

export function etiquetaPlazo(dias: number | null): string {
  if (dias === null) return 'No se vence'
  if (dias === 2) return '2 días'
  if (dias === 7) return '1 semana'
  if (dias === 15) return '15 días'
  if (dias === 30) return '1 mes'
  return `${dias} días`
}

/** El plazo ofrecido más cercano a una duración sugerida. */
export function plazoMasCercano(dias: number | null): number | null {
  if (dias === null) return null
  let mejor: number | null = null
  let distancia = Infinity
  for (const p of PLAZOS) {
    if (p === null) continue
    const d = Math.abs(p - dias)
    if (d < distancia) {
      distancia = d
      mejor = p
    }
  }
  return mejor
}

/** La fecha local que resulta de sumar un plazo a hoy. `null` si no se vence. */
export function fechaDesdePlazo(dias: number | null, ahora: Date = new Date()): string | null {
  if (dias === null) return null
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  d.setDate(d.getDate() + dias)
  const a = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${a}-${m}-${dd}`
}
