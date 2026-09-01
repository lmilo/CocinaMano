import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces'
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans'
import { useFonts } from 'expo-font'
import { Stack, usePathname, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { ReactNode, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SincronizarAvisos } from '../components/avisos'
import { VERSION_LEGAL } from '../constants/legal'
import { radius, space } from '../constants/tokens'
import { EstadoProvider, useEstado } from '../lib/store'
import { cargarTema, useTema } from '../lib/tema'

SplashScreen.preventAutoHideAsync().catch(() => {})

/**
 * Pantalla de fallo. Expo Router usa este export cuando algo revienta al renderizar.
 *
 * Lo primero que dice es que la despensa sigue guardada, porque es lo que el usuario va a
 * temer: cargarla es el trabajo caro de esta app y perderla es la única pérdida real que
 * puede sufrir aquí.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const { c, t, tq } = useTema()

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo, padding: space[5], justifyContent: 'center' }}>
      <Text style={[t.titulo, { color: c.texto }]}>Algo se dañó</Text>

      <Text style={[t.cuerpo, { color: c.texto2, marginTop: space[3] }]}>
        Tu despensa sigue guardada, no se perdió nada. Puedes volver a intentar.
      </Text>

      <Pressable
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Intentar otra vez"
        style={({ pressed }) => ({
          backgroundColor: pressed ? c.primarioOsc : c.primario,
          minHeight: tq.boton,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: space[7],
        })}
      >
        <Text style={[t.boton, { color: c.sobreOscuro }]}>INTENTAR OTRA VEZ</Text>
      </Pressable>

      <Text style={[t.apoyo, { color: c.texto3, marginTop: space[6] }]} numberOfLines={4}>
        {error.message}
      </Text>
    </View>
  )
}

/**
 * Decide a dónde entra el usuario.
 *
 * Quien ya tenía la app instalada nunca vuelve a pasar por la bienvenida, así que la
 * aceptación no puede vivir solo allí: al actualizar a una versión cuyo texto legal cambió,
 * esta es la única puerta por la que pasa. Se compara la VERSIÓN y no un booleano porque el
 * usuario aceptó un texto concreto, no la idea de aceptar.
 *
 * No hay clave de acceso, a diferencia de Recargo: allá protege el sueldo, que es
 * información sensible de verdad. Lo que hay en una despensa no lo es, y una fricción sin
 * motivo se paga en abandono.
 */
function Guardia({ children }: { children: ReactNode }) {
  const { c } = useTema()
  const router = useRouter()
  const ruta = usePathname()
  const { estado, cargando } = useEstado()

  const faltaAceptar = estado.configurado && estado.legal?.version !== VERSION_LEGAL

  useEffect(() => {
    if (cargando) return

    // /legal se deja pasar sin configurar: desde la bienvenida se puede abrir a leer el
    // detalle, y devolver al usuario allí sería expulsarlo de lo que está por aceptar.
    if (!estado.configurado) {
      if (ruta !== '/bienvenida' && ruta !== '/legal') router.replace('/bienvenida')
      return
    }
    if (faltaAceptar && ruta !== '/legal') router.replace('/legal?modo=aceptar')
  }, [cargando, estado.configurado, faltaAceptar, ruta, router])

  // El contenido protegido NO se pinta mientras haya una redirección pendiente: si no, se
  // alcanza a ver la despensa unos frames antes de que aparezca la bienvenida.
  const redirigiendo =
    (!estado.configurado && ruta !== '/bienvenida' && ruta !== '/legal') ||
    (faltaAceptar && ruta !== '/legal')

  /*
    EL NAVEGADOR SE MONTA SIEMPRE, y el velo va ENCIMA. Antes esto devolvía un <View> en
    lugar de los hijos, así que mientras `redirigiendo` fuera true el <Stack> no existía —
    y expo-router descarta en silencio las navegaciones encoladas cuando no hay navegador
    montado (`routingQueue.run` vacía la cola y solo despacha `if (ref.current)`). El
    `router.replace('/bienvenida')` del efecto de arriba podía perderse, dejando la ruta en
    '/' y el velo puesto para siempre.
  */
  return (
    <>
      {children}
      {(cargando || redirigiendo) && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: c.fondo }]}
          pointerEvents="auto"
        />
      )}
    </>
  )
}

export default function RootLayout() {
  const { c, esOscuro } = useTema()
  const [temaListo, setTemaListo] = useState(false)
  const [fuentesListas, error] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  })

  // La preferencia de tema se lee antes del primer pintado: si no, la app arranca en claro
  // y salta a oscuro un frame después, que es justo el destello que molesta de noche.
  useEffect(() => {
    cargarTema().finally(() => setTemaListo(true))
  }, [])

  const listo = temaListo && (fuentesListas || !!error)

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {})
  }, [listo])

  if (!listo) return <View style={{ flex: 1, backgroundColor: c.fondo }} />

  return (
    <EstadoProvider>
      <SincronizarAvisos />
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      {/*
        Stack en la raíz y las pestañas dentro del grupo (tabs): así la barra inferior solo
        existe en las cuatro pantallas principales, y no en la bienvenida, la captura por
        cámara ni el modo cocina.
      */}
      <Guardia>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.fondo },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bienvenida" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="legal" options={{ animation: 'fade' }} />
        <Stack.Screen name="producto/[id]" />
        <Stack.Screen name="producto/editar" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="capturar/factura" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="capturar/codigo" options={{ animation: 'fade' }} />
        <Stack.Screen name="capturar/voz" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="receta/[id]" />
        <Stack.Screen name="receta/editar" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="receta/generar" options={{ animation: 'slide_from_bottom' }} />
        {/* El modo cocina entra desde abajo y sin gesto de vuelta: se sale por su propia
            X, para que un roce con la muñeca no saque al usuario a mitad de un sofrito. */}
        <Stack.Screen
          name="receta/preparar"
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
      </Stack>
      </Guardia>
    </EstadoProvider>
  )
}
