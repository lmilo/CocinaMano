import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { TarjetaProducto, useColorCategoria } from '../../components/dominio'
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
import { palabras, raices } from '../../lib/texto'

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

/**
 * Un grupo que se pliega al tocar su título.
 *
 * Con la despensa llena la lista se vuelve larga, y lo que uno quiere ver casi siempre es
 * un solo grupo: lo que se vence, o lo que hay en la nevera. Plegar el resto es más rápido
 * que desplazarse, sobre todo de pie y con una mano.
 *
 * El estado de plegado vive en la pantalla y no se guarda: al volver, todo abierto. Un
 * grupo que quedó cerrado de la sesión pasada esconde comida sin que nadie lo pidiera, y
 * esconder comida es exactamente lo contrario de lo que hace esta app.
 */
function Grupo({
  titulo,
  icono,
  color,
  cuantos,
  plegado,
  alPlegar,
  children,
}: {
  titulo: string
  icono?: keyof typeof MaterialCommunityIcons.glyphMap
  color?: string | null
  cuantos: number
  plegado: boolean
  alPlegar: () => void
  children: React.ReactNode
}) {
  const { c, t, tq } = useTema()
  return (
    <View style={{ marginBottom: space[4] }}>
      <Presionable
        onPress={alPlegar}
        accessibilityRole="button"
        accessibilityState={{ expanded: !plegado }}
        accessibilityLabel={`${titulo}, ${cuantos} ${cuantos === 1 ? 'cosa' : 'cosas'}. ${plegado ? 'Tocar para abrir' : 'Tocar para cerrar'}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
          paddingHorizontal: space[5],
          minHeight: tq.chip,
          marginBottom: space[2],
        }}
      >
        {!!icono && <MaterialCommunityIcons name={icono} size={15} color={color ?? c.texto3} />}
        <Text style={[t.rotulo, { color: color ?? c.texto3 }]}>{titulo.toUpperCase()}</Text>
        <Text style={[t.rotulo, { color: c.texto3 }]}>{cuantos}</Text>
        <View style={{ flex: 1 }} />
        <MaterialCommunityIcons
          name={plegado ? 'chevron-down' : 'chevron-up'}
          size={22}
          color={c.texto3}
        />
      </Presionable>
      {!plegado && children}
    </View>
  )
}

export default function Despensa() {
  const { c, t } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('urgencia')
  const [soloUrgentes, setSoloUrgentes] = useState(false)
  const [plegados, setPlegados] = useState<Set<string>>(new Set())
  /** `null` = todos los lugares. Solo aplica agrupando por lugar. */
  const [lugar, setLugar] = useState<Categoria | null>(null)
  const [consulta, setConsulta] = useState('')

  const ahora = useMemo(() => new Date(), [])

  const COLOR_CATEGORIA: Record<Categoria, string | null> = useMemo(
    () => ({
      nevera: c.catNevera,
      congelador: c.catCongelador,
      despensa: c.catDespensa,
      especias: c.catEspecias,
      panaderia: c.catPanaderia,
      bebidas: c.catBebidas,
      otro: null,
    }),
    [c],
  )

  const urgentes = useMemo(
    () =>
      estado.productos.filter((p) => {
        const e = estadoDeCaducidad(p.caducaISO, ahora)
        return e === 'pronto' || e === 'estaSemana' || e === 'vencido'
      }),
    [estado.productos, ahora],
  )

  const visibles = useMemo(() => {
    let base = soloUrgentes ? urgentes : estado.productos

    // La búsqueda manda sobre todo lo demás: quien escribe "pollo" quiere ver el pollo,
    // esté donde esté y se venza cuando se venza.
    const buscadas = palabras(consulta)
    if (buscadas.length > 0) {
      base = base.filter((p) => {
        const propias = new Set<string>()
        for (const w of palabras(p.nombre)) for (const r of raices(w)) propias.add(r)
        return buscadas.every((b) => raices(b).some((r) => propias.has(r)))
      })
      return base
    }

    // El filtro de lugar solo tiene sentido viendo por lugar: en la vista por urgencia
    // esconder media despensa sería esconder comida sin que nadie lo pidiera.
    if (agrupacion !== 'categoria' || lugar === null) return base
    return base.filter((p) => p.categoria === lugar)
  }, [soloUrgentes, urgentes, estado.productos, agrupacion, lugar, consulta])

  /** Las categorías que de verdad tienen algo: no se ofrece filtrar por una vacía. */
  const conProductos = useMemo(
    () => CATEGORIAS.filter((cat) => estado.productos.some((p) => p.categoria === cat)),
    [estado.productos],
  )

  const grupos = useMemo(() => {
    if (agrupacion === 'categoria') {
      return CATEGORIAS.map((cat) => ({
        clave: cat,
        titulo: NOMBRE_CATEGORIA[cat],
        icono: ICONO_CATEGORIA[cat],
        color: COLOR_CATEGORIA[cat],
        productos: visibles.filter((p) => p.categoria === cat),
      })).filter((g) => g.productos.length > 0)
    }

    // Agrupando por urgencia el color lo manda el reloj, no el lugar: pintar los dos a la
    // vez haría competir los dos ejes en la misma lista.
    const orden: { clave: string; titulo: string; icono?: keyof typeof MaterialCommunityIcons.glyphMap; color: string | null; productos: Producto[] }[] = [
      { clave: 'vencido', titulo: 'Ya se venció', icono: 'alert-circle-outline', color: c.vencido, productos: [] },
      { clave: 'pronto', titulo: 'Hoy o mañana', icono: 'clock-alert-outline', color: c.pronto, productos: [] },
      { clave: 'estaSemana', titulo: 'Esta semana', icono: 'clock-outline', color: c.estaSemana, productos: [] },
      { clave: 'conTiempo', titulo: 'Con tiempo', icono: 'check-circle-outline', color: null, productos: [] },
    ]
    for (const p of visibles) {
      const grupo = orden.find((g) => g.clave === estadoDeCaducidad(p.caducaISO, ahora))
      grupo?.productos.push(p)
    }
    for (const g of orden) {
      g.productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }
    return orden.filter((g) => g.productos.length > 0)
  }, [visibles, agrupacion, ahora, c, COLOR_CATEGORIA])

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

      {/* Con la despensa llena, encontrar algo concreto por desplazamiento no es viable. */}
      {total > 0 && (
        <View style={{ paddingHorizontal: space[5], marginBottom: space[4] }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[2],
              backgroundColor: c.tarjeta,
              borderColor: c.bordeFuerte,
              borderWidth: 1,
              borderRadius: radius.lg,
              paddingHorizontal: space[3],
              minHeight: 52,
            }}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={c.texto3} />
            <TextInput
              value={consulta}
              onChangeText={setConsulta}
              placeholder="Buscar en la despensa"
              placeholderTextColor={c.texto3}
              accessibilityLabel="Buscar en la despensa"
              returnKeyType="search"
              style={[t.cuerpo, { flex: 1, color: c.texto, paddingVertical: space[2] }]}
            />
            {consulta.length > 0 && (
              <Presionable
                onPress={() => setConsulta('')}
                accessibilityRole="button"
                accessibilityLabel="Borrar la búsqueda"
                style={{ padding: space[1] }}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={c.texto3} />
              </Presionable>
            )}
          </View>
        </View>
      )}

      {total === 0 ? (
        <Vacio>
          Tu despensa está vacía. Agrega lo que tienes en casa y aquí verás qué se está por
          vencer y qué puedes cocinar con ello.
        </Vacio>
      ) : (
        <>
          <View style={{ paddingHorizontal: space[5], marginBottom: space[4], gap: space[3] }}>
            <Selector
              opciones={['urgencia', 'categoria'] as const}
              valor={agrupacion}
              alElegir={setAgrupacion}
              nombre={(a) => NOMBRE_AGRUPACION[a]}
            />

            {/* Viendo por lugar, poder mirar uno solo: "qué hay en la nevera". */}
            {agrupacion === 'categoria' && (
              <Selector
                opciones={['__todos__', ...conProductos]}
                valor={lugar ?? '__todos__'}
                alElegir={(v) => setLugar(v === '__todos__' ? null : (v as Categoria))}
                nombre={(v) => (v === '__todos__' ? 'Todos' : NOMBRE_CATEGORIA[v as Categoria])}
              />
            )}
          </View>

          {visibles.length === 0 ? (
            <Vacio>
              {consulta.trim()
                ? `No tienes nada que se llame «${consulta.trim()}».`
                : 'Nada por vencerse. Toca la banda de arriba para ver toda la despensa.'}
            </Vacio>
          ) : (
            grupos.map((g) => (
              <Grupo
                key={g.clave}
                titulo={g.titulo}
                icono={g.icono}
                color={g.color}
                cuantos={g.productos.length}
                plegado={plegados.has(g.clave)}
                alPlegar={() =>
                  setPlegados((prev) => {
                    const siguiente = new Set(prev)
                    if (siguiente.has(g.clave)) siguiente.delete(g.clave)
                    else siguiente.add(g.clave)
                    return siguiente
                  })
                }
              >
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
