import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Share, Text, TextInput, View } from 'react-native'
import { Boton, Pantalla, Presionable, Seccion, Tarjeta, Vacio } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import type { ItemCompra } from '../../lib/dominio'
import { nuevoId, useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { formatearCantidad } from '../../lib/unidades'

function Fila({
  item,
  alAlternar,
  alBorrar,
  alPasar,
}: {
  item: ItemCompra
  alAlternar: () => void
  alBorrar: () => void
  alPasar?: () => void
}) {
  const { c, t, tq } = useTema()

  return (
    <View style={{ marginHorizontal: space[5], marginBottom: space[2] }}>
      <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3] }}>
        <Presionable
          onPress={alAlternar}
          haptica
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.comprado }}
          accessibilityLabel={item.nombre}
          style={{
            width: tq.chip,
            height: tq.chip,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={item.comprado ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={26}
            color={item.comprado ? c.alcanza : c.bordeFuerte}
          />
        </Presionable>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              t.cuerpo,
              {
                color: item.comprado ? c.texto3 : c.texto,
                textDecorationLine: item.comprado ? 'line-through' : 'none',
              },
            ]}
          >
            {item.nombre}
          </Text>
          {item.cantidad !== null && item.unidad !== null && (
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              {formatearCantidad(item.cantidad, item.unidad)}
            </Text>
          )}
        </View>

        {item.comprado && alPasar && (
          <Presionable
            onPress={alPasar}
            accessibilityRole="button"
            accessibilityLabel={`Pasar ${item.nombre} a la despensa`}
            style={{ padding: space[2] }}
          >
            <MaterialCommunityIcons name="fridge-outline" size={22} color={c.primario} />
          </Presionable>
        )}

        <Presionable
          onPress={alBorrar}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${item.nombre} de la lista`}
          style={{ padding: space[2] }}
        >
          <MaterialCommunityIcons name="close" size={20} color={c.texto3} />
        </Presionable>
      </Tarjeta>
    </View>
  )
}

export default function Compras() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const acciones = useAcciones()
  const [texto, setTexto] = useState('')

  const pendientes = estado.compras.filter((i) => !i.comprado)
  const comprados = estado.compras.filter((i) => i.comprado)

  function agregar() {
    const nombre = texto.trim()
    if (!nombre) return
    acciones.agregarCompra({
      id: nuevoId(),
      nombre,
      cantidad: null,
      unidad: null,
      comprado: false,
      creadoISO: new Date().toISOString(),
    })
    setTexto('')
  }

  /**
   * La lista viaja al chat como texto plano, que es como viaja de verdad una lista de
   * mercado aquí. Nada de PDF: nadie manda un PDF para pedir que le traigan tomates.
   */
  async function compartir() {
    const lineas = pendientes.map((i) => {
      const cantidad =
        i.cantidad !== null && i.unidad !== null ? ` (${formatearCantidad(i.cantidad, i.unidad)})` : ''
      return `- ${i.nombre}${cantidad}`
    })
    await Share.share({ message: `Mercado:\n${lineas.join('\n')}` }).catch(() => {})
  }

  return (
    <Pantalla titulo="Lista" apoyo="Lo que falta para el próximo mercado">
      <View style={{ paddingHorizontal: space[5], marginBottom: space[5], flexDirection: 'row', gap: space[2] }}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={agregar}
          returnKeyType="done"
          placeholder="Agregar algo a la lista"
          placeholderTextColor={c.texto3}
          accessibilityLabel="Agregar algo a la lista"
          style={[
            t.cuerpo,
            {
              flex: 1,
              color: c.texto,
              backgroundColor: c.tarjeta,
              borderColor: c.bordeFuerte,
              borderWidth: 1,
              borderRadius: radius.lg,
              paddingHorizontal: space[4],
              minHeight: tq.min,
            },
          ]}
        />
        <Presionable
          onPress={agregar}
          accessibilityRole="button"
          accessibilityLabel="Agregar"
          style={{
            width: tq.min,
            minHeight: tq.min,
            borderRadius: radius.lg,
            backgroundColor: c.primario,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color={c.sobreOscuro} />
        </Presionable>
      </View>

      {estado.compras.length === 0 ? (
        <Vacio>
          Cuando una receta te pida algo que no tienes, se agrega aquí de un toque. También
          puedes escribirlo arriba.
        </Vacio>
      ) : (
        <>
          {pendientes.map((i) => (
            <Fila
              key={i.id}
              item={i}
              alAlternar={() => acciones.alternarComprado(i.id)}
              alBorrar={() => acciones.borrarCompra(i.id)}
            />
          ))}

          {comprados.length > 0 && (
            <Seccion titulo="Ya en el carrito">
              {comprados.map((i) => (
                <Fila
                  key={i.id}
                  item={i}
                  alAlternar={() => acciones.alternarComprado(i.id)}
                  alBorrar={() => acciones.borrarCompra(i.id)}
                  // Cierra el ciclo del producto: compras → despensa → recetas → lista.
                  // Sin este paso el inventario se desactualiza en una semana.
                  alPasar={() =>
                    router.push({
                      pathname: '/producto/editar',
                      params: { nombre: i.nombre, desdeCompra: i.id },
                    })
                  }
                />
              ))}
            </Seccion>
          )}

          <View style={{ paddingHorizontal: space[5], marginTop: space[6], gap: space[3] }}>
            {pendientes.length > 0 && (
              <Boton texto="Mandar la lista" icono="share-variant-outline" variante="contorno" onPress={compartir} />
            )}
            {comprados.length > 0 && (
              <Boton
                texto="Quitar lo que ya compré"
                icono="broom"
                variante="texto"
                onPress={acciones.quitarComprados}
              />
            )}
          </View>
        </>
      )}
    </Pantalla>
  )
}
