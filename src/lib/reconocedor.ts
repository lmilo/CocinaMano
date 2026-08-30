/**
 * Reconocimiento de voz, cargado a prueba de que no exista.
 *
 * MISMA TRAMPA QUE LOS ANUNCIOS EN RECARGO: `expo-speech-recognition` es un módulo NATIVO y
 * no existe dentro de Expo Go. Un `import` de nivel superior tumbaría la pantalla —y con
 * ella el desarrollo diario—, así que el módulo se carga de forma perezosa dentro de un
 * try/catch y, si no está, la pantalla de dictado ofrece escribir a mano. En el APK sí carga.
 *
 * Tampoco se usa el hook `useSpeechRecognitionEvent` que trae el paquete: un hook no se
 * puede llamar condicionalmente, así que bastaría con que el nativo faltara para romper las
 * reglas de hooks. Aquí se suscribe a mano y se limpia en un `useEffect` normal.
 *
 * El reconocedor de Android trabaja EN EL DISPOSITIVO en la mayoría de teléfonos, así que
 * dictar el mercado funciona sin señal. Es la razón de que el texto se parsee en local
 * (`voz.ts`) en vez de mandarlo a la IA.
 */

type Modulo = {
  start: (opciones: Record<string, unknown>) => void
  stop: () => void
  abort: () => void
  requestPermissionsAsync: () => Promise<{ granted: boolean }>
  addListener: (evento: string, cb: (e: any) => void) => { remove: () => void }
}

/** undefined = no se ha intentado · null = no disponible */
let modulo: Modulo | null | undefined

function cargar(): Modulo | null {
  if (modulo !== undefined) return modulo
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const paquete = require('expo-speech-recognition')
    modulo = (paquete?.ExpoSpeechRecognitionModule as Modulo) ?? null
  } catch {
    modulo = null
  }
  return modulo
}

export function hayReconocedor(): boolean {
  return cargar() !== null
}

export async function pedirPermiso(): Promise<boolean> {
  const m = cargar()
  if (!m) return false
  try {
    const r = await m.requestPermissionsAsync()
    return r.granted
  } catch {
    return false
  }
}

export type EscuchaOpciones = {
  alTexto: (texto: string, definitivo: boolean) => void
  alTerminar: () => void
  alFallar: (mensaje: string) => void
}

/**
 * Arranca la escucha. Devuelve la función para cortar y soltar las suscripciones.
 *
 * Devuelve `null` si el módulo nativo no está, que es lo que la pantalla usa para caer al
 * campo de texto sin decir nada raro.
 */
export function escuchar({ alTexto, alTerminar, alFallar }: EscuchaOpciones): (() => void) | null {
  const m = cargar()
  if (!m) return null

  const suscripciones: { remove: () => void }[] = []

  try {
    suscripciones.push(
      m.addListener('result', (e: any) => {
        const texto: string = e?.results?.[0]?.transcript ?? ''
        // `isFinal` marca el resultado consolidado; lo de antes son tanteos que sirven para
        // que el usuario vea que la app lo está oyendo.
        if (texto) alTexto(texto, e?.isFinal === true)
      }),
    )
    suscripciones.push(m.addListener('end', () => alTerminar()))
    suscripciones.push(
      m.addListener('error', (e: any) => {
        const codigo = e?.error ?? ''
        // 'no-speech' no es un fallo: es que el usuario no dijo nada. Tratarlo como error
        // haría aparecer un mensaje rojo cada vez que alguien toca el micrófono sin querer.
        if (codigo === 'no-speech') {
          alTerminar()
          return
        }
        alFallar('No se entendió. Intenta otra vez o escríbelo.')
      }),
    )

    m.start({
      lang: 'es-CO',
      interimResults: true,
      continuous: false,
      // Sin esto Android abre su propio diálogo de dictado encima de la app.
      requiresOnDeviceRecognition: false,
      addsPunctuation: false,
    })
  } catch {
    suscripciones.forEach((s) => s.remove())
    alFallar('El dictado no está disponible en este teléfono.')
    return null
  }

  return () => {
    try {
      m.abort()
    } catch {
      // Ya estaba cortado.
    }
    suscripciones.forEach((s) => s.remove())
  }
}

export function detener() {
  try {
    cargar()?.stop()
  } catch {
    // No había nada escuchando.
  }
}
