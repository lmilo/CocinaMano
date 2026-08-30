import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ReactNode } from 'react'
import {
  Pressable,
  PressableProps,
  ScrollView,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, space } from '../constants/tokens'
import type { Categoria } from '../lib/dominio'
import type { EstadoReloj } from '../lib/caducidad'
import { useTema } from '../lib/tema'

/** Iconos vectoriales, nunca emojis. Ver `_branding/BRAND.md` §7. */
export const ICONO_CATEGORIA: Record<Categoria, keyof typeof MaterialCommunityIcons.glyphMap> = {
  nevera: 'fridge-outline',
  congelador: 'snowflake',
  despensa: 'package-variant-closed',
  especias: 'shaker-outline',
  panaderia: 'bread-slice-outline',
  bebidas: 'bottle-soda-classic-outline',
  otro: 'dots-horizontal-circle-outline',
}

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  nevera: 'Nevera',
  congelador: 'Congelador',
  despensa: 'Despensa',
  especias: 'Especias',
  panaderia: 'Panadería',
  bebidas: 'Bebidas',
  otro: 'Otro',
}

/**
 * El color NUNCA va solo: cada estado del reloj tiene además su propio icono.
 *
 * Un protanopo no distingue el ámbar del terracota, así que si el color fuera el único
 * canal, la mitad de la tesis del producto sería invisible para él.
 */
export const ICONO_RELOJ: Record<EstadoReloj, keyof typeof MaterialCommunityIcons.glyphMap> = {
  conTiempo: 'check-circle-outline',
  estaSemana: 'clock-outline',
  pronto: 'clock-alert-outline',
  vencido: 'alert-circle-outline',
}

/**
 * Marco de pantalla: respeta la barra de estado, pone el título y da el respiro de siempre.
 */
export function Pantalla({
  titulo,
  apoyo,
  accion,
  children,
  desplazable = true,
}: {
  titulo: string
  apoyo?: string
  accion?: ReactNode
  children?: ReactNode
  desplazable?: boolean
}) {
  const { c, t } = useTema()
  const insets = useSafeAreaInsets()

  const cuerpo = (
    <>
      <View
        style={{
          paddingHorizontal: space[5],
          paddingTop: space[4],
          paddingBottom: space[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: space[3],
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[t.titulo, { color: c.texto }]}>{titulo}</Text>
          {!!apoyo && <Text style={[t.apoyo, { color: c.texto3, marginTop: space[1] }]}>{apoyo}</Text>}
        </View>
        {accion}
      </View>
      {children}
    </>
  )

  if (!desplazable) {
    return <View style={{ flex: 1, backgroundColor: c.fondo, paddingTop: insets.top }}>{cuerpo}</View>
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fondo }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space[16] }}
      keyboardShouldPersistTaps="handled"
    >
      {cuerpo}
    </ScrollView>
  )
}

/**
 * Estado vacío que ENSEÑA en vez de disculparse: dice cuál es el siguiente paso, no que no
 * hay datos. Ver el checklist de `_branding/MOODBOARD.md` §5.
 */
export function Vacio({ children }: { children: ReactNode }) {
  const { c, t } = useTema()
  return (
    <View style={{ paddingHorizontal: space[6], paddingVertical: space[8] }}>
      <Text style={[t.cuerpo, { color: c.texto2, textAlign: 'center', lineHeight: 26 }]}>
        {children}
      </Text>
    </View>
  )
}

type PresionableProps = PressableProps & {
  children: ReactNode
  style?: ViewStyle
  /** Vibración corta. Solo donde el usuario NO puede verificar mirando. */
  haptica?: boolean
}

export function Presionable({ children, style, haptica, onPress, ...resto }: PresionableProps) {
  return (
    <Pressable
      {...resto}
      onPress={(e) => {
        if (haptica) Haptics.selectionAsync().catch(() => {})
        onPress?.(e)
      }}
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  )
}

