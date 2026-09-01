import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { SelectorCaducidad } from '../../components/SelectorCaducidad'
import { Boton, Campo, Pantalla, Selector } from '../../components/ui'
import { NOMBRE_CATEGORIA } from '../../components/ui'
import { space } from '../../constants/tokens'


import { CATEGORIAS, type Categoria, type Unidad } from '../../lib/dominio'
import { nuevoId, useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { abreviar, UNIDADES } from '../../lib/unidades'
import { fechaDesdePlazo, plazoMasCercano, sugerirParaProducto, textoDuracion } from '../../lib/vidautil'

export default function EditarProducto() {
  const { c, t } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const acciones = useAcciones()
  const params = useLocalSearchParams<{
    id?: string
    nombre?: string
    desdeCompra?: string
    codigo?: string
    desconocido?: string
  }>()

  const existente = params.id ? estado.productos.find((p) => p.id === params.id) : undefined

  const [nombre, setNombre] = useState(existente?.nombre ?? params.nombre ?? '')
  const [categoria, setCategoria] = useState<Categoria>(existente?.categoria ?? 'despensa')
  const [cantidad, setCantidad] = useState(String(existente?.cantidad ?? '1'))
  const [unidad, setUnidad] = useState<Unidad>(existente?.unidad ?? 'unidades')
  const [precio, setPrecio] = useState(existente?.precioUnitario ? String(existente.precioUnitario) : '')
  const [caducaISO, setCaducaISO] = useState<string | null>(existente?.caducaISO ?? null)
  /**
   * Mientras el usuario no toque el plazo ni la categoría, la app los propone a partir del
   * nombre. En cuanto los toca, deja de meterse: lo que él eligió manda.
   */
  const [tocoPlazo, setTocoPlazo] = useState(!!existente)
  const [tocoCategoria, setTocoCategoria] = useState(!!existente)

  const sugerido = useMemo(() => sugerirParaProducto(nombre), [nombre])

  useEffect(() => {
    if (!nombre.trim()) return
    if (!tocoCategoria) setCategoria(sugerido.categoria)
    if (!tocoPlazo) setCaducaISO(fechaDesdePlazo(plazoMasCercano(sugerido.dias), new Date()))
  }, [nombre, sugerido, tocoCategoria, tocoPlazo])

  const cantidadNum = Number(cantidad.replace(',', '.'))
  const valido = nombre.trim().length > 0 && cantidadNum > 0

  function guardar() {
    const datos = {
      nombre: nombre.trim(),
      categoria,
      cantidad: cantidadNum,
      unidad,
      precioUnitario: Number(precio.replace(/[^\d]/g, '')) || 0,
      caducaISO,
    }

    if (existente) {
      acciones.editarProducto(existente.id, datos)
    } else {
      acciones.agregarProducto({
        id: nuevoId(),
        creadoISO: new Date().toISOString(),
        codigoBarras: params.codigo || undefined,
        ...datos,
      })
      // Lo que el usuario acaba de escribir para un código que nadie reconoció queda
      // guardado: la próxima vez que aparezca ese empaque, la app ya sabe qué es. Es lo
      // que hace útil el escáner con las marcas colombianas que Open Food Facts no tiene.
      if (params.codigo) acciones.recordarCodigo(params.codigo, datos.nombre)
      // Venía de marcar algo como comprado en la lista: ya está en la despensa, así que
      // sale de la lista. Ese es el ciclo completo del producto.
      if (params.desdeCompra) acciones.borrarCompra(params.desdeCompra)
    }
    router.back()
  }

  return (
    <Pantalla titulo={existente ? 'Corregir' : 'Agregar a la despensa'}>
      <View style={{ paddingHorizontal: space[5], gap: space[5] }}>
        {params.desconocido === '1' && (
          <Text style={[t.apoyo, { color: c.texto2 }]}>
            No reconocí el código {params.codigo}. Escribe qué es y lo recuerdo para la
            próxima vez que lo escanees.
          </Text>
        )}

        <Campo etiqueta="Qué es" valor={nombre} alCambiar={setNombre} placeholder="Arroz, tomate, leche…" />

        <Selector
          etiqueta="Dónde va"
          opciones={CATEGORIAS}
          valor={categoria}
          alElegir={(v) => {
            setTocoCategoria(true)
            setCategoria(v)
          }}
          nombre={(v) => NOMBRE_CATEGORIA[v]}
        />

        <View style={{ flexDirection: 'row', gap: space[3] }}>
          <Campo
            etiqueta="Cuánto"
            valor={cantidad}
            alCambiar={setCantidad}
            teclado="decimal-pad"
            estilo={{ width: 110 }}
          />
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Selector
              opciones={UNIDADES}
              valor={unidad}
              alElegir={setUnidad}
              nombre={(u) => abreviar(u, cantidadNum || 2)}
            />
          </View>
        </View>

        <Campo
          etiqueta="Precio por unidad (opcional)"
          valor={precio}
          alCambiar={setPrecio}
          teclado="numeric"
          placeholder="Para estimar cuánto cuesta un plato"
        />

        <SelectorCaducidad
          caducaISO={caducaISO}
          alCambiar={(f) => {
            setTocoPlazo(true)
            setCaducaISO(f)
          }}
        />

        {!tocoPlazo && caducaISO && sugerido.dias !== null && (
          <Text style={[t.apoyo, { color: c.texto3 }]}>
            Lo calculé yo: {textoDuracion(sugerido.dias)}.
          </Text>
        )}

        <View style={{ gap: space[3], marginTop: space[3] }}>
          <Boton texto="Guardar" icono="check" onPress={guardar} deshabilitado={!valido} />
          <Boton texto="Cancelar" variante="texto" onPress={() => router.back()} />
        </View>
      </View>
    </Pantalla>
  )
}
