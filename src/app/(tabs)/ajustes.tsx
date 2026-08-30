import Constants from 'expo-constants'
import { useState } from 'react'
import { Switch, Text, View } from 'react-native'
import { Confirmar } from '../../components/Confirmar'
import { Boton, Pantalla, Seccion, Selector, Tarjeta } from '../../components/ui'
import { space } from '../../constants/tokens'
import { avisoDePrueba, hayAvisos, pedirPermisoAvisos } from '../../lib/avisos'
import { ErrorRespaldo, exportarRespaldo, leerRespaldo } from '../../lib/exportar'
import type { Estado } from '../../lib/acciones'
import { useAcciones, useEstado } from '../../lib/store'
import { cambiarTema, useTema, type PreferenciaTema } from '../../lib/tema'

const NOMBRE_TEMA: Record<PreferenciaTema, string> = {
  sistema: 'El del sistema',
  claro: 'Claro',
  oscuro: 'Oscuro',
}

const DIAS = [1, 2, 3, 5, 7] as const

export default function Ajustes() {
  const { c, t, preferencia } = useTema()
  const { estado, borrarTodo, restaurar } = useEstado()
  const acciones = useAcciones()
  const [probando, setProbando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [aviso, setAviso] = useState<{ titulo: string; cuerpo: string } | null>(null)
  /** El respaldo leído, esperando confirmación: reemplaza TODO lo que hay ahora. */
  const [porRestaurar, setPorRestaurar] = useState<Estado | null>(null)

  const avisosDisponibles = hayAvisos()

  async function alternarAvisos(activar: boolean) {
    if (activar && !(await pedirPermisoAvisos())) {
      setAviso({
        titulo: 'Falta el permiso',
        cuerpo: 'Android tiene que dejar que la app te avise. Puedes activarlo en los ajustes del teléfono, en la sección de notificaciones.',
      })
      return
    }
    acciones.guardarAjustes({ avisarCaducidad: activar })
  }

  async function probar() {
    setProbando(true)
    const ok = await avisoDePrueba()
    setProbando(false)
    if (!ok) {
      setAviso({
        titulo: 'No se pudo mandar el aviso',
        cuerpo: 'Revisa que los avisos estén permitidos en los ajustes del teléfono.',
      })
    }
  }

  async function respaldar() {
    try {
      await exportarRespaldo(estado)
    } catch {
      setAviso({ titulo: 'No se pudo guardar', cuerpo: 'Intenta de nuevo.' })
    }
  }

  async function restaurarDeArchivo() {
    try {
      const recuperado = await leerRespaldo()
      if (!recuperado) return

      setPorRestaurar(recuperado)
    } catch (err) {
      setAviso({
        titulo: 'No se pudo restaurar',
        cuerpo: err instanceof ErrorRespaldo ? err.message : 'Intenta de nuevo.',
      })
    }
  }


  return (
    <Pantalla titulo="Yo" apoyo="Ajustes de la app">
      <Seccion titulo="Avisos de caducidad">
        <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
          <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <View style={{ flex: 1 }}>
              <Text style={[t.cuerpoMed, { color: c.texto }]}>Avisarme antes</Text>
              <Text style={[t.apoyo, { color: c.texto3 }]}>
                Un solo aviso al día, a las 6 de la tarde
              </Text>
            </View>
            <Switch
              value={estado.ajustes.avisarCaducidad}
              onValueChange={(v) => void alternarAvisos(v)}
              trackColor={{ true: c.primario, false: c.bordeFuerte }}
              thumbColor={c.tarjeta}
              accessibilityLabel="Avisarme antes de que algo se venza"
            />
          </Tarjeta>

          {estado.ajustes.avisarCaducidad && (
            <>
              <Selector
                etiqueta="Con cuánta anticipación"
                opciones={DIAS.map(String) as unknown as readonly string[]}
                valor={String(estado.ajustes.diasAviso)}
                alElegir={(v) => acciones.guardarAjustes({ diasAviso: Number(v) })}
                nombre={(v) => (v === '1' ? '1 día' : `${v} días`)}
              />

              <Boton
                texto={probando ? 'Espera 5 segundos…' : 'Probar un aviso'}
                icono="bell-outline"
                variante="contorno"
                onPress={probar}
                deshabilitado={probando}
              />
            </>
          )}

          {/*
            Decirlo es lo correcto: sin esto el usuario cree que los avisos funcionan en
            desarrollo, no le llegan, y concluye que la app está rota.
          */}
          {!avisosDisponibles && (
            <Text style={[t.apoyo, { color: c.texto3 }]}>
              Los avisos no funcionan dentro de Expo Go en Android. En la app instalada sí.
            </Text>
          )}
        </View>
      </Seccion>

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
              app, se pierde — por eso el respaldo lo tienes que guardar tú.
            </Text>
          </Tarjeta>

          <View style={{ gap: space[3], marginTop: space[4] }}>
            <Boton
              texto="Guardar un respaldo"
              icono="content-save-outline"
              variante="contorno"
              onPress={respaldar}
            />
            <Boton
              texto="Restaurar de un respaldo"
              icono="backup-restore"
              variante="texto"
              onPress={restaurarDeArchivo}
            />
          </View>
        </View>
      </Seccion>

      <Seccion titulo="Empezar de cero">
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton
            texto="Borrar todo"
            icono="delete-outline"
            variante="contorno"
            onPress={() => setConfirmandoBorrado(true)}
          />
        </View>
      </Seccion>

      <View style={{ paddingHorizontal: space[5], marginTop: space[8] }}>
        <Text style={[t.apoyo, { color: c.texto3, textAlign: 'center' }]}>
          Cocina a Mano {Constants.expoConfig?.version ?? ''}
        </Text>
      </View>

      <Confirmar
        visible={confirmandoBorrado}
        titulo="Borrar todo y empezar de cero"
        cuerpo={`Se borran ${estado.productos.length} productos de la despensa, ${estado.recetas.length} recetas tuyas y ${estado.compras.length} cosas de la lista. Como nada se sube a ningún lado, esto no se puede deshacer — a menos que tengas un respaldo guardado.`}
        textoConfirmar="Borrar todo"
        onConfirmar={() => {
          setConfirmandoBorrado(false)
          void borrarTodo()
        }}
        onCancelar={() => setConfirmandoBorrado(false)}
      />

      {/* Restaurar TAMBIÉN destruye: pisa lo que hay ahora. Va con el mismo marco. */}
      <Confirmar
        visible={porRestaurar !== null}
        icono="backup-restore"
        titulo="Restaurar el respaldo"
        cuerpo={
          porRestaurar
            ? `El respaldo trae ${porRestaurar.productos.length} productos y ${porRestaurar.recetas.length} recetas tuyas, y reemplaza lo que tienes ahora: ${estado.productos.length} productos y ${estado.recetas.length} recetas.`
            : ''
        }
        textoConfirmar="Reemplazar lo de ahora"
        onConfirmar={() => {
          if (porRestaurar) restaurar(porRestaurar)
          setPorRestaurar(null)
        }}
        onCancelar={() => setPorRestaurar(null)}
      />

      <Confirmar
        soloAviso
        visible={aviso !== null}
        icono="information-outline"
        titulo={aviso?.titulo ?? ''}
        cuerpo={aviso?.cuerpo ?? ''}
        textoConfirmar=""
        onConfirmar={() => setAviso(null)}
        onCancelar={() => setAviso(null)}
      />
    </Pantalla>
  )
}
