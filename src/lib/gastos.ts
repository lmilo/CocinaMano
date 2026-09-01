import type { RecetaEvaluada } from './coincidencia'
import { escalar } from './coincidencia'
import type { Unidad } from './dominio'
import { convertir, formatearCantidad } from './unidades'

/**
 * Qué descontar de la despensa después de cocinar.
 *
 * Vive fuera del componente para poder probarlo: el agrupado por producto es una regla de
 * dominio con consecuencias reales sobre el inventario, no una cuestión de presentación.
 */

export type Gasto = {
  productoId: string
  nombre: string
  cantidad: number
  /** Cómo se le muestra al usuario, ya en la unidad del producto. */
  texto: string
  incluido: boolean
}

/**
 * Los ingredientes de una receta que se pueden descontar de verdad.
 *
 * SE AGRUPA POR PRODUCTO, y esto no es una optimización: varios ingredientes distintos
 * pueden caer sobre el MISMO producto de la despensa. El ajiaco del catálogo pide papa
 * criolla, papa pastusa y papa sabanera; quien tiene una sola "Papa" veía tres filas con la
 * misma clave de React, marcar una marcaba las tres, y confirmar descontaba la papa tres
 * veces — vaciando dos kilos de una receta que pedía uno.
 *
 * Se suma lo que pide cada ingrediente y se limita UNA SOLA VEZ a lo que hay.
 */
export function gastosDe(evaluada: RecetaEvaluada, porciones: number): Gasto[] {
  const porProducto = new Map<string, { nombre: string; unidad: Unidad; pedido: number; hay: number }>()

  for (const i of evaluada.ingredientes) {
    if (!i.producto) continue

    const pedido = escalar(i.ingrediente.cantidad, evaluada.receta.porciones, porciones)
    const enUnidadDelProducto = convertir(pedido, i.ingrediente.unidad, i.producto.unidad)
    if (enUnidadDelProducto === null || enUnidadDelProducto <= 0) continue

    const previo = porProducto.get(i.producto.id)
    if (previo) {
      previo.pedido += enUnidadDelProducto
    } else {
      porProducto.set(i.producto.id, {
        nombre: i.producto.nombre,
        unidad: i.producto.unidad,
        pedido: enUnidadDelProducto,
        hay: i.producto.cantidad,
      })
    }
  }

  const gastos: Gasto[] = []
  for (const [productoId, d] of porProducto) {
    // Nunca se resta más de lo que hay: si la receta pedía más de lo disponible, se gasta
    // lo que quedaba y punto. El tope se aplica al TOTAL, ya sumado.
    const cantidad = Math.round(Math.min(d.pedido, d.hay) * 1000) / 1000
    if (cantidad <= 0) continue

    gastos.push({
      productoId,
      nombre: d.nombre,
      cantidad,
      texto: formatearCantidad(cantidad, d.unidad),
      incluido: true,
    })
  }

  return gastos
}
