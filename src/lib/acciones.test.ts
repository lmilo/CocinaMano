import { describe, expect, it } from 'vitest'
import {
  agregarCompra,
  agregarProducto,
  agregarProductos,
  alternarComprado,
  borrarProducto,
  borrarReceta,
  descontarProducto,
  descontarVarios,
  editarProducto,
  ESTADO_INICIAL,
  Estado,
  marcarPreparada,
  pasarADespensa,
  quitarComprados,
  recordarCodigo,
} from './acciones'
import type { ItemCompra, Producto, Receta, Unidad } from './dominio'

function prod(
  nombre: string,
  cantidad = 1,
  unidad: Unidad = 'unidades',
  extra: Partial<Producto> = {},
): Producto {
  return {
    id: `${nombre}-${cantidad}${unidad}`,
    nombre,
    categoria: 'otro',
    cantidad,
    unidad,
    precioUnitario: 0,
    caducaISO: null,
    creadoISO: '2026-08-30T10:00',
    ...extra,
  }
}

function item(nombre: string): ItemCompra {
  return { id: nombre, nombre, cantidad: null, unidad: null, comprado: false, creadoISO: '' }
}

describe('agregar productos', () => {
  it('funde lo que es más de lo mismo, sumando en la unidad del que ya estaba', () => {
    let e: Estado = ESTADO_INICIAL
    e = agregarProducto(e, prod('Arroz', 500, 'g'))
    e = agregarProducto(e, prod('Arroz', 1, 'kg'))
    expect(e.productos).toHaveLength(1)
    expect(e.productos[0].cantidad).toBe(1500)
    expect(e.productos[0].unidad).toBe('g')
  })

  it('funde ignorando mayúsculas y tildes', () => {
    let e: Estado = ESTADO_INICIAL
    e = agregarProducto(e, prod('Plátano', 2))
    e = agregarProducto(e, prod('platano', 3))
    expect(e.productos).toHaveLength(1)
    expect(e.productos[0].cantidad).toBe(5)
  })

  it('NO funde cuando alguno tiene fecha: son lotes con relojes distintos', () => {
    let e: Estado = ESTADO_INICIAL
    e = agregarProducto(e, prod('Leche', 1, 'L', { caducaISO: '2026-08-31' }))
    e = agregarProducto(e, prod('Leche', 1, 'L', { caducaISO: '2026-09-20' }))
    expect(e.productos).toHaveLength(2)
  })

  it('NO funde lo que no es comparable', () => {
    let e: Estado = ESTADO_INICIAL
    e = agregarProducto(e, prod('Leche', 1, 'L'))
    e = agregarProducto(e, prod('Leche', 2, 'unidades'))
    expect(e.productos).toHaveLength(2)
  })

  it('el precio se queda con el de la compra más reciente', () => {
    let e: Estado = ESTADO_INICIAL
    e = agregarProducto(e, prod('Arroz', 1, 'kg', { precioUnitario: 4000 }))
    e = agregarProducto(e, prod('Arroz', 1, 'kg', { precioUnitario: 5200 }))
    expect(e.productos[0].precioUnitario).toBe(5200)
  })

  it('el alta en lote funde una por una', () => {
    const e = agregarProductos(ESTADO_INICIAL, [
      prod('Arroz', 1, 'kg'),
      prod('Sal', 1),
      prod('Arroz', 1, 'kg'),
    ])
    expect(e.productos).toHaveLength(2)
    expect(e.productos.find((p) => p.nombre === 'Arroz')?.cantidad).toBe(2)
  })
})

describe('editar y borrar', () => {
  it('edita solo el que toca', () => {
    let e = agregarProductos(ESTADO_INICIAL, [prod('Arroz'), prod('Sal')])
    const id = e.productos[0].id
    e = editarProducto(e, id, { cantidad: 9 })
    expect(e.productos[0].cantidad).toBe(9)
    expect(e.productos[1].cantidad).toBe(1)
  })

  it('borrar una receta se lleva su registro de preparación', () => {
    const receta: Receta = {
      id: 'r1', origen: 'propia', nombre: 'Mía', descripcion: '',
      porciones: 2, cocina: null, ingredientes: [], pasos: [],
    }
    let e: Estado = { ...ESTADO_INICIAL, recetas: [receta] }
    e = marcarPreparada(e, 'r1', { cuandoISO: '2026-08-30', estrellas: 5 })
    e = borrarReceta(e, 'r1')
    expect(e.recetas).toHaveLength(0)
    expect(e.preparadas['r1']).toBeUndefined()
  })

  it('borrar un producto no toca a los demás', () => {
    let e = agregarProductos(ESTADO_INICIAL, [prod('Arroz'), prod('Sal')])
    e = borrarProducto(e, e.productos[0].id)
    expect(e.productos.map((p) => p.nombre)).toEqual(['Sal'])
  })
})

