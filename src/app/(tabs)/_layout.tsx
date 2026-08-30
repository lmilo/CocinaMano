import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { radius, space } from '../../constants/tokens'
import { useTema } from '../../lib/tema'

/**
 * Pestaña con icono vectorial Y palabra, más una cápsula de color en la activa.
 *
 * Nunca icono solo: "despensa" y "lista" no tienen símbolo universal, y un icono ambiguo
 * obliga a explorar tocando — que es exactamente lo que no se puede hacer con las manos
 * ocupadas. Ver `_branding/LAYOUT.md` §1.
 *
 * `allowFontScaling={false}` solo aquí: con la letra del sistema al máximo, cuatro palabras
 * no caben en 360dp y romperían la navegación. En el resto de la app el texto sí escala.
 */
function Pestana({
  icono,
  texto,
  activo,
}: {
  icono: keyof typeof Ionicons.glyphMap
  texto: string
  activo: boolean
}) {
  const { c, t } = useTema()
  return (
    <View style={{ alignItems: 'center', width: 78, paddingTop: space[2] }}>
      <View
        style={{
          paddingHorizontal: space[4],
          paddingVertical: 5,
          borderRadius: radius.sm,
          backgroundColor: activo ? c.primarioSuave : 'transparent',
          marginBottom: 4,
        }}
      >
        <Ionicons name={icono} size={24} color={activo ? c.primario : c.texto3} />
      </View>
      <Text
        style={[t.etiqueta, { color: activo ? c.primario : c.texto3 }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {texto}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const { c, tq } = useTema()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: c.fondo },
        tabBarStyle: {
          backgroundColor: c.tarjeta,
          borderTopColor: c.borde,
          borderTopWidth: 1,
          height: tq.min + space[6],
          paddingTop: space[1],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pestana icono="basket-outline" texto="Despensa" activo={focused} />
          ),
          tabBarAccessibilityLabel: 'Despensa, lo que tienes',
        }}
      />
      <Tabs.Screen
        name="cocinar"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pestana icono="restaurant-outline" texto="Qué cocino" activo={focused} />
          ),
          tabBarAccessibilityLabel: 'Qué cocino, recetas que te alcanzan',
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pestana icono="cart-outline" texto="Lista" activo={focused} />
          ),
          tabBarAccessibilityLabel: 'Lista de compras',
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pestana icono="person-outline" texto="Yo" activo={focused} />
          ),
          tabBarAccessibilityLabel: 'Yo, ajustes',
        }}
      />
    </Tabs>
  )
}
