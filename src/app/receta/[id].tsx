import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { InsigniaCoincidencia } from '../../components/dominio'
import { Boton, Pantalla, Presionable, Seccion, Tarjeta, Vacio } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { RECETAS_BASE } from '../../lib/catalogo'
import { costeEstimado, escalar, evaluarReceta, construirIndice } from '../../lib/coincidencia'
import { nuevoId, useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { formatearCantidad } from '../../lib/unidades'

function Estrellas({ valor, alElegir }: { valor: number; alElegir?: (v: number) => void }) {
  const { c } = useTema()
  return (
    <View style={{ flexDirection: 'row', gap: space[1] }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Presionable
          key={n}
          onPress={alElegir ? () => alElegir(n) : undefined}
          accessibilityRole="button"
          accessibilityLabel={`${n} de 5`}
          style={{ padding: space[1] }}
        >
          <MaterialCommunityIcons
            name={n <= valor ? 'star' : 'star-outline'}
            size={28}
            color={n <= valor ? c.estaSemanaFill : c.bordeFuerte}
          />
        </Presionable>
      ))}
    </View>
  )
}

export default function DetalleReceta() {
  const { c, t } = useTema()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { estado } = useEstado()
  const acciones = useAcciones()

  const ahora = useMemo(() => new Date(), [])
  const receta = useMemo(
    () => [...RECETAS_BASE, ...estado.recetas].find((r) => r.id === id),
    [id, estado.recetas],
  )

  const [porciones, setPorciones] = useState(receta?.porciones ?? 2)

  const evaluada = useMemo(() => {
    if (!receta) return null
    return evaluarReceta(receta, construirIndice(estado.productos), ahora)
  }, [receta, estado.productos, ahora])

  if (!receta || !evaluada) {
    return (
      <Pantalla titulo="No está">
        <Vacio>Esta receta ya no existe.</Vacio>
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton texto="Volver" variante="contorno" onPress={() => router.back()} />
        </View>
      </Pantalla>
    )
  }

  const preparada = estado.preparadas[receta.id]
  const coste = costeEstimado(evaluada, porciones)
  const faltantes = evaluada.ingredientes.filter((i) => i.estado !== 'tiene')

  function mandarFaltantesALaLista() {
    for (const i of faltantes) {
      acciones.agregarCompra({
        id: nuevoId(),
        nombre: i.ingrediente.nombre,
        cantidad: escalar(i.ingrediente.cantidad, receta!.porciones, porciones),
        unidad: i.ingrediente.unidad,
        comprado: false,
        creadoISO: new Date().toISOString(),
      })
    }
    router.push('/compras')
  }

  function confirmarBorrado() {
    Alert.alert('Borrar receta', `Se borra ${receta!.nombre}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          acciones.borrarReceta(receta!.id)
          router.back()
        },
      },
    ])
  }

  return (
    <Pantalla titulo={receta.nombre} apoyo={receta.descripcion || undefined}>
      <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <InsigniaCoincidencia evaluada={evaluada} />
          {evaluada.aprovecha.length > 0 && (
            <Text style={[t.apoyoMed, { color: c.pronto, flex: 1 }]} numberOfLines={2}>
              Usa {evaluada.aprovecha.map((p) => p.nombre.toLowerCase()).join(', ')}
            </Text>
          )}
        </View>

        {/* Porciones */}
        <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Text style={[t.cuerpo, { color: c.texto2, flex: 1 }]}>Para cuántos</Text>
          <Presionable
            onPress={() => setPorciones((p) => Math.max(1, p - 1))}
            accessibilityRole="button"
            accessibilityLabel="Menos porciones"
            style={{ padding: space[2] }}
          >
            <MaterialCommunityIcons name="minus-circle-outline" size={28} color={c.primario} />
          </Presionable>
          <Text style={[t.cifraM, { color: c.texto, minWidth: 32, textAlign: 'center' }]}>
            {porciones}
          </Text>
          <Presionable
            onPress={() => setPorciones((p) => Math.min(20, p + 1))}
            accessibilityRole="button"
            accessibilityLabel="Más porciones"
            style={{ padding: space[2] }}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={28} color={c.primario} />
          </Presionable>
        </Tarjeta>

        {coste > 0 && (
          <Text style={[t.apoyo, { color: c.texto3 }]}>
            Te cuesta como ${coste.toLocaleString('es-CO')} con los precios que registraste.
          </Text>
        )}
      </View>

      <Seccion titulo="Qué lleva">
        <View style={{ paddingHorizontal: space[5], gap: space[2] }}>
          {evaluada.ingredientes.map((i, n) => {
            // Que falte algo NO es un error, así que no va en rojo: va en piedra. El rojo de
            // esta app está reservado para la comida que ya se perdió.
            const color =
              i.estado === 'tiene' ? c.alcanza : i.estado === 'insuficiente' ? c.estaSemana : c.texto3
            const icono =
              i.estado === 'tiene'
                ? 'check-circle'
                : i.estado === 'insuficiente'
                  ? 'circle-slice-4'
                  : 'circle-outline'

            return (
              <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
                <MaterialCommunityIcons name={icono} size={20} color={color} />
                <Text style={[t.cuerpo, { color: c.texto, flex: 1 }]}>
                  {i.ingrediente.nombre}
                </Text>
                <Text style={[t.apoyoMed, { color: c.texto3 }]}>
                  {formatearCantidad(
                    escalar(i.ingrediente.cantidad, receta.porciones, porciones),
                    i.ingrediente.unidad,
                  )}
                </Text>
              </View>
            )
          })}
        </View>

        {faltantes.length > 0 && (
          <View style={{ paddingHorizontal: space[5], marginTop: space[4] }}>
            <Boton
              texto={faltantes.length === 1 ? 'Mandar lo que falta a la lista' : 'Mandar lo que falta a la lista'}
              icono="cart-plus"
              variante="contorno"
              onPress={mandarFaltantesALaLista}
            />
          </View>
        )}
      </Seccion>

      <Seccion titulo="Cómo se hace">
        <View style={{ paddingHorizontal: space[5], gap: space[3] }}>
          {receta.pasos.map((p) => (
            <View key={p.orden} style={{ flexDirection: 'row', gap: space[3] }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: radius.pill,
                  backgroundColor: c.primarioSuave,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[t.etiqueta, { color: c.primario }]}>{p.orden}</Text>
              </View>
              <Text style={[t.cuerpo, { color: c.texto2, flex: 1 }]}>{p.texto}</Text>
            </View>
          ))}
        </View>
      </Seccion>

      <Seccion titulo={preparada ? 'Ya la hiciste' : 'Cuando la hagas'}>
        <View style={{ paddingHorizontal: space[5], gap: space[3] }}>
          <Boton
            texto="Preparar"
            icono="chef-hat"
            onPress={() =>
              router.push({ pathname: '/receta/preparar', params: { id: receta.id, porciones } })
            }
          />
          <Tarjeta style={{ gap: space[2] }}>
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              {preparada ? 'Qué tal te quedó' : 'Califícala cuando la pruebes'}
            </Text>
            <Estrellas
              valor={preparada?.estrellas ?? 0}
              alElegir={(n) =>
                acciones.marcarPreparada(receta.id, {
                  cuandoISO: new Date().toISOString(),
                  estrellas: n,
                })
              }
            />
          </Tarjeta>

          {receta.origen !== 'base' && (
            <View style={{ flexDirection: 'row', gap: space[3] }}>
              <View style={{ flex: 1 }}>
                <Boton
                  texto="Corregir"
                  icono="pencil-outline"
                  variante="contorno"
                  onPress={() => router.push({ pathname: '/receta/editar', params: { id: receta.id } })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Boton texto="Borrar" icono="delete-outline" variante="texto" onPress={confirmarBorrado} />
              </View>
            </View>
          )}
        </View>
      </Seccion>
    </Pantalla>
  )
}
