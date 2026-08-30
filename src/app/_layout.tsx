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
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { radius, space } from '../constants/tokens'
import { EstadoProvider } from '../lib/store'
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
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      {/*
        Stack en la raíz y las pestañas dentro del grupo (tabs): así la barra inferior solo
        existe en las cuatro pantallas principales, y no en la bienvenida, la captura por
        cámara ni el modo cocina.
      */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.fondo },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="producto/[id]" />
        <Stack.Screen name="producto/editar" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="receta/[id]" />
        <Stack.Screen name="receta/editar" options={{ animation: 'slide_from_bottom' }} />
        {/* El modo cocina entra desde abajo y sin gesto de vuelta: se sale por su propia
            X, para que un roce con la muñeca no saque al usuario a mitad de un sofrito. */}
        <Stack.Screen
          name="receta/preparar"
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
      </Stack>
    </EstadoProvider>
  )
}
