import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useKeepAwake } from 'expo-keep-awake'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Boton, Presionable, Vacio } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { RECETAS_BASE } from '../../lib/catalogo'
import { escalar } from '../../lib/coincidencia'
import { useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { formatearCantidad } from '../../lib/unidades'

/**
 * MODO COCINA — un paso por pantalla.
 *
 * `useKeepAwake` es la línea más importante del archivo: que la pantalla se apague a mitad
 * de un sofrito y haya que desbloquear el teléfono con las manos llenas de aceite es el
 * fallo más caro que puede tener esta pantalla.
 *
 * La escala grande viene de `useTema(true)`, y existe solo aquí. Ver `_branding/TOKENS.md`
 * §6: la restricción es la distancia y el no poder tocar, no la agudeza visual.
 */
export default function Preparar() {
  useKeepAwake()

  const { c, t, tq } = useTema(true)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id, porciones } = useLocalSearchParams<{ id: string; porciones?: string }>()
  const { estado } = useEstado()
  const acciones = useAcciones()

  const receta = useMemo(
    () => [...RECETAS_BASE, ...estado.recetas].find((r) => r.id === id),
    [id, estado.recetas],
  )
  const [n, setN] = useState(0)

  if (!receta) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fondo, paddingTop: insets.top }}>
        <Vacio>Esta receta ya no existe.</Vacio>
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton texto="Volver" variante="contorno" onPress={() => router.back()} />
        </View>
      </View>
    )
  }

  const porcionesFinales = Number(porciones) || receta.porciones
  const pasos = receta.pasos
  const ultimo = n >= pasos.length - 1
  const paso = pasos[n]

  /*
    Una receta sin pasos no debería existir —el formulario exige uno y el Worker lo valida—
    pero puede llegar de un respaldo editado a mano. Aquí NO se puede reventar: esta
    pantalla va con `gestureEnabled: false`, así que el ErrorBoundary dejaría al usuario sin
    gesto de vuelta, con las manos en la comida.
  */
  if (!paso) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fondo, paddingTop: insets.top }}>
        <Vacio>Esta receta no tiene pasos escritos.</Vacio>
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton texto="Volver" variante="contorno" onPress={() => router.back()} />
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.fondo,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + space[4],
      }}
    >
      {/* Barra superior: salir y en qué paso vas */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space[4],
          paddingVertical: space[2],
          gap: space[3],
        }}
      >
        <Presionable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Salir del modo cocina"
          style={{
            width: tq.chip,
            height: tq.chip,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="close" size={26} color={c.texto2} />
        </Presionable>
        <Text style={[t.apoyoMed, { color: c.texto3, flex: 1 }]} numberOfLines={1}>
          {receta.nombre}
        </Text>
        <Text style={[t.apoyoMed, { color: c.texto3 }]}>
          {n + 1} de {pasos.length}
        </Text>
      </View>

      {/* Progreso: barra sólida, sin animación. Se mira de reojo. */}
      <View style={{ flexDirection: 'row', gap: 3, paddingHorizontal: space[4], marginBottom: space[5] }}>
        {pasos.map((p, i) => (
          <View
            key={p.orden}
            style={{
              flex: 1,
              height: 4,
              borderRadius: radius.pill,
              backgroundColor: i <= n ? c.primario : c.borde,
            }}
          />
        ))}
      </View>

      {/* El paso, que es lo único que importa aquí */}
      <View style={{ flex: 1, paddingHorizontal: space[5], justifyContent: 'center' }}>
        <Text style={[t.cifraXL, { color: c.primario, marginBottom: space[4] }]}>{paso.orden}</Text>
        <Text style={[t.cuerpo, { color: c.texto }]}>{paso.texto}</Text>
      </View>

      {/* Lo que lleva, al alcance sin salir del paso */}
      <View style={{ paddingHorizontal: space[5], marginBottom: space[4] }}>
        <Text style={[t.apoyo, { color: c.texto3 }]} numberOfLines={2}>
          {receta.ingredientes
            .map(
              (i) =>
                `${i.nombre} ${formatearCantidad(
                  escalar(i.cantidad, receta.porciones, porcionesFinales),
                  i.unidad,
                )}`,
            )
            .join(' · ')}
        </Text>
      </View>

      {/* Navegación con área táctil de 64dp: aquí se toca de pie y a veces con el dorso */}
      <View style={{ flexDirection: 'row', gap: space[3], paddingHorizontal: space[5] }}>
        {n > 0 && (
          <View style={{ flex: 1 }}>
            <Boton texto="Atrás" icono="arrow-left" variante="contorno" cocina onPress={() => setN((v) => v - 1)} />
          </View>
        )}
        <View style={{ flex: 2 }}>
          {ultimo ? (
            <Boton
              texto="Terminé"
              icono="check"
              cocina
              onPress={() => {
                acciones.marcarPreparada(receta.id, {
                  cuandoISO: new Date().toISOString(),
                  estrellas: estado.preparadas[receta.id]?.estrellas ?? 0,
                })
                router.back()
              }}
            />
          ) : (
            <Boton texto="Siguiente" icono="arrow-right" cocina onPress={() => setN((v) => v + 1)} />
          )}
        </View>
      </View>
    </View>
  )
}
