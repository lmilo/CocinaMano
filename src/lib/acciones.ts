import type { Ajustes, ItemCompra, Preparacion, Producto, Receta } from './dominio'
import { AJUSTES_POR_DEFECTO } from './dominio'
import { comparables, convertir } from './unidades'

/**
 * El estado de la app y las transformaciones que lo cambian.
 *
 * Son funciones PURAS a propósito, separadas del provider de React: así el contrato del
 * estado se verifica con Vitest sin montar nada, y las reglas de dominio que viven aquí
 * —cuándo dos productos son el mismo, qué pasa al comprar algo que ya tienes— quedan
 * probadas en vez de escondidas dentro de un `setState`.
 *
 * Los ids llegan como argumento, no se generan aquí. Eso mantiene las funciones
 * deterministas.
 */

export type Estado = {
  configurado: boolean
  productos: Producto[]
  /** Solo las propias y las generadas. El catálogo base vive en `catalogo.ts`. */
  recetas: Receta[]
  compras: ItemCompra[]
  preparadas: Record<string, Preparacion>
  /**
   * EAN → nombre que el usuario le dio.
   *
   * Es lo que hace útil el escáner en Colombia: Open Food Facts no conoce buena parte de
   * las marcas locales, así que la primera vez el usuario escribe el nombre y de ahí en
   * adelante la app ya lo sabe.
   */
  codigosConocidos: Record<string, string>
  ajustes: Ajustes
  legal: { version: string; cuandoISO: string } | null
}

export const ESTADO_INICIAL: Estado = {
  configurado: false,
  productos: [],
  recetas: [],
  compras: [],
  preparadas: {},
  codigosConocidos: {},
  ajustes: AJUSTES_POR_DEFECTO,
  legal: null,
}

