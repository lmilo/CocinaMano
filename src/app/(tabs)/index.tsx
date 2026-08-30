import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { TarjetaProducto } from '../../components/dominio'
import {
  ICONO_CATEGORIA,
  NOMBRE_CATEGORIA,
  Pantalla,
  Presionable,
  Selector,
  Vacio,
} from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { estadoDeCaducidad } from '../../lib/caducidad'
import { CATEGORIAS, type Categoria, type Producto } from '../../lib/dominio'
import { useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'

type Agrupacion = 'urgencia' | 'categoria'

const NOMBRE_AGRUPACION: Record<Agrupacion, string> = {
  urgencia: 'Por urgencia',
  categoria: 'Por lugar',
}

/**
 * Lo primero de la pantalla NO es el inventario, es el reloj.
 *
 * Si no hay nada por perderse la banda no existe: un contador en cero ocupando el mejor
 * espacio de la pantalla es ruido. Ver `_branding/LAYOUT.md` §3.
 */
function BandaUrgente({
  cuantos,
  activo,
  alTocar,
}: {
  cuantos: number
  activo: boolean
  alTocar: () => void
}) {
  const { c, t, tq } = useTema()
  if (cuantos === 0) return null

  return (
    <Presionable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${cuantos} ${cuantos === 1 ? 'cosa se vence' : 'cosas se vencen'} pronto. Tocar para ${activo ? 'ver todo' : 'filtrar'}`}
      style={{
        marginHorizontal: space[5],
        marginBottom: space[4],
        backgroundColor: activo ? c.prontoFill : c.prontoSuave,
        borderRadius: radius.md,
        paddingHorizontal: space[4],
        minHeight: tq.min,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
      }}
    >
      <MaterialCommunityIcons
        name="clock-alert-outline"
        size={22}
        color={activo ? c.sobreOscuro : c.pronto}
      />
      <Text style={[t.cuerpoMed, { color: activo ? c.sobreOscuro : c.pronto, flex: 1 }]}>
        {cuantos === 1 ? '1 cosa se vence pronto' : `${cuantos} cosas se vencen pronto`}
      </Text>
      <Text style={[t.apoyo, { color: activo ? c.sobreOscuro : c.pronto }]}>
        {activo ? 'Ver todo' : 'Ver'}
      </Text>
    </Presionable>
  )
}

/**
 * Los cuatro caminos para cargar la despensa, VISIBLES.
 *
 * Esconderlos tras un botón flotante con un "+" sería enterrar lo que hace que esta app
 * valga la pena en un teléfono. La fricción de cargar la despensa es el problema número uno
 * del producto —nadie teclea cuarenta productos— y la solución no puede estar a dos toques.
 *
 * Van en el orden en que resuelven de verdad: la factura carga el mercado entero de una,
 * el código sirve para lo que ya está guardado, el dictado para cuando las manos están
 * ocupadas, y escribir a mano queda de último porque es lo más lento.
 */
function BarraDeEntrada() {
  const { c, t, tq } = useTema()
  const router = useRouter()

  const caminos = [
    { icono: 'receipt' as const, texto: 'Factura', ruta: '/capturar/factura' },
    { icono: 'barcode-scan' as const, texto: 'Código', ruta: '/capturar/codigo' },
    { icono: 'microphone-outline' as const, texto: 'Dictar', ruta: '/capturar/voz' },
    { icono: 'pencil-outline' as const, texto: 'A mano', ruta: '/producto/editar' },
  ]

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: space[2],
        paddingHorizontal: space[5],
        marginBottom: space[5],
      }}
    >
      {caminos.map((camino) => (
        <Presionable
          key={camino.texto}
          onPress={() => router.push(camino.ruta as never)}
          accessibilityRole="button"
          accessibilityLabel={`Agregar por ${camino.texto.toLowerCase()}`}
          style={{
            flex: 1,
            minHeight: tq.min + space[3],
            borderRadius: radius.md,
            backgroundColor: c.tarjeta,
            borderColor: c.borde,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: space[2],
          }}
        >
          <MaterialCommunityIcons name={camino.icono} size={22} color={c.primario} />
          <Text style={[t.etiqueta, { color: c.texto2 }]} numberOfLines={1} allowFontScaling={false}>
            {camino.texto}
          </Text>
        </Presionable>
      ))}
    </View>
  )
}

function Grupo({ titulo, icono, children }: { titulo: string; icono?: keyof typeof MaterialCommunityIcons.glyphMap; children: React.ReactNode }) {
  const { c, t } = useTema()
  return (
    <View style={{ marginBottom: space[4] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          paddingHorizontal: space[5],
          marginBottom: space[2],
        }}
      >
        {!!icono && <MaterialCommunityIcons name={icono} size={15} color={c.texto3} />}
        <Text style={[t.rotulo, { color: c.texto3 }]}>{titulo.toUpperCase()}</Text>
      </View>
      {children}
    </View>
  )
}

export default function Despensa() {
  const { c, t } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('urgencia')
  const [soloUrgentes, setSoloUrgentes] = useState(false)

  const ahora = useMemo(() => new Date(), [])

  const urgentes = useMemo(
    () =>
      estado.productos.filter((p) => {
        const e = estadoDeCaducidad(p.caducaISO, ahora)
        return e === 'pronto' || e === 'estaSemana' || e === 'vencido'
      }),
    [estado.productos, ahora],
  )

  const visibles = soloUrgentes ? urgentes : estado.productos

  const grupos = useMemo(() => {
    if (agrupacion === 'categoria') {
      return CATEGORIAS.map((cat) => ({
        clave: cat,
        titulo: NOMBRE_CATEGORIA[cat],
        icono: ICONO_CATEGORIA[cat],
        productos: visibles.filter((p) => p.categoria === cat),
      })).filter((g) => g.productos.length > 0)
    }

    const orden: { clave: string; titulo: string; icono?: keyof typeof MaterialCommunityIcons.glyphMap; productos: Producto[] }[] = [
      { clave: 'vencido', titulo: 'Ya se venció', icono: 'alert-circle-outline', productos: [] },
      { clave: 'pronto', titulo: 'Hoy o mañana', icono: 'clock-alert-outline', productos: [] },
      { clave: 'estaSemana', titulo: 'Esta semana', icono: 'clock-outline', productos: [] },
      { clave: 'conTiempo', titulo: 'Con tiempo', icono: 'check-circle-outline', productos: [] },
    ]
    for (const p of visibles) {
      const grupo = orden.find((g) => g.clave === estadoDeCaducidad(p.caducaISO, ahora))
      grupo?.productos.push(p)
    }
    for (const g of orden) {
      g.productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }
    return orden.filter((g) => g.productos.length > 0)
  }, [visibles, agrupacion, ahora])

  const total = estado.productos.length

  return (
    <Pantalla
      titulo="Despensa"
      apoyo={total === 0 ? 'Lo que tienes en casa' : `${total} ${total === 1 ? 'cosa' : 'cosas'} en casa`}
    >
      <BandaUrgente
        cuantos={urgentes.length}
        activo={soloUrgentes}
        alTocar={() => setSoloUrgentes((v) => !v)}
      />

      <BarraDeEntrada />

      {total === 0 ? (
        <Vacio>
          Tu despensa está vacía. Agrega lo que tienes en casa y aquí verás qué se está por
          vencer y qué puedes cocinar con ello.
        </Vacio>
      ) : (
        <>
          <View style={{ paddingHorizontal: space[5], marginBottom: space[4] }}>
            <Selector
              opciones={['urgencia', 'categoria'] as const}
              valor={agrupacion}
              alElegir={setAgrupacion}
              nombre={(a) => NOMBRE_AGRUPACION[a]}
            />
          </View>

          {visibles.length === 0 ? (
            <Vacio>Nada por vencerse. Toca la banda de arriba para ver toda la despensa.</Vacio>
          ) : (
            grupos.map((g) => (
              <Grupo key={g.clave} titulo={g.titulo} icono={g.icono}>
                {g.productos.map((p) => (
                  <TarjetaProducto
                    key={p.id}
                    producto={p}
                    ahora={ahora}
                    alTocar={() => router.push(`/producto/${p.id}`)}
                  />
                ))}
              </Grupo>
            ))
          )}
        </>
      )}
    </Pantalla>
  )
}
