import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { radius, space } from '../constants/tokens'
import { estadoDeCaducidad, textoCaducidad, type EstadoReloj } from '../lib/caducidad'
import type { RecetaEvaluada } from '../lib/coincidencia'
import type { Categoria, Producto } from '../lib/dominio'
import { useTema } from '../lib/tema'
import { formatearCantidad } from '../lib/unidades'
import { Chip, ICONO_CATEGORIA, ICONO_RELOJ, NOMBRE_CATEGORIA, Presionable, Tarjeta } from './ui'

/** El color del marco de una categoría. `otro` no lleva: no tiene identidad que marcar. */
export function useColorCategoria(categoria: Categoria): string | null {
  const { c } = useTema()
  const mapa: Record<Categoria, string> = {
    nevera: c.catNevera,
    congelador: c.catCongelador,
    despensa: c.catDespensa,
    especias: c.catEspecias,
    panaderia: c.catPanaderia,
    bebidas: c.catBebidas,
    otro: c.catOtro,
  }
  const color = mapa[categoria]
  return color === 'transparent' ? null : color
}

/** Los colores del reloj, resueltos contra el tema. Un solo sitio para los cuatro estados. */
export function useColoresReloj(estado: EstadoReloj) {
  const { c } = useTema()
  const mapa = {
    conTiempo: { color: c.conTiempo, fondo: c.conTiempoSuave, relleno: c.conTiempoFill },
    estaSemana: { color: c.estaSemana, fondo: c.estaSemanaSuave, relleno: c.estaSemanaFill },
    pronto: { color: c.pronto, fondo: c.prontoSuave, relleno: c.prontoFill },
    vencido: { color: c.vencido, fondo: c.vencidoSuave, relleno: c.vencidoFill },
  }
  return mapa[estado]
}

export function ChipReloj({ caducaISO, ahora }: { caducaISO: string | null; ahora: Date }) {
  const estado = estadoDeCaducidad(caducaISO, ahora)
  const { color, fondo } = useColoresReloj(estado)

  // Lo que tiene tiempo de sobra no lleva acento: no pide nada. Ver `_branding/BRAND.md` §4.
  if (estado === 'conTiempo') return null

  return <Chip texto={textoCaducidad(caducaISO, ahora)} icono={ICONO_RELOJ[estado]} color={color} fondo={fondo} />
}

export function TarjetaProducto({
  producto,
  ahora,
  alTocar,
}: {
  producto: Producto
  ahora: Date
  alTocar?: () => void
}) {
  const { c, t } = useTema()
  const estado = estadoDeCaducidad(producto.caducaISO, ahora)
  const { color } = useColoresReloj(estado)
  const colorCategoria = useColorCategoria(producto.categoria)
  const urgente = estado !== 'conTiempo'

  return (
    <Presionable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={`${producto.nombre}, ${formatearCantidad(producto.cantidad, producto.unidad)}${
        producto.caducaISO ? `, ${textoCaducidad(producto.caducaISO, ahora)}` : ''
      }`}
      style={{ marginHorizontal: space[5], marginBottom: space[2] }}
    >
      <Tarjeta
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          // Una franja lateral del color del reloj: se lee de reojo, que es como se mira
          // esta lista con la nevera abierta.
          borderLeftWidth: urgente ? 4 : 1,
          borderLeftColor: urgente ? color : c.borde,
        }}
      >
        {/*
          El marco dice DÓNDE está guardado, y el icono lo repite. Es refuerzo, no canal
          único: ver `tokens.ts`, donde está por qué el color solo no bastaría.
        */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.sm,
            backgroundColor: c.tarjetaAlt,
            borderWidth: colorCategoria ? 2 : 0,
            borderColor: colorCategoria ?? 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={ICONO_CATEGORIA[producto.categoria]}
            size={22}
            color={colorCategoria ?? c.texto3}
          />
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[t.cuerpoMed, { color: c.texto }]} numberOfLines={1}>
            {producto.nombre}
          </Text>
          <Text style={[t.apoyo, { color: c.texto3 }]}>
            {formatearCantidad(producto.cantidad, producto.unidad)}
            {' · '}
            {NOMBRE_CATEGORIA[producto.categoria]}
          </Text>
          {urgente && <ChipReloj caducaISO={producto.caducaISO} ahora={ahora} />}
        </View>
      </Tarjeta>
    </Presionable>
  )
}

/**
 * Cuánto te alcanza, dicho como el usuario se lo pregunta.
 *
 * "Te faltan 2" antes que "83%": el porcentaje no dice cuántas bolsas hay que meter al
 * carrito, y con recetas de 6 y de 14 ingredientes engaña — un 80% de 14 deja tres cosas
 * por comprar y un 75% de 4 deja una sola.
 */
export function InsigniaCoincidencia({ evaluada }: { evaluada: RecetaEvaluada }) {
  const { c } = useTema()
  const faltan = evaluada.total - evaluada.cubiertos

  if (faltan === 0) {
    return <Chip texto="Te alcanza" icono="check-circle" color={c.alcanza} fondo={c.alcanzaSuave} />
  }
  return (
    <Chip
      texto={faltan === 1 ? 'Te falta 1' : `Te faltan ${faltan}`}
      icono="cart-outline"
      color={c.texto2}
      fondo={c.tarjetaAlt}
    />
  )
}

export function TarjetaReceta({
  evaluada,
  ahora,
  alTocar,
}: {
  evaluada: RecetaEvaluada
  ahora: Date
  alTocar?: () => void
}) {
  const { c, t } = useTema()
  const { receta, aprovecha, faltantes } = evaluada

  return (
    <Presionable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={`${receta.nombre}. ${
        evaluada.total === evaluada.cubiertos
          ? 'Te alcanza todo'
          : `Te faltan ${evaluada.total - evaluada.cubiertos}`
      }`}
      style={{ marginHorizontal: space[5], marginBottom: space[3] }}
    >
      <Tarjeta style={{ gap: space[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[3] }}>
          <Text style={[t.subtitulo, { color: c.texto, flex: 1 }]} numberOfLines={2}>
            {receta.nombre}
          </Text>
          <InsigniaCoincidencia evaluada={evaluada} />
        </View>

        {/*
          El conector entre los dos ejes de color, y la única razón por la que inventario y
          recetas viven en la misma app.
        */}
        {aprovecha.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
            <MaterialCommunityIcons name="clock-alert-outline" size={16} color={c.pronto} />
            <Text style={[t.apoyoMed, { color: c.pronto, flex: 1 }]} numberOfLines={2}>
              Usa {aprovecha.map((p) => p.nombre.toLowerCase()).join(', ')}
              {aprovecha.length === 1 ? ', que se está por vencer' : ', que se están por vencer'}
            </Text>
          </View>
        )}

        {faltantes.length > 0 && (
          <Text style={[t.apoyo, { color: c.texto3 }]} numberOfLines={2}>
            Falta: {faltantes.join(', ')}
          </Text>
        )}
      </Tarjeta>
    </Presionable>
  )
}

