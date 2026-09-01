import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { Boton, Chip, Pantalla, Presionable, Selector, Tarjeta } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import { detener, escuchar, hayReconocedor, pedirPermiso } from '../../lib/reconocedor'
import { nuevoId, useAcciones } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { NOMBRE_CATEGORIA } from '../../components/ui'
import { formatearCantidad } from '../../lib/unidades'
import { interpretarDictado } from '../../lib/voz'
import { comoISO, textoCaducidad } from '../../lib/caducidad'
import type { Categoria } from '../../lib/dominio'
import { entenderDictado, ErrorIA, IA_CONFIGURADA, type ProductoEntendido } from '../../lib/ia'
import {
  etiquetaPlazo,
  fechaDesdePlazo,
  PLAZOS,
  plazoMasCercano,
  sugerirParaProducto,
  textoDuracion,
} from '../../lib/vidautil'

/** Pega dos tramos de dictado sin dejar espacios dobles ni un espacio al principio. */
function juntar(previo: string, nuevo: string): string {
  return `${previo} ${nuevo}`.replace(/\s+/g, ' ').trim()
}

export default function Dictar() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const acciones = useAcciones()

  const [escuchando, setEscuchando] = useState(false)
  /**
   * En modo continuo el reconocedor manda un resultado FINAL por cada tramo que consolida,
   * no uno solo al terminar. Si se pisara `texto` con cada uno, dictar cinco productos
   * dejaría solo el último. Por eso lo final se acumula y lo parcial se muestra aparte.
   */
  const [texto, setTexto] = useState('')
  const [parcial, setParcial] = useState('')
  const [problema, setProblema] = useState<string | null>(null)
  /**
   * Plazo puesto a mano para todo lo dictado. `undefined` = cada producto usa lo que la
   * tabla de duraciones calcula para él, que es lo correcto casi siempre.
   */
  const [plazoManual, setPlazoManual] = useState<number | null | undefined>(undefined)
  const cortar = useRef<(() => void) | null>(null)

  const disponible = hayReconocedor()
  const [productos, setProductos] = useState<ProductoEntendido[]>([])
  const [entendiendo, setEntendiendo] = useState(false)
  const [conRespaldo, setConRespaldo] = useState(false)

  /**
   * Convierte lo dictado en productos.
   *
   * LO HACE LA IA, Y NO LA TABLA DEL TELÉFONO. La tabla se quedó corta en cuanto alguien
   * habló normal: con "2 bolsas de leche van para la nevera vencen el 4 de mayo" dejaba
   * «leche van vencen el 4 de mayo» como nombre y, al no entender la fecha, mostraba la
   * duración típica de la leche como si hubiera entendido la dictada. Parecer que entendió
   * es peor que admitir que no.
   *
   * Sin señal cae al parseo local, que para eso sigue existiendo. Se avisa cuando pasa: lo
   * que entienda ahí va a ser más tosco y el usuario tiene que saber por qué.
   */
  async function entender(loDicho: string) {
    const limpio = loDicho.trim()
    if (!limpio) {
      setProductos([])
      setConRespaldo(false)
      return
    }

    if (IA_CONFIGURADA) {
      setEntendiendo(true)
      try {
        setProductos(await entenderDictado(limpio, comoISO(new Date())))
        setConRespaldo(false)
        return
      } catch (err) {
        // Sin red no se anuncia como fallo: se resuelve con lo que hay y se dice.
        if (!(err instanceof ErrorIA) || err.codigo !== 'sin_red') {
          setProblema(err instanceof ErrorIA ? err.message : 'No se entendió. Puedes corregirlo abajo.')
        }
      } finally {
        setEntendiendo(false)
      }
    }

    setProductos(
      interpretarDictado(limpio).map((p) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        unidad: p.unidad,
        categoria: p.categoria ?? null,
        vence: null,
        asumido: p.asumido,
      })),
    )
    setConRespaldo(true)
  }

  useEffect(() => () => cortar.current?.(), [])

  function pararEscucha() {
    detener()
    cortar.current?.()
    cortar.current = null
    // Lo que quedó a medio consolidar también cuenta: cortar justo ahí perdería la última
    // palabra, que suele ser el producto que la persona acaba de sacar de la bolsa.
    const completo = juntar(texto, parcial)
    setTexto(completo)
    setParcial('')
    setEscuchando(false)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    void entender(completo)
  }

  async function empezarEscucha() {
    setProblema(null)
    if (!(await pedirPermiso())) {
      setProblema('Sin permiso del micrófono no puedo oírte. Puedes escribirlo abajo.')
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setParcial('')
    setEscuchando(true)

    cortar.current = escuchar({
      alTexto: (t, definitivo) => {
        // Un tramo consolidado se suma a lo dictado; lo parcial solo se muestra en vivo
        // para que el usuario vea que la app lo está oyendo.
        if (definitivo) {
          setTexto((previo) => juntar(previo, t))
          setParcial('')
        } else {
          setParcial(t)
        }
      },
      // En continuo, `end` llega cuando el sistema corta por su cuenta (batería, otra app).
      // No es lo normal, y lo correcto es reflejarlo en el botón, no perder lo dictado.
      alTerminar: () => setEscuchando(false),
      alFallar: (mensaje) => {
        setProblema(mensaje)
        setEscuchando(false)
      },
    })

    if (!cortar.current) setEscuchando(false)
  }

  function guardar() {
    const ahora = new Date()
    const creadoISO = ahora.toISOString()
    acciones.agregarProductos(
      productos.map((p) => {
        const sugerido = sugerirParaProducto(p.nombre)
        // Tres fuentes, de más explícita a menos: el control en lote, lo que el usuario
        // DIJO, y por último lo que la tabla de duraciones calcula a partir del nombre.
        const caducaISO =
          plazoManual !== undefined
            ? fechaDesdePlazo(plazoManual, ahora)
            : (p.vence ?? fechaDesdePlazo(plazoMasCercano(sugerido.dias), ahora))
        return {
          id: nuevoId(),
          nombre: p.nombre,
          categoria: p.categoria ?? sugerido.categoria,
          cantidad: p.cantidad,
          unidad: p.unidad,
          precioUnitario: 0,
          caducaISO,
          creadoISO,
        }
      }),
    )
    router.back()
  }

  return (
    <Pantalla titulo="Dictar el mercado" apoyo="Con las manos ocupadas, que es como se guarda">
      <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
        {disponible ? (
          /*
            DOS BOTONES DISTINTOS, no uno que alterna. La escucha ya no se corta sola con el
            silencio, así que el usuario tiene que saber sin dudar cuál es el que la
            termina: un botón que cambia de significado bajo el dedo es justo lo que hace
            que alguien lo toque de más y pierda lo que llevaba dictado.
          */
          <Presionable
            onPress={escuchando ? pararEscucha : empezarEscucha}
            accessibilityRole="button"
            accessibilityLabel={escuchando ? 'Ya terminé de dictar' : 'Empezar a dictar'}
            accessibilityState={{ selected: escuchando }}
            style={{
              minHeight: 132,
              borderRadius: radius.md,
              backgroundColor: escuchando ? c.primario : c.tarjeta,
              borderColor: escuchando ? c.primario : c.bordeFuerte,
              borderWidth: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space[2],
              paddingHorizontal: space[4],
            }}
          >
            <MaterialCommunityIcons
              name={escuchando ? 'stop-circle-outline' : 'microphone-outline'}
              size={44}
              color={escuchando ? c.sobreOscuro : c.primario}
            />
            <Text style={[t.boton, { color: escuchando ? c.sobreOscuro : c.primario }]}>
              {escuchando ? 'YA TERMINÉ' : 'TOCA Y DICTA'}
            </Text>
            <Text
              style={[
                t.apoyo,
                { color: escuchando ? c.sobreOscuro : c.texto3, textAlign: 'center' },
              ]}
            >
              {escuchando
                ? 'Sigo oyendo aunque hagas pausas. Puedes decir todo el mercado seguido.'
                : 'Di el producto, la cantidad y, si quieres, cuándo se vence'}
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

        {escuchando && !!parcial && (
          <Tarjeta style={{ borderColor: c.primario }}>
            <Text style={[t.cuerpo, { color: c.texto3, fontStyle: 'italic' }]}>{parcial}…</Text>
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
            placeholder="Dos libras de pollo que se vence en tres días y un litro de leche para la nevera"
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
            Puedes corregirlo aquí. Entiendo la cantidad, dónde va y cuándo se vence:
            «dos bolsas de leche van para la nevera, vencen el 4 de mayo».
          </Text>

          {!escuchando && !!texto.trim() && (
            <View style={{ marginTop: space[3] }}>
              <Boton
                texto={entendiendo ? 'Entendiendo…' : 'Volver a entenderlo'}
                icono="refresh"
                variante="contorno"
                onPress={() => void entender(texto)}
                deshabilitado={entendiendo}
              />
            </View>
          )}
        </View>

        {conRespaldo && productos.length > 0 && (
          <Tarjeta style={{ borderColor: c.estaSemana }}>
            <Text style={[t.apoyo, { color: c.texto2 }]}>
              Sin conexión lo entendí con lo que tengo en el teléfono, así que puede quedar
              más tosco. Revisa los nombres antes de guardar.
            </Text>
          </Tarjeta>
        )}

        {entendiendo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <ActivityIndicator color={c.primario} />
            <Text style={[t.cuerpo, { color: c.texto2 }]}>Entendiendo lo que dijiste…</Text>
          </View>
        )}

        {productos.length > 0 && (
          <View style={{ gap: space[2] }}>
            <Text style={[t.rotulo, { color: c.texto3 }]}>
              {productos.length === 1 ? 'ENTRA 1 PRODUCTO' : `ENTRAN ${productos.length} PRODUCTOS`}
            </Text>
            {productos.map((p, n) => (
              <FilaDictada key={n} producto={p} plazoManual={plazoManual} ahora={new Date()} />
            ))}

            {/*
              Igual que en la factura: la duración va propuesta, no en blanco. Sin fecha el
              reloj de la comida no existe, y nadie entra a editarla producto por producto.
            */}
            <Selector
              etiqueta="Cuánto duran"
              opciones={['__auto__', ...PLAZOS.map((x) => String(x))]}
              valor={plazoManual === undefined ? '__auto__' : String(plazoManual)}
              alElegir={(v) =>
                setPlazoManual(v === '__auto__' ? undefined : v === 'null' ? null : Number(v))
              }
              nombre={(v) =>
                v === '__auto__' ? 'Lo que calcule' : etiquetaPlazo(v === 'null' ? null : Number(v))
              }
            />
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

function FilaDictada({
  producto,
  plazoManual,
  ahora,
}: {
  producto: ProductoEntendido
  plazoManual: number | null | undefined
  ahora: Date
}) {
  const { c, t } = useTema()
  const sugerido = sugerirParaProducto(producto.nombre)
  // Lo que el usuario DIJO se muestra distinto de lo que la app calculó: si dictó "vencen
  // el 4 de mayo", eso es un dato suyo y no una estimación, y merece decirse sin el "como".
  const loDijo = producto.vence !== null
  const duracion =
    plazoManual !== undefined
      ? etiquetaPlazo(plazoManual).toLowerCase()
      : loDijo
        ? textoCaducidad(producto.vence!, ahora)
        : textoDuracion(sugerido.dias)
  const categoria: Categoria = producto.categoria ?? sugerido.categoria

  return (
    <Tarjeta style={{ gap: space[2], padding: space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
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
      </View>
      <Text style={[t.apoyo, { color: loDijo ? c.texto2 : c.texto3 }]}>
        {NOMBRE_CATEGORIA[categoria]} · {duracion}
        {producto.categoria || loDijo ? ' · lo dijiste tú' : ''}
      </Text>
    </Tarjeta>
  )
}