describe('lista de compras', () => {
  it('no repite lo que ya está pendiente', () => {
    let e = agregarCompra(ESTADO_INICIAL, item('Tomate'))
    e = agregarCompra(e, item('tomate'))
    expect(e.compras).toHaveLength(1)
  })

  it('sí vuelve a admitirlo si lo pendiente ya se compró', () => {
    let e = agregarCompra(ESTADO_INICIAL, item('Tomate'))
    e = alternarComprado(e, 'Tomate')
    e = agregarCompra(e, { ...item('Tomate'), id: 'otro' })
    expect(e.compras).toHaveLength(2)
  })

  it('quitarComprados deja solo lo pendiente', () => {
    let e = agregarCompra(ESTADO_INICIAL, item('Tomate'))
    e = agregarCompra(e, item('Ajo'))
    e = alternarComprado(e, 'Tomate')
    e = quitarComprados(e)
    expect(e.compras.map((c) => c.nombre)).toEqual(['Ajo'])
  })

  it('pasar a la despensa agrega el producto y saca el ítem de la lista', () => {
    let e = agregarCompra(ESTADO_INICIAL, item('Arroz'))
    e = pasarADespensa(e, 'Arroz', prod('Arroz', 2, 'lb'))
    expect(e.compras).toHaveLength(0)
    expect(e.productos[0].nombre).toBe('Arroz')
  })
})

describe('códigos de barras conocidos', () => {
  it('recuerda el nombre que el usuario le dio a un EAN', () => {
    const e = recordarCodigo(ESTADO_INICIAL, '7702001010101', 'Panela Doña Panela')
    expect(e.codigosConocidos['7702001010101']).toBe('Panela Doña Panela')
  })
})

describe('inmutabilidad', () => {
  it('ninguna acción muta el estado que recibe', () => {
    const antes = ESTADO_INICIAL
    const copia = JSON.parse(JSON.stringify(antes))
    agregarProducto(antes, prod('Arroz'))
    agregarCompra(antes, item('Sal'))
    recordarCodigo(antes, '123', 'X')
    expect(antes).toEqual(copia)
  })
})

describe('gastar lo que se cocina', () => {
  it('resta en la unidad del producto', () => {
    let e = agregarProducto(ESTADO_INICIAL, prod('Arroz', 1000, 'g'))
    e = descontarProducto(e, e.productos[0].id, 250)
    expect(e.productos[0].cantidad).toBe(750)
  })

  it('NO borra al llegar a cero: queda en cero', () => {
    // Quitarlo perdería la única señal de que hace falta comprarlo.
    let e = agregarProducto(ESTADO_INICIAL, prod('Leche', 1, 'L'))
    e = descontarProducto(e, e.productos[0].id, 1)
    expect(e.productos).toHaveLength(1)
    expect(e.productos[0].cantidad).toBe(0)
  })

  it('no baja de cero aunque se gaste de más', () => {
    let e = agregarProducto(ESTADO_INICIAL, prod('Leche', 1, 'L'))
    e = descontarProducto(e, e.productos[0].id, 5)
    expect(e.productos[0].cantidad).toBe(0)
  })

  it('descuenta varios de una vez, como al terminar una receta', () => {
    let e = agregarProductos(ESTADO_INICIAL, [prod('Arroz', 1000, 'g'), prod('Sal', 500, 'g')])
    const [arroz, sal] = e.productos
    e = descontarVarios(e, [
      { id: arroz.id, cantidad: 300 },
      { id: sal.id, cantidad: 10 },
    ])
    expect(e.productos.map((p) => p.cantidad)).toEqual([700, 490])
  })

  it('no toca a los demás', () => {
    let e = agregarProductos(ESTADO_INICIAL, [prod('Arroz', 1000, 'g'), prod('Sal', 500, 'g')])
    e = descontarProducto(e, e.productos[0].id, 100)
    expect(e.productos[1].cantidad).toBe(500)
  })

  it('redondea sin arrastrar decimales de coma flotante', () => {
    let e = agregarProducto(ESTADO_INICIAL, prod('Aceite', 1, 'L'))
    e = descontarProducto(e, e.productos[0].id, 0.3)
    expect(e.productos[0].cantidad).toBe(0.7)
  })
})
