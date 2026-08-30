/**
 * El dominio de la app, en un solo sitio.
 *
 * UNIFICA LO QUE LA VERSIÓN WEB TENÍA PARTIDO. Allá convivían `BaseRecipe` (las recetas del
 * JSON) y `Recipe` (las de Postgres) como tipos distintos, y `matchRecipes()` solo aceptaba
 * el primero. La consecuencia real: **el match no corría sobre las recetas que el propio
 * usuario había creado o generado con IA**, que son justamente las que más le importan.
 *
 * Aquí hay un solo tipo `Receta` con un campo `origen`. El match corre sobre todas.
 */

export type Categoria =
  | 'nevera'
  | 'congelador'
  | 'despensa'
  | 'especias'
  | 'panaderia'
  | 'bebidas'
  | 'otro'

export const CATEGORIAS: readonly Categoria[] = [
  'nevera',
  'congelador',
  'despensa',
  'especias',
  'panaderia',
  'bebidas',
  'otro',
] as const

/**
 * `lb` es la libra y entra porque en Colombia el mercado se compra por libras: "dos libras
 * de arroz" es la frase literal que el usuario va a dictar. Ver `unidades.ts` para el valor
 * que se le asigna, que es una decisión de dominio y no de física.
 */
export type Unidad =
  | 'kg'
  | 'g'
  | 'lb'
  | 'L'
  | 'ml'
  | 'unidades'
  | 'tazas'
  | 'cucharadas'
  | 'cucharaditas'

export type Producto = {
  id: string
  nombre: string
  categoria: Categoria
  cantidad: number
  unidad: Unidad
  /**
   * Pesos por unidad. Admite decimales y NO se guarda en centavos, a diferencia de Recargo:
   * allá la cifra sustenta una reclamación laboral y un peso de diferencia importa. Aquí es
   * una estimación —"este plato te cuesta como $12.000"— y fingir precisión de contador
   * sobre un precio que el usuario tecleó a ojo sería precisión falsa.
   */
  precioUnitario: number
  /** 'YYYY-MM-DD' en fecha local, sin hora. `null` = no caduca o no se sabe. */
  caducaISO: string | null
  creadoISO: string
  /** EAN leído del empaque, cuando el producto entró por el escáner. */
  codigoBarras?: string
}

export type Ingrediente = {
  nombre: string
  cantidad: number
  unidad: Unidad
}

export type Paso = {
  orden: number
  texto: string
}

/** `base` = catálogo que trae la app · `propia` = la escribió el usuario · `ia` = generada. */
export type OrigenReceta = 'base' | 'propia' | 'ia'

export type Receta = {
  id: string
  origen: OrigenReceta
  nombre: string
  descripcion: string
  porciones: number
  cocina: string | null
  ingredientes: Ingrediente[]
  pasos: Paso[]
}

export type ItemCompra = {
  id: string
  nombre: string
  cantidad: number | null
  unidad: Unidad | null
  comprado: boolean
  creadoISO: string
}

/** Lo que el usuario dejó registrado después de cocinar algo. */
export type Preparacion = {
  cuandoISO: string
  /** 1 a 5. */
  estrellas: number
}

export type Ajustes = {
  /** Cuántos días antes de la fecha empieza a avisar. Por defecto 3. */
  diasAviso: number
  avisarCaducidad: boolean
  /** Entrar directo al modo cocina al abrir una receta. */
  modoCocinaAlPreparar: boolean
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  diasAviso: 3,
  avisarCaducidad: true,
  modoCocinaAlPreparar: true,
}
