import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Boton } from '../components/ui'
import { PUNTOS_CLAVE, VERSION_LEGAL } from '../constants/legal'
import { radius, space } from '../constants/tokens'
import { useAcciones } from '../lib/store'
import { useTema } from '../lib/tema'

/**
 * La primera pantalla, y la única vez que se pide algo antes de dejar entrar.
 *
 * No vende la app con una lista de funciones: dice qué hace en una frase y dedica el resto
 * a las cuatro cosas que el usuario tiene que saber de verdad — que todo vive en su
 * teléfono, qué sale de él, que el respaldo es suyo, y que la fecha no reemplaza mirar la
 * comida. Aceptar aquí es aceptar eso, no una casilla al pie.
 */
export default function Bienvenida() {
  const { c, t } = useTema()
  const router = useRouter()
  const acciones = useAcciones()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fondo }}
      contentContainerStyle={{
        paddingTop: insets.top + space[8],
        paddingBottom: insets.bottom + space[8],
        paddingHorizontal: space[5],
      }}
    >
      <Text style={[t.cifraXL, { color: c.primario }]}>Cocina{'\n'}a Mano</Text>

      <Text style={[t.cuerpo, { color: c.texto2, marginTop: space[4], marginBottom: space[8] }]}>
        Lleva la cuenta de lo que tienes en casa, te avisa antes de que se venza y te dice
        qué puedes cocinar con eso.
      </Text>

      <View style={{ gap: space[5] }}>
        {PUNTOS_CLAVE.map((punto) => (
          <View key={punto.titulo} style={{ flexDirection: 'row', gap: space[4] }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.sm,
                backgroundColor: c.primarioSuave,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name={punto.icono} size={22} color={c.primario} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[t.cuerpoMed, { color: c.texto }]}>{punto.titulo}</Text>
              <Text style={[t.apoyo, { color: c.texto2 }]}>{punto.texto}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: space[10], gap: space[3] }}>
        <Boton
          texto="Entendido, empezar"
          icono="arrow-right"
          onPress={() => {
            acciones.aceptarLegal(VERSION_LEGAL, new Date().toISOString())
            router.replace('/')
          }}
        />
        <Boton
          texto="Leer los términos completos"
          variante="texto"
          onPress={() => router.push('/legal')}
        />
      </View>
    </ScrollView>
  )
}
