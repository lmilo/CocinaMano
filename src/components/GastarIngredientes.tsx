import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { radius, sombra, space } from '../constants/tokens'
import type { RecetaEvaluada } from '../lib/coincidencia'
import { type Gasto, gastosDe } from '../lib/gastos'

// Se reexportan: las pantallas los importan desde aquí.
export { gastosDe, type Gasto }
import { useTema } from '../lib/tema'
import { Boton } from './ui'

/**
 * Qué descontar de la despensa después de cocinar.
 *
 * NO SE DESCUENTA SOLO, y esa es la decisión. La receta dice 500 g de pollo, pero uno echó
 * los 300 que quedaban, o el doble porque venían visitas. Restar automáticamente lo que
 * dice el papel dejaría la despensa mintiendo con la misma seguridad con la que hoy no
 * baja — solo que en la otra dirección, y sin que nadie se entere.
 *
 * Así que se propone lo de la receta, se puede quitar lo que no se gastó, y se confirma.
 * El usuario ve exactamente qué va a bajar antes de que baje.
 *
 * Solo aparecen los ingredientes que la app puede descontar: los que están en la despensa y
 * cuya unidad es convertible. De "sal" en unidades y "una cucharadita" no se puede restar
 * nada sensato, y fingir que sí ensuciaría el inventario.
 */

export function GastarIngredientes({
  visible,
  gastos: gastosIniciales,
  onConfirmar,
  onSaltar,
}: {
  visible: boolean
  gastos: Gasto[]
  onConfirmar: (gastos: { id: string; cantidad: number }[]) => void
  onSaltar: () => void
}) {
  const { c, t } = useTema()
  const [gastos, setGastos] = useState(gastosIniciales)

  // Los gastos llegan calculados al abrir; si cambia la receta, se rehacen.
  const clave = gastosIniciales.map((g) => `${g.productoId}:${g.cantidad}`).join('|')
  const [claveActual, setClaveActual] = useState(clave)
  if (clave !== claveActual) {
    setClaveActual(clave)
    setGastos(gastosIniciales)
  }

  const incluidos = gastos.filter((g) => g.incluido)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSaltar} statusBarTranslucent>
      <Pressable
        onPress={onSaltar}
        accessibilityLabel="Cerrar"
        style={{
          flex: 1,
          backgroundColor: 'rgba(10, 8, 6, 0.55)',
          justifyContent: 'center',
          padding: space[5],
        }}
      >
        <Pressable
          onPress={() => {}}
          style={[
            {
              backgroundColor: c.tarjeta,
              borderColor: c.borde,
              borderWidth: 1,
              borderRadius: radius.md,
              padding: space[5],
              gap: space[4],
              maxHeight: '80%',
            },
            sombra.elevada,
          ]}
        >
          <View style={{ gap: space[2] }}>
            <Text style={[t.subtitulo, { color: c.texto }]}>¿Lo bajo de la despensa?</Text>
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              Esto es lo que pedía la receta. Quita lo que no hayas gastado — si echaste más
              o menos, corrígelo después en el producto.
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 320 }}>
            <View style={{ gap: space[2] }}>
              {gastos.map((g) => (
                <Pressable
                  key={g.productoId}
                  onPress={() =>
                    setGastos((prev) =>
                      prev.map((x) =>
                        x.productoId === g.productoId ? { ...x, incluido: !x.incluido } : x,
                      ),
                    )
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: g.incluido }}
                  accessibilityLabel={`${g.nombre}, ${g.texto}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space[3],
                    paddingVertical: space[2],
                  }}
                >
                  <MaterialCommunityIcons
                    name={g.incluido ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={g.incluido ? c.alcanza : c.bordeFuerte}
                  />
                  <Text style={[t.cuerpo, { color: g.incluido ? c.texto : c.texto3, flex: 1 }]}>
                    {g.nombre}
                  </Text>
                  <Text style={[t.apoyoMed, { color: c.texto3 }]}>−{g.texto}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={{ gap: space[3] }}>
            <Boton
              texto={
                incluidos.length === 0
                  ? 'No bajar nada'
                  : `Bajar ${incluidos.length} ${incluidos.length === 1 ? 'cosa' : 'cosas'}`
              }
              icono="check"
              onPress={() =>
                onConfirmar(incluidos.map((g) => ({ id: g.productoId, cantidad: g.cantidad })))
              }
            />
            <Boton texto="Ahora no" variante="texto" onPress={onSaltar} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
