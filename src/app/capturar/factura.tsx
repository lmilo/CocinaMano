import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { Boton, Chip, Pantalla, Presionable, Selector, Tarjeta, Vacio } from '../../components/ui'
import { radius, space } from '../../constants/tokens'
import type { Categoria, Unidad } from '../../lib/dominio'
import { ErrorIA, IA_CONFIGURADA, leerFactura, type ProductoLeido } from '../../lib/ia'
import { nuevoId, useAcciones } from '../../lib/store'
import { useTema } from '../../lib/tema'
import { abreviar, UNIDADES } from '../../lib/unidades'
import {
  etiquetaPlazo,
  fechaDesdePlazo,
  PLAZOS,
  plazoMasCercano,
  sugerirParaProducto,
} from '../../lib/vidautil'

type Fase = 'inicio' | 'leyendo' | 'revision'

/**
 * Una línea de la revisión: lo que leyó la IA más lo que la app propone.
 *
 * El plazo y la categoría NO vienen del modelo: salen de la tabla de duraciones típicas de
 * `vidautil.ts`, en local. Sin esto todo entraba sin fecha y a la categoría "despensa", y
 * el reloj de la comida —que es la tesis del producto— quedaba muerto salvo que el usuario
 * editara los ocho productos uno por uno.
 */
type EnRevision = ProductoLeido & {
  categoria: Categoria
  /** Días hasta que se vence. `null` = no se vence. */
  plazo: number | null
}

/**
 * La foto se comprime ANTES de mandarla.
 *
 * Una foto de celular sin comprimir son 4 MB, que en base64 pasan de 5 y hacen la subida
 * eterna con datos móviles — que es exactamente donde se va a usar esto: en la caja del
 * supermercado o en el carro. A 0,5 de calidad un recibo se sigue leyendo perfecto, porque
 * es texto negro sobre papel blanco.
 */
const CALIDAD = 0.5