function clave(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * ¿Este producto nuevo es "más de lo mismo" o es un lote aparte?
 *
 * SOLO SE FUNDE LO QUE NO TIENE FECHA. Si tienes leche que se vence mañana y compras leche
 * nueva, sumarlas borraría justo lo que la app existe para no dejar perder: el reloj del
 * lote viejo. Arroz, sal y aceite no tienen fecha y sí se funden, que es donde fundir es
 * cómodo y no cuesta nada.
 */
function sePuedeFundir(a: Producto, b: Producto): boolean {
  if (clave(a.nombre) !== clave(b.nombre)) return false
  if (a.caducaISO !== null || b.caducaISO !== null) return false
  return comparables(a.unidad, b.unidad)
}

export function agregarProducto(estado: Estado, nuevo: Producto): Estado {
  const i = estado.productos.findIndex((p) => sePuedeFundir(p, nuevo))
  if (i === -1) return { ...estado, productos: [...estado.productos, nuevo] }

  const previo = estado.productos[i]
  const sumado = convertir(nuevo.cantidad, nuevo.unidad, previo.unidad) ?? 0
  const productos = [...estado.productos]
  productos[i] = {
    ...previo,
    cantidad: Math.round((previo.cantidad + sumado) * 1000) / 1000,
    // El precio se queda con el de la compra más reciente: es el que refleja lo que cuesta
    // hoy reponerlo, que es la cifra útil para estimar un plato.
    precioUnitario: nuevo.precioUnitario || previo.precioUnitario,
  }
  return { ...estado, productos }
}

/** Alta en lote, como la que llega de una factura. Funde uno por uno. */
export function agregarProductos(estado: Estado, nuevos: Producto[]): Estado {
  return nuevos.reduce(agregarProducto, estado)
}

export function editarProducto(
  estado: Estado,
  id: string,
  cambios: Partial<Omit<Producto, 'id'>>,
): Estado {
  return {
    ...estado,
    productos: estado.productos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
  }
}

export function borrarProducto(estado: Estado, id: string): Estado {
  return { ...estado, productos: estado.productos.filter((p) => p.id !== id) }
}

/**
 * Gastar parte de un producto.
 *
 * NO LO BORRA AL LLEGAR A CERO, y esa es la decisión que importa. Quitarlo solo sería
 * cómodo y perdería la única señal de que ese producto hace falta: alguien lo tenía, se le
 * acabó, y probablemente lo quiere comprar. Dejarlo en cero permite que la despensa lo
 * muestre como "se acabó" y ofrezca mandarlo a la lista de un toque — que es lo que cierra
 * el ciclo compras → despensa → cocina → compras.
 *
 * La cantidad llega en la unidad del propio producto; convertir es tarea de quien llama.
 */
export function descontarProducto(estado: Estado, id: string, cantidad: number): Estado {
  return {
    ...estado,
    productos: estado.productos.map((p) =>
      p.id === id
        ? { ...p, cantidad: Math.max(0, Math.round((p.cantidad - cantidad) * 1000) / 1000) }
        : p,
    ),
  }
}

/** Varios descuentos de una vez, como los de una receta recién preparada. */
export function descontarVarios(
  estado: Estado,
  gastos: { id: string; cantidad: number }[],
): Estado {
  return gastos.reduce((e, g) => descontarProducto(e, g.id, g.cantidad), estado)
}

export function agregarReceta(estado: Estado, receta: Receta): Estado {
  return { ...estado, recetas: [...estado.recetas, receta] }
}

export function editarReceta(estado: Estado, id: string, cambios: Partial<Omit<Receta, 'id'>>): Estado {
  return {
    ...estado,
    recetas: estado.recetas.map((r) => (r.id === id ? { ...r, ...cambios } : r)),
  }
}

export function borrarReceta(estado: Estado, id: string): Estado {
  const { [id]: _, ...preparadas } = estado.preparadas
  return { ...estado, recetas: estado.recetas.filter((r) => r.id !== id), preparadas }
}

export function agregarCompra(estado: Estado, item: ItemCompra): Estado {
  // No se repite lo que ya está pendiente: la lista de mercado con "tomate" tres veces es
  // la forma más rápida de que el usuario deje de confiar en ella.
  const yaEsta = estado.compras.some((c) => !c.comprado && clave(c.nombre) === clave(item.nombre))
  if (yaEsta) return estado
  return { ...estado, compras: [...estado.compras, item] }
}

export function alternarComprado(estado: Estado, id: string): Estado {
  return {
    ...estado,
    compras: estado.compras.map((c) => (c.id === id ? { ...c, comprado: !c.comprado } : c)),
  }
}

export function borrarCompra(estado: Estado, id: string): Estado {
  return { ...estado, compras: estado.compras.filter((c) => c.id !== id) }
}

export function quitarComprados(estado: Estado): Estado {
  return { ...estado, compras: estado.compras.filter((c) => !c.comprado) }
}

export function marcarPreparada(
  estado: Estado,
  recetaId: string,
  preparacion: Preparacion,
): Estado {
  return { ...estado, preparadas: { ...estado.preparadas, [recetaId]: preparacion } }
}

export function recordarCodigo(estado: Estado, ean: string, nombre: string): Estado {
  return { ...estado, codigosConocidos: { ...estado.codigosConocidos, [ean]: nombre } }
}

export function guardarAjustes(estado: Estado, cambios: Partial<Ajustes>): Estado {
  return { ...estado, ajustes: { ...estado.ajustes, ...cambios } }
}

export function aceptarLegal(estado: Estado, version: string, cuandoISO: string): Estado {
  return { ...estado, legal: { version, cuandoISO }, configurado: true }
}

/**
 * Al marcar algo como comprado, pasarlo a la despensa. Cierra el ciclo del producto:
 * compras → despensa → recetas → lista.
 *
 * Sin este paso el inventario se desactualiza en una semana y el match empieza a mentir,
 * que es la única forma real de que esta app deje de servir.
 */
export function pasarADespensa(estado: Estado, compraId: string, producto: Producto): Estado {
  const conProducto = agregarProducto(estado, producto)
  return borrarCompra(conProducto, compraId)
}
