import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Alert, Text, View } from 'react-native'
import { ChipReloj } from '../../components/dominio'
import {
  Boton,
  ICONO_CATEGORIA,
  NOMBRE_CATEGORIA,
  Pantalla,
  Presionable,
  Seccion,
  Tarjeta,
  Vacio,
} from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { RECETAS_BASE } from '../../lib/catalogo'
import { evaluarRecetas } from '../../lib/coincidencia'
import { useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { formatearCantidad } from '../../lib/unidades'

export default function DetalleProducto() {
  const { c, t } = useTema()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { estado } = useEstado()
  const acciones = useAcciones()

  const ahora = useMemo(() => new Date(), [])
  const producto = estado.productos.find((p) => p.id === id)

  /** En qué recetas se usa. Es la pregunta que sigue a "tengo esto y se me está venciendo". */
  const usadoEn = useMemo(() => {
    if (!producto) return []
    return evaluarRecetas([...RECETAS_BASE, ...estado.recetas], estado.productos, ahora).filter((e) =>
      e.ingredientes.some((i) => i.producto?.id === producto.id),
    )
  }, [producto, estado.recetas, estado.productos, ahora])

  if (!producto) {
    return (
      <Pantalla titulo="No está">
        <Vacio>Este producto ya no está en tu despensa.</Vacio>
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton texto="Volver" variante="contorno" onPress={() => router.back()} />
        </View>
      </Pantalla>
    )
  }

  function confirmarBorrado() {
    Alert.alert('Quitar de la despensa', `Se quita ${producto!.nombre}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          acciones.borrarProducto(producto!.id)
          router.back()
        },
      },
    ])
  }

  return (
    <Pantalla titulo={producto.nombre}>
      <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
        <Tarjeta style={{ gap: space[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.sm,
                backgroundColor: c.tarjetaAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name={ICONO_CATEGORIA[producto.categoria]}
                size={26}
                color={c.texto3}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.cifraM, { color: c.texto }]}>
                {formatearCantidad(producto.cantidad, producto.unidad)}
              </Text>
              <Text style={[t.apoyo, { color: c.texto3 }]}>
                {NOMBRE_CATEGORIA[producto.categoria]}
              </Text>
            </View>
          </View>

          <ChipReloj caducaISO={producto.caducaISO} ahora={ahora} />

          {/* El precio va en texto normal, sin acento: el problema no es cuánto costó. */}
          {producto.precioUnitario > 0 && (
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              ${producto.precioUnitario.toLocaleString('es-CO')} por {producto.unidad}
            </Text>
          )}

          {!!producto.codigoBarras && (
            <Text style={[t.apoyo, { color: c.texto3 }]}>Código {producto.codigoBarras}</Text>
          )}
        </Tarjeta>

        <View style={{ flexDirection: 'row', gap: space[3] }}>
          <View style={{ flex: 1 }}>
            <Boton
              texto="Corregir"
              icono="pencil-outline"
              variante="contorno"
              onPress={() => router.push({ pathname: '/producto/editar', params: { id: producto.id } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Boton texto="Quitar" icono="delete-outline" variante="texto" onPress={confirmarBorrado} />
          </View>
        </View>
      </View>

      <Seccion titulo={`Se usa en ${usadoEn.length} ${usadoEn.length === 1 ? 'receta' : 'recetas'}`}>
        {usadoEn.length === 0 ? (
          <Vacio>Ninguna de tus recetas lo pide todavía.</Vacio>
        ) : (
          usadoEn.slice(0, 8).map((e) => {
            const faltan = e.total - e.cubiertos
            return (
              <Presionable
                key={e.receta.id}
                onPress={() => router.push(`/receta/${e.receta.id}`)}
                accessibilityRole="button"
                style={{ marginHorizontal: space[5], marginBottom: space[2] }}
              >
                <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3] }}>
                  <Text style={[t.cuerpo, { color: c.texto, flex: 1 }]} numberOfLines={1}>
                    {e.receta.nombre}
                  </Text>
                  <Text style={[t.apoyoMed, { color: faltan === 0 ? c.alcanza : c.texto3 }]}>
                    {faltan === 0 ? 'Te alcanza' : `Faltan ${faltan}`}
                  </Text>
                </Tarjeta>
              </Presionable>
            )
          })
        )}
      </Seccion>
    </Pantalla>
  )
}
