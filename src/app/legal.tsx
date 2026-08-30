import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Boton, Pantalla, Selector } from '../components/ui'
import { FECHA_LEGAL, PRIVACIDAD, TERMINOS, VERSION_LEGAL, type SeccionLegal } from '../constants/legal'
import { space } from '../constants/tokens'
import { useAcciones } from '../lib/store'
import { useTema } from '../lib/tema'

type Cual = 'datos' | 'terminos'

export default function Legal() {
  const { c, t } = useTema()
  const router = useRouter()
  const acciones = useAcciones()
  const { modo } = useLocalSearchParams<{ modo?: string }>()
  const [cual, setCual] = useState<Cual>('datos')

  const secciones: SeccionLegal[] = cual === 'datos' ? PRIVACIDAD : TERMINOS
  const debeAceptar = modo === 'aceptar'

  return (
    <Pantalla
      titulo={debeAceptar ? 'Cambió lo que dice la app' : 'Términos y datos'}
      apoyo={
        debeAceptar
          ? 'Léelo antes de seguir. Aceptaste una versión anterior.'
          : `Versión ${VERSION_LEGAL} · ${FECHA_LEGAL}`
      }
    >
      <View style={{ paddingHorizontal: space[5], marginBottom: space[5] }}>
        <Selector
          opciones={['datos', 'terminos'] as const}
          valor={cual}
          alElegir={setCual}
          nombre={(v) => (v === 'datos' ? 'Tus datos' : 'Términos')}
        />
      </View>

      <View style={{ paddingHorizontal: space[5], gap: space[6] }}>
        {secciones.map((s) => (
          <View key={s.titulo} style={{ gap: space[2] }}>
            <Text style={[t.subtitulo, { color: c.texto }]}>{s.titulo}</Text>
            {s.parrafos.map((p, n) => (
              <Text key={n} style={[t.cuerpo, { color: c.texto2 }]}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: space[5], marginTop: space[8], gap: space[3] }}>
        {debeAceptar ? (
          <Boton
            texto="Entendido, seguir"
            icono="check"
            onPress={() => {
              acciones.aceptarLegal(VERSION_LEGAL, new Date().toISOString())
              router.replace('/')
            }}
          />
        ) : (
          <Boton texto="Volver" variante="contorno" onPress={() => router.back()} />
        )}
      </View>
    </Pantalla>
  )
}
