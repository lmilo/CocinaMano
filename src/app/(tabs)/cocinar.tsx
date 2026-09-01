import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { TarjetaReceta } from '../../components/dominio'
import { Boton, Pantalla, Presionable, Vacio } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { RECETAS_BASE } from '../../lib/catalogo'
import { evaluarRecetas, type RecetaEvaluada } from '../../lib/coincidencia'
import { useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { palabras, raices } from '../../lib/texto'

type Filtro = 'todo' | 'alcanza' | 'falta1' | 'falta2'

const NOMBRE_FILTRO: Record<Filtro, string> = {
  todo: 'Todas',
  alcanza: 'Me alcanza',
  falta1: 'Me falta 1',
  falta2: 'Me faltan 2',
}

function cumple(e: RecetaEvaluada, filtro: Filtro): boolean {
  const faltan = e.total - e.cubiertos
  if (filtro === 'todo') return true
  if (filtro === 'alcanza') return faltan === 0
  if (filtro === 'falta1') return faltan === 1
  return faltan === 2
}

/**
 * Busca por nombre y por ingrediente.
 *
 * Por ingrediente porque es la mitad de la pregunta real: uno no busca "ajiaco", busca
 * "qué hago con el pollo". Se usa el mismo emparejado por raíz del match, así que "papas"
 * encuentra la receta que pide "papa".
 */
function coincideBusqueda(e: RecetaEvaluada, consulta: string): boolean {
  const buscadas = palabras(consulta)
  if (buscadas.length === 0) return true

  const propias = new Set<string>()
  for (const p of palabras(e.receta.nombre)) for (const r of raices(p)) propias.add(r)
  for (const i of e.receta.ingredientes) {
    for (const p of palabras(i.nombre)) for (const r of raices(p)) propias.add(r)
  }

  // Todas las palabras buscadas tienen que aparecer: "pollo arroz" busca las dos, no
  // cualquiera de las dos, que es lo que la gente espera al escribir dos cosas.
  return buscadas.every((b) => raices(b).some((r) => propias.has(r)))
}

export default function Cocinar() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const [filtro, setFiltro] = useState<Filtro>('todo')
  const [consulta, setConsulta] = useState('')

  const ahora = useMemo(() => new Date(), [])

  const evaluadas = useMemo(
    () => evaluarRecetas([...RECETAS_BASE, ...estado.recetas], estado.productos, ahora),
    [estado.recetas, estado.productos, ahora],
  )

  /** La búsqueda recorta ANTES de contar: los números de los filtros hablan de lo buscado. */
  const buscadas = useMemo(
    () => evaluadas.filter((e) => coincideBusqueda(e, consulta)),
    [evaluadas, consulta],
  )

  const cuantas = useMemo(() => {
    const n: Record<Filtro, number> = { todo: 0, alcanza: 0, falta1: 0, falta2: 0 }
    for (const e of buscadas) {
      for (const f of ['todo', 'alcanza', 'falta1', 'falta2'] as Filtro[]) {
        if (cumple(e, f)) n[f]++
      }
    }
    return n
  }, [buscadas])

  const visibles = useMemo(() => buscadas.filter((e) => cumple(e, filtro)), [buscadas, filtro])

  const sinDespensa = estado.productos.length === 0
  const buscando = consulta.trim().length > 0

  return (
    <Pantalla titulo="Qué cocino">
      {/*
        Escribir una receta va ARRIBA, no al final. Estaba debajo de la lista completa, y
        con cincuenta recetas eso son cincuenta tarjetas de desplazamiento para alcanzar un
        botón que se usa justo cuando la lista no te sirvió.
      */}
      <View
        style={{
          paddingHorizontal: space[5],
          marginBottom: space[5],
          flexDirection: 'row',
          gap: space[2],
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[2],
            backgroundColor: c.tarjeta,
            borderColor: c.bordeFuerte,
            borderWidth: 1,
            borderRadius: radius.lg,
            paddingHorizontal: space[3],
            minHeight: tq.min,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={c.texto3} />
          <TextInput
            value={consulta}
            onChangeText={setConsulta}
            placeholder="Buscar receta o ingrediente"
            placeholderTextColor={c.texto3}
            accessibilityLabel="Buscar receta o ingrediente"
            returnKeyType="search"
            style={[t.cuerpo, { flex: 1, color: c.texto, paddingVertical: space[2] }]}
          />
          {buscando && (
            <Presionable
              onPress={() => setConsulta('')}
              accessibilityRole="button"
              accessibilityLabel="Borrar la búsqueda"
              style={{ padding: space[1] }}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={c.texto3} />
            </Presionable>
          )}
        </View>

        {/*
          Inventar va antes que escribir: es lo que resuelve el momento en que la lista no
          te sirvió, que es justo cuando alguien mira hacia aquí arriba.
        */}
        <Presionable
          onPress={() => router.push('/receta/generar')}
          accessibilityRole="button"
          accessibilityLabel="Que la IA invente una receta con lo que tengo"
          style={{
            width: tq.min,
            minHeight: tq.min,
            borderRadius: radius.lg,
            backgroundColor: c.primario,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="chef-hat" size={22} color={c.sobreOscuro} />
        </Presionable>

        <Presionable
          onPress={() => router.push('/receta/editar')}
          accessibilityRole="button"
          accessibilityLabel="Escribir una receta"
          style={{
            width: tq.min,
            minHeight: tq.min,
            borderRadius: radius.lg,
            backgroundColor: c.tarjeta,
            borderColor: c.bordeFuerte,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="notebook-plus-outline" size={22} color={c.primario} />
        </Presionable>
      </View>

      {/* El número grande solo cuando no se está buscando: buscando, la cifra que importa
          es cuántas salieron, y esa ya la dicen los filtros. */}
      {!sinDespensa && !buscando && (
        <View
          style={{
            paddingHorizontal: space[5],
            marginBottom: space[5],
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: space[3],
          }}
        >
          <Text style={[t.cifraXL, { color: cuantas.alcanza > 0 ? c.alcanza : c.texto3 }]}>
            {cuantas.alcanza}
          </Text>
          <Text style={[t.cuerpo, { color: c.texto2, flex: 1 }]}>
            {cuantas.alcanza === 1 ? 'receta te alcanza completa' : 'recetas te alcanzan completas'}
          </Text>
        </View>
      )}

      {sinDespensa ? (
        <Vacio>
          Carga tu despensa y aquí aparece, en orden, lo que puedes preparar hoy — empezando
          por lo que usa lo que se está por vencer.
        </Vacio>
      ) : (
        <>
          <View style={{ paddingHorizontal: space[5], marginBottom: space[4] }}>
            <FiltrosConCuenta filtro={filtro} alElegir={setFiltro} cuantas={cuantas} />
          </View>

          {visibles.length === 0 ? (
            <>
              <Vacio>
                {buscando
                  ? `Nada con «${consulta.trim()}». Prueba con otra palabra, o con el nombre de un ingrediente.`
                  : 'Nada en este filtro. Prueba con «Todas».'}
              </Vacio>
              <View style={{ paddingHorizontal: space[5] }}>
                <Boton
                  texto="Que inventen una con lo que tengo"
                  icono="chef-hat"
                  variante="contorno"
                  onPress={() => router.push('/receta/generar')}
                />
              </View>
            </>
          ) : (
            visibles.map((e) => (
              <TarjetaReceta
                key={e.receta.id}
                evaluada={e}
                ahora={ahora}
                alTocar={() => router.push(`/receta/${e.receta.id}`)}
              />
            ))
          )}
        </>
      )}
    </Pantalla>
  )
}

/**
 * Los filtros, cada uno con cuántas recetas caen ahí.
 *
 * El número evita el peor momento de un filtro: tocarlo, encontrarlo vacío y tener que
 * volver. Y de paso dice dónde está lo accionable — "Me falta 1" con un 7 al lado es una
 * invitación mucho más clara que la palabra sola.
 */
function FiltrosConCuenta({
  filtro,
  alElegir,
  cuantas,
}: {
  filtro: Filtro
  alElegir: (f: Filtro) => void
  cuantas: Record<Filtro, number>
}) {
  const { c, t, tq } = useTema()
  const opciones: Filtro[] = ['todo', 'alcanza', 'falta1', 'falta2']

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
      {opciones.map((o) => {
        const activo = o === filtro
        const n = cuantas[o]
        return (
          <Presionable
            key={o}
            onPress={() => alElegir(o)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${NOMBRE_FILTRO[o]}, ${n} ${n === 1 ? 'receta' : 'recetas'}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[2],
              backgroundColor: activo ? c.primario : c.tarjeta,
              borderColor: activo ? c.primario : c.bordeFuerte,
              borderWidth: 1,
              borderRadius: radius.pill,
              paddingHorizontal: space[4],
              minHeight: tq.chip,
              // Un filtro vacío se apaga en vez de desaparecer: que cambie el juego de
              // opciones bajo el dedo es peor que ver un cero.
              opacity: n === 0 && !activo ? 0.45 : 1,
            }}
          >
            <Text style={[t.apoyoMed, { color: activo ? c.sobreOscuro : c.texto2 }]}>
              {NOMBRE_FILTRO[o]}
            </Text>
            <Text style={[t.etiqueta, { color: activo ? c.sobreOscuro : c.texto3 }]}>{n}</Text>
          </Presionable>
        )
      })}
    </View>
  )
}