export function Boton({
  texto,
  onPress,
  variante = 'solido',
  icono,
  cocina = false,
  deshabilitado = false,
}: {
  texto: string
  onPress: () => void
  variante?: 'solido' | 'contorno' | 'texto'
  icono?: keyof typeof MaterialCommunityIcons.glyphMap
  cocina?: boolean
  deshabilitado?: boolean
}) {
  const { c, t, tq } = useTema(cocina)

  const fondo = variante === 'solido' ? c.primario : 'transparent'
  const color = variante === 'solido' ? c.sobreOscuro : c.primario
  const borde = variante === 'contorno' ? c.primario : 'transparent'

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => ({
        backgroundColor: variante === 'solido' && pressed ? c.primarioOsc : fondo,
        borderColor: borde,
        borderWidth: variante === 'contorno' ? 1.5 : 0,
        minHeight: tq.boton,
        borderRadius: radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        paddingHorizontal: space[5],
        opacity: deshabilitado ? 0.45 : pressed && variante !== 'solido' ? 0.6 : 1,
      })}
    >
      {!!icono && <MaterialCommunityIcons name={icono} size={cocina ? 24 : 20} color={color} />}
      <Text style={[t.boton, { color }]}>{texto}</Text>
    </Pressable>
  )
}

/** Etiqueta pegada al alimento, no botón: por eso va a `pill`. */
export function Chip({
  texto,
  icono,
  color,
  fondo,
  estilo,
}: {
  texto: string
  icono?: keyof typeof MaterialCommunityIcons.glyphMap
  color: string
  fondo: string
  estilo?: ViewStyle
}) {
  const { t } = useTema()
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[1],
          backgroundColor: fondo,
          paddingHorizontal: space[3],
          paddingVertical: 5,
          borderRadius: radius.pill,
          alignSelf: 'flex-start',
        },
        estilo,
      ]}
    >
      {!!icono && <MaterialCommunityIcons name={icono} size={14} color={color} />}
      <Text style={[t.etiqueta, { color }]}>{texto}</Text>
    </View>
  )
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useTema()
  return (
    <View
      style={[
        {
          backgroundColor: c.tarjeta,
          borderColor: c.borde,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: space[4],
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Campo({
  etiqueta,
  valor,
  alCambiar,
  placeholder,
  teclado = 'default',
  estilo,
}: {
  etiqueta: string
  valor: string
  alCambiar: (v: string) => void
  placeholder?: string
  teclado?: 'default' | 'numeric' | 'decimal-pad'
  estilo?: ViewStyle
}) {
  const { c, t, tq } = useTema()
  return (
    <View style={estilo}>
      <Text style={[t.rotulo, { color: c.texto3, marginBottom: space[2] }]}>
        {etiqueta.toUpperCase()}
      </Text>
      <TextInput
        value={valor}
        onChangeText={alCambiar}
        placeholder={placeholder}
        placeholderTextColor={c.texto3}
        keyboardType={teclado}
        accessibilityLabel={etiqueta}
        style={[
          t.cuerpo as TextStyle,
          {
            color: c.texto,
            backgroundColor: c.tarjeta,
            borderColor: c.bordeFuerte,
            borderWidth: 1,
            borderRadius: radius.lg,
            paddingHorizontal: space[4],
            minHeight: tq.min,
          },
        ]}
      />
    </View>
  )
}

/** Selector de una opción entre pocas, en fila desplazable. */
export function Selector<T extends string>({
  etiqueta,
  opciones,
  valor,
  alElegir,
  nombre,
}: {
  etiqueta?: string
  opciones: readonly T[]
  valor: T
  alElegir: (v: T) => void
  nombre?: (v: T) => string
}) {
  const { c, t, tq } = useTema()
  return (
    <View>
      {!!etiqueta && (
        <Text style={[t.rotulo, { color: c.texto3, marginBottom: space[2] }]}>
          {etiqueta.toUpperCase()}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {opciones.map((o) => {
            const activo = o === valor
            return (
              <Presionable
                key={o}
                onPress={() => alElegir(o)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={{
                  backgroundColor: activo ? c.primario : c.tarjeta,
                  borderColor: activo ? c.primario : c.bordeFuerte,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                  paddingHorizontal: space[4],
                  minHeight: tq.chip,
                  justifyContent: 'center',
                }}
              >
                <Text style={[t.apoyoMed, { color: activo ? c.sobreOscuro : c.texto2 }]}>
                  {nombre ? nombre(o) : o}
                </Text>
              </Presionable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { c, t } = useTema()
  return (
    <View style={{ marginTop: space[6] }}>
      <Text
        style={[t.rotulo, { color: c.texto3, paddingHorizontal: space[5], marginBottom: space[2] }]}
      >
        {titulo.toUpperCase()}
      </Text>
      {children}
    </View>
  )
}