export default function CapturarFactura() {
  const { c, t, tq } = useTema()
  const router = useRouter()
  const acciones = useAcciones()

  const [fase, setFase] = useState<Fase>('inicio')
  const [leidos, setLeidos] = useState<EnRevision[]>([])
  const [problema, setProblema] = useState<string | null>(null)

  async function procesar(imagen: ImagePicker.ImagePickerAsset) {
    if (!imagen.base64) {
      setProblema('No se pudo leer la foto. Intenta de nuevo.')
      return
    }
    setFase('leyendo')
    setProblema(null)

    try {
      const productos = await leerFactura(imagen.base64, imagen.mimeType ?? 'image/jpeg')
      setLeidos(
        productos.map((p) => {
          const sugerido = sugerirParaProducto(p.nombre)
          return { ...p, categoria: sugerido.categoria, plazo: plazoMasCercano(sugerido.dias) }
        }),
      )
      setFase('revision')
    } catch (err) {
      setProblema(err instanceof ErrorIA ? err.message : 'Algo salió mal. Intenta de nuevo.')
      setFase('inicio')
    }
  }

  async function tomarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync()
    if (!permiso.granted) {
      setProblema('Sin permiso de cámara no puedo leer la factura. Puedes elegirla de la galería.')
      return
    }
    const r = await ImagePicker.launchCameraAsync({ base64: true, quality: CALIDAD })
    if (!r.canceled && r.assets[0]) await procesar(r.assets[0])
  }

  async function elegirDeGaleria() {
    const r = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: CALIDAD,
      mediaTypes: ['images'],
    })
    if (!r.canceled && r.assets[0]) await procesar(r.assets[0])
  }

  function guardarTodo() {
    const ahora = new Date()
    const creadoISO = ahora.toISOString()
    acciones.agregarProductos(
      leidos.map((p) => ({
        id: nuevoId(),
        nombre: p.nombre,
        categoria: p.categoria,
        cantidad: p.cantidad,
        unidad: p.unidad,
        // El recibo trae el precio TOTAL de la línea; la despensa guarda el unitario.
        precioUnitario: p.cantidad > 0 ? Math.round(p.precio / p.cantidad) : p.precio,
        caducaISO: fechaDesdePlazo(p.plazo, ahora),
        creadoISO,
      })),
    )
    router.back()
  }

  /** Pone el mismo plazo en todo. Para el mercado que se guarda entero de una vez. */
  function aplicarPlazoATodos(plazo: number | null) {
    setLeidos((prev) => prev.map((p) => ({ ...p, plazo })))
  }

  if (!IA_CONFIGURADA) {
    return (
      <Pantalla titulo="Leer la factura">
        <Vacio>
          Esta función todavía no está disponible en tu versión. Puedes agregar el mercado
          dictándolo o escaneando los códigos de barras.
        </Vacio>
        <View style={{ paddingHorizontal: space[5] }}>
          <Boton texto="Volver" variante="contorno" onPress={() => router.back()} />
        </View>
      </Pantalla>
    )
  }

  if (fase === 'leyendo') {
    return (
      <Pantalla titulo="Leyendo la factura" desplazable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4] }}>
          <ActivityIndicator size="large" color={c.primario} />
          <Text style={[t.cuerpo, { color: c.texto2, textAlign: 'center', paddingHorizontal: space[6] }]}>
            Sacando los productos del recibo. Toma unos segundos.
          </Text>
        </View>
      </Pantalla>
    )
  }

  if (fase === 'revision') {
    const dudosos = leidos.filter((p) => p.dudoso).length

    return (
      <Pantalla
        titulo="Revisa antes de guardar"
        apoyo={
          leidos.length === 0
            ? undefined
            : `${leidos.length} ${leidos.length === 1 ? 'producto' : 'productos'}${
                dudosos > 0 ? ` · ${dudosos} por confirmar` : ''
              }`
        }
      >
        {leidos.length === 0 ? (
          <>
            <Vacio>
              No se reconoció ningún producto en esa foto. Prueba con más luz, o con el
              recibo estirado sobre una superficie plana.
            </Vacio>
            <View style={{ paddingHorizontal: space[5], gap: space[3] }}>
              <Boton texto="Tomar otra foto" icono="camera-outline" onPress={tomarFoto} />
              <Boton texto="Volver" variante="texto" onPress={() => router.back()} />
            </View>
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: space[5], marginBottom: space[4], gap: space[4] }}>
              <Text style={[t.apoyo, { color: c.texto3 }]}>
                Un recibo trae abreviaturas raras. Corrige lo que haga falta antes de que
                entre a la despensa — si entra mal, las recetas te van a mentir.
              </Text>

              {/*
                La duración va PROPUESTA por producto, no en blanco: sin fecha el reloj de la
                comida no existe y nadie edita ocho productos a mano. Se dice que es un
                cálculo de la app —no la fecha del empaque— porque la app no sabe cómo se
                guardó nada, y los términos de uso dicen exactamente eso.
              */}
              <Tarjeta style={{ gap: space[3] }}>
                <Text style={[t.cuerpoMed, { color: c.texto }]}>Cuánto le calculo a cada uno</Text>
                <Text style={[t.apoyo, { color: c.texto3 }]}>
                  Son duraciones típicas, no la fecha del empaque. Cámbialas abajo si sabes
                  otra cosa, o ponles la misma a todas de un toque:
                </Text>
                <Selector
                  opciones={PLAZOS.map((p) => String(p))}
                  valor="__ninguno__"
                  alElegir={(v) => aplicarPlazoATodos(v === 'null' ? null : Number(v))}
                  nombre={(v) => etiquetaPlazo(v === 'null' ? null : Number(v))}
                />
              </Tarjeta>
            </View>

            {leidos.map((p, n) => (
              <FilaRevision
                key={n}
                producto={p}
                alCambiar={(cambios) =>
                  setLeidos((prev) => prev.map((x, k) => (k === n ? { ...x, ...cambios } : x)))
                }
                alQuitar={() => setLeidos((prev) => prev.filter((_, k) => k !== n))}
              />
            ))}

            <View style={{ paddingHorizontal: space[5], marginTop: space[5], gap: space[3] }}>
              <Boton
                texto={`Guardar ${leidos.length} en la despensa`}
                icono="check"
                onPress={guardarTodo}
              />
              <Boton texto="Cancelar" variante="texto" onPress={() => router.back()} />
            </View>
          </>
        )}
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="Leer la factura" apoyo="La forma más rápida de cargar el mercado">
      <View style={{ paddingHorizontal: space[5], gap: space[4] }}>
        <Tarjeta style={{ gap: space[2] }}>
          <Text style={[t.cuerpo, { color: c.texto2 }]}>
            Tómale una foto al recibo del mercado y se sacan los productos, las cantidades y
            los precios.
          </Text>
          <Text style={[t.apoyo, { color: c.texto3 }]}>
            Siempre puedes revisar y corregir antes de que se guarde nada. La foto se manda
            para leerla y no se almacena.
          </Text>
        </Tarjeta>

        {!!problema && (
          <Tarjeta style={{ borderColor: c.vencido, gap: space[2] }}>
            <Text style={[t.cuerpoMed, { color: c.vencido }]}>{problema}</Text>
          </Tarjeta>
        )}

        <Boton texto="Tomar la foto" icono="camera-outline" onPress={tomarFoto} />
        <Boton texto="Elegir de la galería" icono="image-outline" variante="contorno" onPress={elegirDeGaleria} />
        <Boton texto="Volver" variante="texto" onPress={() => router.back()} />
      </View>
    </Pantalla>
  )
}

