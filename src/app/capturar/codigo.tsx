import { MaterialCommunityIcons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Boton, Presionable } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { resolverCodigo } from '../../lib/codigo'
import { useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'

export default function EscanearCodigo() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { estado } = useEstado()
  const [permiso, pedirPermiso] = useCameraPermissions()
  const [buscando, setBuscando] = useState(false)

  // `onBarcodeScanned` dispara muchas veces por segundo mientras el código esté a la vista.
  // Sin este cerrojo se lanzan decenas de consultas y decenas de navegaciones.
  const yaLeido = useRef(false)

  async function alLeer(codigo: string) {
    if (yaLeido.current) return
    yaLeido.current = true

    // Vibra porque el usuario NO está mirando la pantalla, está apuntando al empaque.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    setBuscando(true)

    const resultado = await resolverCodigo(codigo, estado.codigosConocidos)
    setBuscando(false)

    router.replace({
      pathname: '/producto/editar',
      params: {
        nombre: resultado?.nombre ?? '',
        codigo,
        // Si no se reconoció, el formulario abre vacío con el código puesto y lo que el
        // usuario escriba se guarda para la próxima vez que aparezca ese empaque.
        desconocido: resultado ? '' : '1',
      },
    })
  }

  if (!permiso) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fondo, justifyContent: 'center' }}>
        <ActivityIndicator color={c.primario} />
      </View>
    )
  }

  if (!permiso.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.fondo,
          paddingTop: insets.top,
          paddingHorizontal: space[5],
          justifyContent: 'center',
          gap: space[4],
        }}
      >
        <Text style={[t.titulo, { color: c.texto }]}>Necesito la cámara</Text>
        <Text style={[t.cuerpo, { color: c.texto2 }]}>
          Es para leer el código de barras del empaque. La foto no se guarda ni sale del
          teléfono: solo se mira el código.
        </Text>
        <Boton texto="Permitir la cámara" icono="camera-outline" onPress={() => void pedirPermiso()} />
        <Boton texto="Mejor lo escribo" variante="texto" onPress={() => router.back()} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={({ data }) => void alLeer(data)}
      />

      {/* Marco guía: sin él la gente no sabe a qué distancia poner el empaque */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: '78%',
            aspectRatio: 1.6,
            borderColor: '#FFFFFF',
            borderWidth: 2,
            borderRadius: radius.md,
            opacity: 0.85,
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          top: insets.top + space[2],
          left: space[4],
          right: space[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
        }}
      >
        <Presionable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar el escáner"
          style={{
            width: tq.chip,
            height: tq.chip,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </Presionable>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + space[6],
          left: space[5],
          right: space[5],
          alignItems: 'center',
          gap: space[3],
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(0,0,0,0.65)',
            paddingHorizontal: space[4],
            paddingVertical: space[3],
            borderRadius: radius.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[3],
          }}
        >
          {buscando && <ActivityIndicator color="#FFFFFF" />}
          <Text style={[t.cuerpo, { color: '#FFFFFF', textAlign: 'center' }]}>
            {buscando ? 'Buscando qué es…' : 'Apunta al código de barras del empaque'}
          </Text>
        </View>
      </View>
    </View>
  )
}
