import Constants from 'expo-constants'
import { Alert, Text, View } from 'react-native'
import { Boton, Pantalla, Seccion, Selector, Tarjeta } from '../../components/ui'
import { space } from '../../constants/tokens'
import { useEstado } from '../../lib/store'
import { cambiarTema, useTema, type PreferenciaTema } from '../../lib/tema'

const NOMBRE_TEMA: Record<PreferenciaTema, string> = {
  sistema: 'El del sistema',
  claro: 'Claro',
  oscuro: 'Oscuro',
}

export default function Ajustes() {
  const { c, t, preferencia } = useTema()
  const { estado, borrarTodo } = useEstado()

  function confirmarBorrado() {
    Alert.alert(
      'Borrar todo y empezar de cero',
      'Se borran la despensa, tus recetas y la lista de compras. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: () => void borrarTodo() },
      ],
    )
  }

  return (
    <Pantalla titulo="Yo" apoyo="Ajustes de la app">
      <Seccion titulo="Apariencia">
        <View style={{ paddingHorizontal: space[5] }}>
          <Selector
            opciones={['sistema', 'claro', 'oscuro'] as const}
            valor={preferencia}
            alElegir={(v) => void cambiarTema(v)}
            nombre={(v) => NOMBRE_TEMA[v]}
          />
          <Text style={[t.apoyo, { color: c.texto3, marginTop: space[3] }]}>
            El tema oscuro está pensado para mirar la app de noche frente a la nevera
            abierta, que suele ser la única luz del cuarto.
          </Text>
        </View>
      </Seccion>

      <Seccion titulo="Lo que tienes guardado">
        <View style={{ paddingHorizontal: space[5] }}>
          <Tarjeta style={{ gap: space[2] }}>
            <Text style={[t.cuerpo, { color: c.texto2 }]}>
              {estado.productos.length} en la despensa · {estado.recetas.length} recetas tuyas ·{' '}
              {estado.compras.length} en la lista
            </Text>
            {/*
              Sin servidor no hay respaldo automático, y el usuario tiene que saberlo. Es la
              contrapartida honesta de no pedirle una cuenta.
            */}
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              Todo vive en este teléfono y no se sube a ningún lado. Si lo pierdes o borras la
              app, se pierde — por eso conviene exportar de vez en cuando.
            </Text>
          </Tarjeta>
        </View>
      </Seccion>

      <Seccion titulo="Empezar de cero">
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton texto="Borrar todo" icono="delete-outline" variante="contorno" onPress={confirmarBorrado} />
        </View>
      </Seccion>

      <View style={{ paddingHorizontal: space[5], marginTop: space[8] }}>
        <Text style={[t.apoyo, { color: c.texto3, textAlign: 'center' }]}>
          Cocina a Mano {Constants.expoConfig?.version ?? ''}
        </Text>
      </View>
    </Pantalla>
  )
}
