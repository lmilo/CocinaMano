import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Modal, Pressable, Text, View } from 'react-native'
import { radius, sombra, space } from '../constants/tokens'
import { useTema } from '../lib/tema'
import { Boton } from './ui'

/**
 * Confirmar algo que no se puede deshacer.
 *
 * REEMPLAZA A `Alert.alert`, y no por gusto. El diálogo nativo de Android llega con la
 * tipografía del sistema, sus colores y sus botones en el orden del fabricante: en mitad de
 * una app que cuidó la letra, el espaciado y el contraste, aparece algo que es visiblemente
 * de otra parte. Y encima el botón destructivo queda a la derecha, que es donde el pulgar
 * va por inercia después de tocar "Borrar" en la pantalla anterior.
 *
 * Aquí la acción peligrosa va a la IZQUIERDA y con el color de lo vencido; cancelar es el
 * botón sólido, el que el dedo encuentra primero. Que sea más fácil salvarse que borrar es
 * deliberado.
 *
 * Lo que se va a perder se nombra en el cuerpo —"Se quita el pollo de la despensa"— porque
 * "¿Estás seguro?" no le dice a nadie qué está a punto de pasar.
 */
export function Confirmar({
  visible,
  titulo,
  cuerpo,
  textoConfirmar,
  onConfirmar,
  onCancelar,
  icono = 'alert-circle-outline',
  soloAviso = false,
}: {
  visible: boolean
  titulo: string
  cuerpo: string
  textoConfirmar: string
  onConfirmar: () => void
  onCancelar: () => void
  icono?: keyof typeof MaterialCommunityIcons.glyphMap
  /**
   * Solo informa: un botón para cerrar y nada que confirmar.
   *
   * Existe para que un "no se pudo guardar el respaldo" no salga con el diálogo nativo en
   * medio de una app que cuidó cada detalle. Es el mismo marco, sin la acción peligrosa.
   */
  soloAviso?: boolean
}) {
  const { c, t } = useTema()
  const acento = soloAviso ? c.estaSemana : c.vencido
  const acentoSuave = soloAviso ? c.estaSemanaSuave : c.vencidoSuave

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // El botón físico de atrás cancela, como cancelaría el nativo. Sin esto, en Android
      // se sale de la pantalla entera y el modal queda huérfano.
      onRequestClose={onCancelar}
      statusBarTranslucent
    >
      {/* Tocar fuera cancela. Nunca confirma: eso convertiría un roce en un borrado. */}
      <Pressable
        onPress={onCancelar}
        accessibilityLabel="Cancelar"
        style={{
          flex: 1,
          backgroundColor: 'rgba(10, 8, 6, 0.55)',
          justifyContent: 'center',
          padding: space[5],
        }}
      >
        <Pressable
          // Traga el toque para que tocar la tarjeta no cierre el modal.
          onPress={() => {}}
          style={[
            {
              backgroundColor: c.tarjeta,
              borderColor: c.borde,
              borderWidth: 1,
              borderRadius: radius.md,
              padding: space[5],
              gap: space[4],
            },
            sombra.elevada,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                backgroundColor: acentoSuave,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name={icono} size={24} color={acento} />
            </View>
            <Text style={[t.subtitulo, { color: c.texto, flex: 1 }]}>{titulo}</Text>
          </View>

          <Text style={[t.cuerpo, { color: c.texto2 }]}>{cuerpo}</Text>

          <View style={{ gap: space[3], marginTop: space[2] }}>
            <Boton
              texto={soloAviso ? 'Entendido' : 'Mejor no'}
              icono={soloAviso ? 'check' : 'close'}
              onPress={onCancelar}
            />
            {!soloAviso && (
            <Pressable
              onPress={onConfirmar}
              accessibilityRole="button"
              accessibilityLabel={textoConfirmar}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderColor: c.vencido,
                backgroundColor: pressed ? c.vencidoSuave : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: space[2],
              })}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color={c.vencido} />
              <Text style={[t.boton, { color: c.vencido }]}>{textoConfirmar}</Text>
            </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
