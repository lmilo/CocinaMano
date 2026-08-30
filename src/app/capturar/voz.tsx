import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { Boton, Chip, Pantalla, Presionable, Tarjeta } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { detener, escuchar, hayReconocedor, pedirPermiso } from '../../lib/reconocedor'
import { nuevoId, useAcciones } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { formatearCantidad } from '../../lib/unidades'
import { interpretarDictado, type ProductoDictado } from '../../lib/voz'

export default function Dictar() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const acciones = useAcciones()

  const [escuchando, setEscuchando] = useState(false)
  const [texto, setTexto] = useState('')
  const [problema, setProblema] = useState<string | null>(null)
  const cortar = useRef<(() => void) | null>(null)

  const disponible = hayReconocedor()
  const productos = interpretarDictado(texto)

  useEffect(() => () => cortar.current?.(), [])

  async function alternarEscucha() {
    if (escuchando) {
      detener()
      setEscuchando(false)
      return
    }

    setProblema(null)
    if (!(await pedirPermiso())) {
      setProblema('Sin permiso del micrófono no puedo oírte. Puedes escribirlo abajo.')
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setTexto('')
    setEscuchando(true)

    cortar.current = escuchar({
      alTexto: (t, definitivo) => {
        setTexto(t)
        if (definitivo) setEscuchando(false)
      },
      alTerminar: () => setEscuchando(false),
      alFallar: (mensaje) => {
        setProblema(mensaje)
        setEscuchando(false)
      },
    })

    if (!cortar.current) setEscuchando(false)
  }

  function guardar() {
    const ahora = new Date().toISOString()
    acciones.agregarProductos(
      productos.map((p) => ({
        id: nuevoId(),
        nombre: p.nombre,
        categoria: 'despensa' as const,
        cantidad: p.cantidad,
        unidad: p.unidad,
        precioUnitario: 0,
        caducaISO: null,
        creadoISO: ahora,
      })),
    )
    router.back()
  }

  return (
    <Pantalla titulo="Dictar el mercado" apoyo="Con las manos ocupadas, que es como se guarda">
      <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
        {disponible ? (
          <Presionable
            onPress={alternarEscucha}
            accessibilityRole="button"
            accessibilityLabel={escuchando ? 'Dejar de oír' : 'Empezar a dictar'}
            accessibilityState={{ selected: escuchando }}
            style={{
              minHeight: 120,
              borderRadius: radius.md,
              backgroundColor: escuchando ? c.primario : c.tarjeta,
              borderColor: escuchando ? c.primario : c.bordeFuerte,
              borderWidth: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space[2],
            }}
          >
            <MaterialCommunityIcons
              name={escuchando ? 'microphone' : 'microphone-outline'}
              size={44}
              color={escuchando ? c.sobreOscuro : c.primario}
            />
            <Text style={[t.cuerpoMed, { color: escuchando ? c.sobreOscuro : c.primario }]}>
              {escuchando ? 'Te estoy oyendo…' : 'Toca y dicta'}
            </Text>
          </Presionable>
        ) : (
          <Tarjeta>
            <Text style={[t.cuerpo, { color: c.texto2 }]}>
              El dictado no está disponible en este teléfono, pero puedes escribirlo abajo
              igual de rápido.
            </Text>
          </Tarjeta>
        )}

        {!!problema && (
          <Tarjeta style={{ borderColor: c.estaSemana }}>
            <Text style={[t.cuerpoMed, { color: c.estaSemana }]}>{problema}</Text>
          </Tarjeta>
        )}

        <View>
          <Text style={[t.rotulo, { color: c.texto3, marginBottom: space[2] }]}>
            {disponible ? 'LO QUE ENTENDÍ' : 'ESCRÍBELO'}
          </Text>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            multiline
            placeholder="Dos libras de arroz y una docena de huevos"
            placeholderTextColor={c.texto3}
            accessibilityLabel="Lo que dictaste"
            style={[
              t.cuerpo,
              {
                color: c.texto,
                backgroundColor: c.tarjeta,
                borderColor: c.bordeFuerte,
                borderWidth: 1,
                borderRadius: radius.lg,
                paddingHorizontal: space[4],
                paddingVertical: space[3],
                minHeight: tq.min + space[4],
              },
            ]}
          />
          <Text style={[t.apoyo, { color: c.texto3, marginTop: space[2] }]}>
            Puedes corregirlo aquí antes de guardar.
          </Text>
        </View>

        {productos.length > 0 && (
          <View style={{ gap: space[2] }}>
            <Text style={[t.rotulo, { color: c.texto3 }]}>
              {productos.length === 1 ? 'ENTRA 1 PRODUCTO' : `ENTRAN ${productos.length} PRODUCTOS`}
            </Text>
            {productos.map((p, n) => (
              <FilaDictada key={n} producto={p} />
            ))}
          </View>
        )}

        <View style={{ gap: space[3], marginTop: space[2] }}>
          <Boton
            texto={
              productos.length === 0
                ? 'Guardar'
                : `Guardar ${productos.length} en la despensa`
            }
            icono="check"
            onPress={guardar}
            deshabilitado={productos.length === 0}
          />
          <Boton texto="Cancelar" variante="texto" onPress={() => router.back()} />
        </View>
      </View>
    </Pantalla>
  )
}

function FilaDictada({ producto }: { producto: ProductoDictado }) {
  const { c, t } = useTema()
  return (
    <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3] }}>
      <Text style={[t.cuerpo, { color: c.texto, flex: 1 }]}>{producto.nombre}</Text>
      {/*
        Cuando no se dijo la cantidad se asume 1 y SE DICE que se asumió, en vez de dejar un
        "1 unidad" que parece dato y no lo es.
      */}
      {producto.asumido ? (
        <Chip texto="1, supongo" icono="help-circle-outline" color={c.texto2} fondo={c.tarjetaAlt} />
      ) : (
        <Text style={[t.apoyoMed, { color: c.texto3 }]}>
          {formatearCantidad(producto.cantidad, producto.unidad)}
        </Text>
      )}
    </Tarjeta>
  )
}
