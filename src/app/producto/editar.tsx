import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { Boton, Campo, Pantalla, Selector } from '../../components/ui'
import { NOMBRE_CATEGORIA } from '../../components/ui'
import { space } from '../../constants/tokens'
import { comoISO, textoCaducidad } from '../../lib/caducidad'
import { CATEGORIAS, type Categoria, type Unidad } from '../../lib/dominio'
import { nuevoId, useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { abreviar, UNIDADES } from '../../lib/unidades'

/**
 * Plazos en vez de calendario.
 *
 * Nadie sabe la fecha exacta en que se vence una lechuga, y obligar a elegirla en un
 * calendario para algo que se sabe "como en una semana" es fricción pura. El empaque que sí
 * trae fecha se escribe a mano abajo.
 */
const PLAZOS = ['sin', '3', '7', '15', '30', 'otra'] as const
type Plazo = (typeof PLAZOS)[number]

const NOMBRE_PLAZO: Record<Plazo, string> = {
  sin: 'No se vence',
  '3': 'En 3 días',
  '7': 'En 1 semana',
  '15': 'En 15 días',
  '30': 'En 1 mes',
  otra: 'Otra fecha',
}

function enDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return comoISO(d)
}

/** 'DD/MM/AAAA' → 'AAAA-MM-DD', o null si no es una fecha usable. */
function parseFechaEscrita(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/)
  if (!m) return null
  const [, d, mes, a] = m
  const fecha = new Date(Number(a), Number(mes) - 1, Number(d))
  // Rechaza fechas que no existen: el 31/02 se desborda a marzo y hay que notarlo.
  if (fecha.getDate() !== Number(d) || fecha.getMonth() !== Number(mes) - 1) return null
  return comoISO(fecha)
}

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
  const [plazo, setPlazo] = useState<Plazo>(existente?.caducaISO ? 'otra' : 'sin')
  const [fechaEscrita, setFechaEscrita] = useState(() => {
    if (!existente?.caducaISO) return ''
    const [a, m, d] = existente.caducaISO.split('-')
    return `${d}/${m}/${a}`
  })

  const caducaISO = useMemo(() => {
    if (plazo === 'sin') return null
    if (plazo === 'otra') return parseFechaEscrita(fechaEscrita)
    return enDias(Number(plazo))
  }, [plazo, fechaEscrita])

  const fechaInvalida = plazo === 'otra' && fechaEscrita.trim() !== '' && caducaISO === null
  const cantidadNum = Number(cantidad.replace(',', '.'))
  const valido = nombre.trim().length > 0 && cantidadNum > 0 && !fechaInvalida

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
          alElegir={setCategoria}
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

        <View style={{ gap: space[3] }}>
          <Selector
            etiqueta="Cuándo se vence"
            opciones={PLAZOS}
            valor={plazo}
            alElegir={setPlazo}
            nombre={(p) => NOMBRE_PLAZO[p]}
          />

          {plazo === 'otra' && (
            <Campo
              etiqueta="La fecha del empaque"
              valor={fechaEscrita}
              alCambiar={setFechaEscrita}
              placeholder="DD/MM/AAAA"
              teclado="numeric"
            />
          )}

          {fechaInvalida && (
            <Text style={[t.apoyo, { color: c.vencido }]}>
              Esa fecha no existe. Escríbela como 25/12/2026.
            </Text>
          )}

          {caducaISO && (
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              {textoCaducidad(caducaISO, new Date())}
            </Text>
          )}
        </View>

        <View style={{ gap: space[3], marginTop: space[3] }}>
          <Boton texto="Guardar" icono="check" onPress={guardar} deshabilitado={!valido} />
          <Boton texto="Cancelar" variante="texto" onPress={() => router.back()} />
        </View>
      </View>
    </Pantalla>
  )
}
