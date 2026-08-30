import { ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { space } from '../constants/tokens'
import { useTema } from '../lib/tema'

/**
 * Marco de pantalla: respeta la barra de estado, pone el título y deja el contenido con el
 * respiro de siempre. Todo lo que se repita en tres pantallas termina aquí.
 */
export function Pantalla({
  titulo,
  apoyo,
  children,
  desplazable = true,
}: {
  titulo: string
  apoyo?: string
  children?: ReactNode
  desplazable?: boolean
}) {
  const { c, t } = useTema()
  const insets = useSafeAreaInsets()

  const encabezado = (
    <View style={{ paddingHorizontal: space[5], paddingTop: space[4], paddingBottom: space[3] }}>
      <Text style={[t.titulo, { color: c.texto }]}>{titulo}</Text>
      {!!apoyo && (
        <Text style={[t.apoyo, { color: c.texto3, marginTop: space[1] }]}>{apoyo}</Text>
      )}
    </View>
  )

  const cuerpo = (
    <>
      {encabezado}
      {children}
    </>
  )

  if (!desplazable) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fondo, paddingTop: insets.top }}>{cuerpo}</View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fondo }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space[8] }}
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
    <View style={{ paddingHorizontal: space[5], paddingVertical: space[8] }}>
      <Text style={[t.cuerpo, { color: c.texto2, textAlign: 'center' }]}>{children}</Text>
    </View>
  )
}
