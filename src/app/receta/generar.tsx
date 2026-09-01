import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Switch, Text, View } from 'react-native'
import { Boton, Campo, Pantalla, Selector, Tarjeta, Vacio } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { estadoDeCaducidad, PESO_RELOJ, textoCaducidad } from '../../lib/caducidad'
import type { Receta } from '../../lib/dominio'
import { ErrorIA, generarReceta, IA_CONFIGURADA } from '../../lib/ia'
import { nuevoId, useAcciones, useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { formatearCantidad } from '../../lib/unidades'

type Fase = 'parametros' | 'generando' | 'resultado'

const TIPOS = ['cualquiera', 'desayuno', 'almuerzo', 'cena', 'sopa', 'postre', 'algo rápido'] as const
const COCINAS = ['cualquiera', 'colombiana', 'italiana', 'mexicana', 'asiática', 'peruana'] as const

/**
 * Cuántos ingredientes se le mandan a la IA.
 *
 * No la despensa entera: con cuarenta productos el modelo se dispersa y propone platos que
 * usan tres cosas al azar. Con los quince más urgentes, propone algo que de verdad gasta lo
 * que se está por perder.
 */
const MAXIMO_INGREDIENTES = 15

export default function GenerarReceta() {
  const { c, t } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const acciones = useAcciones()

  const [fase, setFase] = useState<Fase>('parametros')
  const [porciones, setPorciones] = useState('2')
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('cualquiera')
  const [cocina, setCocina] = useState<(typeof COCINAS)[number]>('colombiana')
  const [vegana, setVegana] = useState(false)
  const [contexto, setContexto] = useState('')
  const [receta, setReceta] = useState<Receta | null>(null)
  const [problema, setProblema] = useState<string | null>(null)

  const ahora = useMemo(() => new Date(), [])

  /**
   * Lo que se le manda, ORDENADO POR URGENCIA.
   *
   * Es la diferencia entre "una receta con lo que tengo" y la tesis del producto: lo que se
   * está por perder va primero, para que el modelo construya el plato alrededor de eso. Sin
   * este orden, generar una receta sería lo mismo que buscar en Google.
   */
  const paraLaIA = useMemo(() => {
    return [...estado.productos]
      // Lo ya vencido NO se manda: `coincidencia.ts` lo excluye de `aprovecha` porque
      // proponer cocinarlo sería un mal consejo, y aquí además gastaría el cupo de quince.
      .filter((p) => p.cantidad > 0 && estadoDeCaducidad(p.caducaISO, ahora) !== 'vencido')
      .sort((a, b) => {
        const ua = PESO_RELOJ[estadoDeCaducidad(a.caducaISO, ahora)]
        const ub = PESO_RELOJ[estadoDeCaducidad(b.caducaISO, ahora)]
        if (ua !== ub) return ua - ub
        return a.nombre.localeCompare(b.nombre, 'es')
      })
      .slice(0, MAXIMO_INGREDIENTES)
  }, [estado.productos, ahora])

  /** Lo que urge de verdad, para decirlo en el prompt y en la pantalla. */
  const urgentes = paraLaIA.filter((p) => {
    const e = estadoDeCaducidad(p.caducaISO, ahora)
    return e === 'pronto' || e === 'estaSemana'
  })

  async function generar() {
    setFase('generando')
    setProblema(null)

    const notas = [contexto.trim()]
    if (urgentes.length > 0) {
      // Se le dice explícitamente qué hay que gastar. El orden de la lista ya lo sugiere,
      // pero decirlo con palabras es lo que hace que el modelo lo use de verdad.
      notas.push(
        `Da prioridad a usar ${urgentes.map((p) => p.nombre).join(', ')}, que están por vencerse.`,
      )
    }

    try {
      const generada = await generarReceta(
        {
          ingredientes: paraLaIA.map((p) => ({ nombre: p.nombre, unidad: p.unidad })),
          porciones: Number(porciones) || 2,
          tipoPlato: tipo === 'cualquiera' ? undefined : tipo,
          cocina: cocina === 'cualquiera' ? undefined : cocina,
          vegana,
          contexto: notas.filter(Boolean).join(' ') || undefined,
        },
        nuevoId(),
      )
      setReceta(generada)
      setFase('resultado')
    } catch (err) {
      setProblema(err instanceof ErrorIA ? err.message : 'Algo salió mal. Intenta de nuevo.')
      setFase('parametros')
    }
  }

  if (!IA_CONFIGURADA) {
    return (
      <Pantalla titulo="Inventar una receta">
        <Vacio>
          Esta función todavía no está disponible en tu versión. Puedes escribir tus propias
          recetas y la app las va a contar igual en «Qué cocino».
        </Vacio>
        <View style={{ paddingHorizontal: space[5], gap: space[3] }}>
          <Boton
            texto="Escribir una receta"
            icono="notebook-plus-outline"
            onPress={() => router.replace('/receta/editar')}
          />
          <Boton texto="Volver" variante="texto" onPress={() => router.back()} />
        </View>
      </Pantalla>
    )
  }

  if (fase === 'generando') {
    return (
      <Pantalla titulo="Inventando" desplazable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4] }}>
          <ActivityIndicator size="large" color={c.primario} />
          <Text style={[t.cuerpo, { color: c.texto2, textAlign: 'center', paddingHorizontal: space[6] }]}>
            Buscando algo que se pueda hacer con lo que tienes. Toma unos segundos.
          </Text>
        </View>
      </Pantalla>
    )
  }

  if (fase === 'resultado' && receta) {
    return (
      <Pantalla titulo={receta.nombre} apoyo={receta.descripcion || undefined}>
        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          {/*
            Se avisa ANTES de guardar, no después. La IA propone cantidades y tiempos que
            pueden estar mal, y los términos de uso lo dicen: es la sugerencia de alguien que
            no está en tu cocina.
          */}
          <Tarjeta style={{ borderColor: c.estaSemana, gap: space[2] }}>
            <Text style={[t.cuerpoMed, { color: c.estaSemana }]}>Esto lo inventó la IA</Text>
            <Text style={[t.apoyo, { color: c.texto2 }]}>
              Revisa las cantidades y los tiempos antes de fiarte. Si tienes alguna alergia,
              lee siempre el empaque: esto no es una fuente confiable para eso.
            </Text>
          </Tarjeta>

          <Text style={[t.apoyo, { color: c.texto3 }]}>
            Para {receta.porciones} {receta.porciones === 1 ? 'persona' : 'personas'}
            {receta.cocina ? ` · ${receta.cocina}` : ''}
          </Text>

          <View style={{ gap: space[2] }}>
            <Text style={[t.rotulo, { color: c.texto3 }]}>QUÉ LLEVA</Text>
            {receta.ingredientes.map((i, n) => (
              <View key={n} style={{ flexDirection: 'row', gap: space[3] }}>
                <Text style={[t.cuerpo, { color: c.texto, flex: 1 }]}>{i.nombre}</Text>
                <Text style={[t.apoyoMed, { color: c.texto3 }]}>
                  {formatearCantidad(i.cantidad, i.unidad)}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ gap: space[3] }}>
            <Text style={[t.rotulo, { color: c.texto3 }]}>CÓMO SE HACE</Text>
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

          <View style={{ gap: space[3], marginTop: space[4] }}>
            <Boton
              texto="Guardarla"
              icono="check"
              onPress={() => {
                acciones.agregarReceta(receta)
                router.replace(`/receta/${receta.id}`)
              }}
            />
            <Boton texto="Que invente otra" icono="refresh" variante="contorno" onPress={generar} />
            <Boton texto="Descartar" variante="texto" onPress={() => router.back()} />
          </View>
        </View>
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="Inventar una receta" apoyo="Con lo que ya tienes en la despensa">
      <View style={{ paddingHorizontal: space[5], gap: space[5] }}>
        {paraLaIA.length === 0 ? (
          <Vacio>
            Tu despensa está vacía, así que no hay con qué inventar nada. Carga el mercado y
            vuelve.
          </Vacio>
        ) : (
          <>
            <Tarjeta style={{ gap: space[3] }}>
              <Text style={[t.cuerpoMed, { color: c.texto }]}>
                Voy a usar {paraLaIA.length} de tus {estado.productos.length}
              </Text>
              <Text style={[t.apoyo, { color: c.texto3 }]}>
                {paraLaIA.map((p) => p.nombre).join(', ')}
              </Text>

              {/* El conector con la tesis del producto, dicho en la pantalla. */}
              {urgentes.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={16} color={c.pronto} />
                  <Text style={[t.apoyoMed, { color: c.pronto, flex: 1 }]}>
                    Le voy a pedir que gaste {urgentes.map((p) => p.nombre.toLowerCase()).join(', ')}
                    {urgentes.length === 1 ? ', que se está por vencer' : ', que se están por vencer'}
                  </Text>
                </View>
              )}
            </Tarjeta>

            {!!problema && (
              <Tarjeta style={{ borderColor: c.vencido }}>
                <Text style={[t.cuerpoMed, { color: c.vencido }]}>{problema}</Text>
              </Tarjeta>
            )}

            <Campo
              etiqueta="Para cuántos"
              valor={porciones}
              alCambiar={setPorciones}
              teclado="numeric"
              estilo={{ width: 110 }}
            />

            <Selector etiqueta="Qué comida" opciones={TIPOS} valor={tipo} alElegir={setTipo} />
            <Selector etiqueta="De qué cocina" opciones={COCINAS} valor={cocina} alElegir={setCocina} />

            <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
              <View style={{ flex: 1 }}>
                <Text style={[t.cuerpoMed, { color: c.texto }]}>Que sea vegana</Text>
                <Text style={[t.apoyo, { color: c.texto3 }]}>Sin nada de origen animal</Text>
              </View>
              <Switch
                value={vegana}
                onValueChange={setVegana}
                trackColor={{ true: c.primario, false: c.bordeFuerte }}
                thumbColor={c.tarjeta}
                accessibilityLabel="Que sea vegana"
              />
            </Tarjeta>

            <Campo
              etiqueta="Algo más que quieras pedirle (opcional)"
              valor={contexto}
              alCambiar={setContexto}
              placeholder="Sin picante, para llevar al trabajo…"
            />

            <View style={{ gap: space[3], marginTop: space[2] }}>
              <Boton texto="Inventar" icono="chef-hat" onPress={generar} />
              <Boton texto="Cancelar" variante="texto" onPress={() => router.back()} />
            </View>
          </>
        )}
      </View>
    </Pantalla>
  )
}
