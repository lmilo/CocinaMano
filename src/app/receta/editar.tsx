import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { Boton, Campo, Pantalla, Presionable, Seccion, Selector, Tarjeta } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import type { Ingrediente, Unidad } from '../../lib/dominio'
import { nuevoId, useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { abreviar, UNIDADES } from '../../lib/unidades'

export default function EditarReceta() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { estado } = useEstado()
  const acciones = useAcciones()

  const existente = id ? estado.recetas.find((r) => r.id === id) : undefined

  const [nombre, setNombre] = useState(existente?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '')
  const [porciones, setPorciones] = useState(String(existente?.porciones ?? 4))
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(existente?.ingredientes ?? [])
  const [pasos, setPasos] = useState<string[]>(existente?.pasos.map((p) => p.texto) ?? [''])

  // Borrador del ingrediente que se está agregando
  const [ingNombre, setIngNombre] = useState('')
  const [ingCantidad, setIngCantidad] = useState('1')
  const [ingUnidad, setIngUnidad] = useState<Unidad>('unidades')

  function agregarIngrediente() {
    const n = ingNombre.trim()
    const cantidad = Number(ingCantidad.replace(',', '.'))
    if (!n || !(cantidad > 0)) return
    setIngredientes((prev) => [...prev, { nombre: n, cantidad, unidad: ingUnidad }])
    setIngNombre('')
    setIngCantidad('1')
  }

  const pasosLimpios = pasos.map((p) => p.trim()).filter(Boolean)
  const valido = nombre.trim().length > 0 && ingredientes.length > 0 && pasosLimpios.length > 0

  function guardar() {
    const datos = {
      origen: 'propia' as const,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      porciones: Number(porciones) || 4,
      cocina: null,
      ingredientes,
      pasos: pasosLimpios.map((texto, i) => ({ orden: i + 1, texto })),
    }

    if (existente) {
      acciones.editarReceta(existente.id, datos)
    } else {
      acciones.agregarReceta({ id: nuevoId(), ...datos })
    }
    router.back()
  }

  return (
    <Pantalla titulo={existente ? 'Corregir receta' : 'Escribir una receta'}>
      <View style={{ paddingHorizontal: space[5], gap: space[5] }}>
        <Campo etiqueta="Cómo se llama" valor={nombre} alCambiar={setNombre} placeholder="Sancocho de mi mamá" />
        <Campo
          etiqueta="Una línea sobre ella (opcional)"
          valor={descripcion}
          alCambiar={setDescripcion}
        />
        <Campo etiqueta="Para cuántos" valor={porciones} alCambiar={setPorciones} teclado="numeric" estilo={{ width: 110 }} />
      </View>

      <Seccion titulo="Qué lleva">
        <View style={{ paddingHorizontal: space[5], gap: space[2] }}>
          {ingredientes.map((i, n) => (
            <Tarjeta
              key={`${i.nombre}-${n}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3] }}
            >
              <Text style={[t.cuerpo, { color: c.texto, flex: 1 }]}>{i.nombre}</Text>
              <Text style={[t.apoyoMed, { color: c.texto3 }]}>
                {i.cantidad} {abreviar(i.unidad, i.cantidad)}
              </Text>
              <Presionable
                onPress={() => setIngredientes((prev) => prev.filter((_, k) => k !== n))}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${i.nombre}`}
                style={{ padding: space[1] }}
              >
                <MaterialCommunityIcons name="close" size={20} color={c.texto3} />
              </Presionable>
            </Tarjeta>
          ))}

          <View style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-end' }}>
            <TextInput
              value={ingNombre}
              onChangeText={setIngNombre}
              placeholder="Ingrediente"
              placeholderTextColor={c.texto3}
              accessibilityLabel="Nombre del ingrediente"
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
            <TextInput
              value={ingCantidad}
              onChangeText={setIngCantidad}
              keyboardType="decimal-pad"
              accessibilityLabel="Cantidad"
              style={[
                t.cuerpo,
                {
                  width: 66,
                  color: c.texto,
                  backgroundColor: c.tarjeta,
                  borderColor: c.bordeFuerte,
                  borderWidth: 1,
                  borderRadius: radius.lg,
                  paddingHorizontal: space[3],
                  minHeight: tq.min,
                  textAlign: 'center',
                },
              ]}
            />
            <Presionable
              onPress={agregarIngrediente}
              accessibilityRole="button"
              accessibilityLabel="Agregar ingrediente"
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

          <Selector opciones={UNIDADES} valor={ingUnidad} alElegir={setIngUnidad} nombre={(u) => abreviar(u, 2)} />
        </View>
      </Seccion>

      <Seccion titulo="Cómo se hace">
        <View style={{ paddingHorizontal: space[5], gap: space[2] }}>
          {pasos.map((p, n) => (
            <View key={n} style={{ flexDirection: 'row', gap: space[2], alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: radius.pill,
                  backgroundColor: c.primarioSuave,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: space[3],
                }}
              >
                <Text style={[t.etiqueta, { color: c.primario }]}>{n + 1}</Text>
              </View>
              <TextInput
                value={p}
                onChangeText={(v) => setPasos((prev) => prev.map((x, k) => (k === n ? v : x)))}
                placeholder={`Paso ${n + 1}`}
                placeholderTextColor={c.texto3}
                multiline
                accessibilityLabel={`Paso ${n + 1}`}
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
                    paddingVertical: space[3],
                    minHeight: tq.min,
                  },
                ]}
              />
              {pasos.length > 1 && (
                <Presionable
                  onPress={() => setPasos((prev) => prev.filter((_, k) => k !== n))}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar paso ${n + 1}`}
                  style={{ padding: space[2], marginTop: space[2] }}
                >
                  <MaterialCommunityIcons name="close" size={20} color={c.texto3} />
                </Presionable>
              )}
            </View>
          ))}

          <Boton
            texto="Otro paso"
            icono="plus"
            variante="texto"
            onPress={() => setPasos((prev) => [...prev, ''])}
          />
        </View>
      </Seccion>

      <View style={{ paddingHorizontal: space[5], marginTop: space[6], gap: space[3] }}>
        <Boton texto="Guardar receta" icono="check" onPress={guardar} deshabilitado={!valido} />
        <Boton texto="Cancelar" variante="texto" onPress={() => router.back()} />
      </View>
    </Pantalla>
  )
}
