import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { TarjetaReceta } from '../../components/dominio'
import { Boton, Pantalla, Selector, Vacio } from '../../components/ui'
import { space } from '../../constants/tokens'
import { RECETAS_BASE } from '../../lib/catalogo'
import { evaluarRecetas } from '../../lib/coincidencia'
import { useEstado } from '../../lib/store'
import { useTema } from '../../lib/tema'

type Filtro = 'todo' | 'alcanza' | 'falta1' | 'falta2'

const NOMBRE_FILTRO: Record<Filtro, string> = {
  todo: 'Todas',
  alcanza: 'Me alcanza',
  falta1: 'Me falta 1',
  falta2: 'Me faltan 2',
}

export default function Cocinar() {
  const { c, t } = useTema()
  const router = useRouter()
  const { estado } = useEstado()
  const [filtro, setFiltro] = useState<Filtro>('todo')

  const ahora = useMemo(() => new Date(), [])

  const evaluadas = useMemo(
    () => evaluarRecetas([...RECETAS_BASE, ...estado.recetas], estado.productos, ahora),
    [estado.recetas, estado.productos, ahora],
  )

  const alcanzan = evaluadas.filter((e) => e.total === e.cubiertos).length

  const visibles = useMemo(() => {
    if (filtro === 'todo') return evaluadas
    return evaluadas.filter((e) => {
      const faltan = e.total - e.cubiertos
      if (filtro === 'alcanza') return faltan === 0
      if (filtro === 'falta1') return faltan === 1
      return faltan === 2
    })
  }, [evaluadas, filtro])

  const sinDespensa = estado.productos.length === 0

  return (
    <Pantalla titulo="Qué cocino">
      {/*
        El único número que importa, y va grande. Con la despensa vacía no se muestra un
        cero: no informa de nada y ocupa el mejor espacio de la pantalla.
      */}
      {!sinDespensa && (
        <View
          style={{
            paddingHorizontal: space[5],
            marginBottom: space[5],
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: space[3],
          }}
        >
          <Text style={[t.cifraXL, { color: alcanzan > 0 ? c.alcanza : c.texto3 }]}>
            {alcanzan}
          </Text>
          <Text style={[t.cuerpo, { color: c.texto2, flex: 1 }]}>
            {alcanzan === 1 ? 'receta te alcanza completa' : 'recetas te alcanzan completas'}
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
            <Selector
              opciones={['todo', 'alcanza', 'falta1', 'falta2'] as const}
              valor={filtro}
              alElegir={setFiltro}
              nombre={(f) => NOMBRE_FILTRO[f]}
            />
          </View>

          {visibles.length === 0 ? (
            <Vacio>Nada en este filtro. Prueba con «Todas».</Vacio>
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

      <View style={{ paddingHorizontal: space[5], marginTop: space[4] }}>
        <Boton
          texto="Escribir una receta"
          icono="notebook-plus-outline"
          variante="contorno"
          onPress={() => router.push('/receta/editar')}
        />
      </View>
    </Pantalla>
  )
}