function FilaRevision({
  producto,
  alCambiar,
  alQuitar,
}: {
  producto: EnRevision
  alCambiar: (cambios: Partial<EnRevision>) => void
  alQuitar: () => void
}) {
  const { c, t, tq } = useTema()

  return (
    <View style={{ marginHorizontal: space[5], marginBottom: space[3] }}>
      <Tarjeta
        style={{
          gap: space[3],
          // Lo que el modelo no leyó bien va marcado: sin esto la revisión obliga a releer
          // la lista entera, y nadie lo hace.
          borderColor: producto.dudoso ? c.estaSemana : c.borde,
          borderWidth: producto.dudoso ? 1.5 : 1,
        }}
      >
        {producto.dudoso && (
          <Chip texto="Revisa este" icono="help-circle-outline" color={c.estaSemana} fondo={c.estaSemanaSuave} />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <TextInput
            value={producto.nombre}
            onChangeText={(v) => alCambiar({ nombre: v })}
            accessibilityLabel="Nombre del producto"
            style={[
              t.cuerpo,
              {
                flex: 1,
                color: c.texto,
                backgroundColor: c.fondo,
                borderColor: c.bordeFuerte,
                borderWidth: 1,
                borderRadius: radius.lg,
                paddingHorizontal: space[3],
                minHeight: tq.min,
              },
            ]}
          />
          <Presionable
            onPress={alQuitar}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${producto.nombre}`}
            style={{ padding: space[2] }}
          >
            <MaterialCommunityIcons name="close" size={22} color={c.texto3} />
          </Presionable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <TextInput
            value={String(producto.cantidad)}
            onChangeText={(v) => alCambiar({ cantidad: Number(v.replace(',', '.')) || 0 })}
            keyboardType="decimal-pad"
            accessibilityLabel="Cantidad"
            style={[
              t.cuerpo,
              {
                width: 74,
                textAlign: 'center',
                color: c.texto,
                backgroundColor: c.fondo,
                borderColor: c.bordeFuerte,
                borderWidth: 1,
                borderRadius: radius.lg,
                minHeight: tq.chip,
              },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Selector
              opciones={UNIDADES}
              valor={producto.unidad}
              alElegir={(u: Unidad) => alCambiar({ unidad: u })}
              nombre={(u) => abreviar(u, producto.cantidad || 2)}
            />
          </View>
        </View>

        <View style={{ gap: space[2] }}>
          <Text style={[t.rotulo, { color: c.texto3 }]}>CUÁNTO DURA</Text>
          <Selector
            opciones={PLAZOS.map((x) => String(x))}
            valor={String(producto.plazo)}
            alElegir={(v) => alCambiar({ plazo: v === 'null' ? null : Number(v) })}
            nombre={(v) => etiquetaPlazo(v === 'null' ? null : Number(v))}
          />
        </View>

        {producto.precio > 0 && (
          <Text style={[t.apoyo, { color: c.texto3 }]}>
            ${producto.precio.toLocaleString('es-CO')} en el recibo
          </Text>
        )}
      </Tarjeta>
    </View>
  )
}
