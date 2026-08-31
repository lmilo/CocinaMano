import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { radius, space } from '../constants/tokens'
import { textoCaducidad } from '../lib/caducidad'
import { enmascararFecha, parseFechaEscrita } from '../lib/fecha'
import { useTema } from '../lib/tema'
import { fechaDesdePlazo } from '../lib/vidautil'
import { Selector } from './ui'

/**
 * Cuándo se vence algo.
 *
 * LOS PLAZOS REDONDOS NO ALCANZAN. Estaban en 15 días y 1 mes porque nadie sabe la fecha
 * exacta de una lechuga — y eso sigue siendo cierto para lo fresco. Pero una conserva vence
 * en tres meses, un congelado en seis, y muchos empaques traen la fecha impresa. Obligar a
 * elegir "1 mes" cuando el frasco dice 12 de marzo es pedirle al usuario que empeore su
 * propio dato.
 *
 * Así que hay las dos cosas: plazos para lo que se estima, y fecha exacta para lo que se
 * lee del empaque. La fecha se teclea sin barras: 25122026 sale 25/12/2026.
 */

/** Los plazos ofrecidos, en días. `null` = no se vence. */
const PLAZOS_LARGOS: readonly (number | null)[] = [null, 2, 3, 5, 7, 15, 30, 90, 180, 365]

const OTRA = 'otra'

function etiqueta(dias: number | null): string {
  if (dias === null) return 'No se vence'
  if (dias === 2) return '2 días'
  if (dias === 7) return '1 semana'
  if (dias === 15) return '15 días'
  if (dias === 30) return '1 mes'
  if (dias === 90) return '3 meses'
  if (dias === 180) return '6 meses'
  if (dias === 365) return '1 año'
  return `${dias} días`
}

export function SelectorCaducidad({
  etiquetaCampo = 'Cuándo se vence',
  caducaISO,
  alCambiar,
  ahora = new Date(),
}: {
  etiquetaCampo?: string
  /** La fecha actual, o `null` si no se vence. */
  caducaISO: string | null
  alCambiar: (caducaISO: string | null) => void
  ahora?: Date
}) {
  const { c, t, tq } = useTema()

  /**
   * Qué opción está marcada. Se guarda aparte de la fecha porque dos plazos distintos
   * pueden dar la misma fecha, y porque al elegir "otra" hay que quedarse ahí mientras el
   * usuario teclea, aunque todavía no haya una fecha válida.
   */
  const [modo, setModo] = useState<string>(() => {
    if (!caducaISO) return 'null'
    // Si la fecha coincide con un plazo redondo, se muestra ese; si no, es una fecha suya.
    const coincide = PLAZOS_LARGOS.find((p) => p !== null && fechaDesdePlazo(p, ahora) === caducaISO)
    return coincide !== undefined && coincide !== null ? String(coincide) : OTRA
  })

  const [escrita, setEscrita] = useState(() => {
    if (!caducaISO) return ''
    const [a, m, d] = caducaISO.split('-')
    return `${d}/${m}/${a}`
  })

  const invalida = modo === OTRA && escrita.trim() !== '' && parseFechaEscrita(escrita) === null

  function elegirModo(v: string) {
    setModo(v)
    if (v === OTRA) {
      alCambiar(parseFechaEscrita(escrita))
      return
    }
    alCambiar(v === 'null' ? null : fechaDesdePlazo(Number(v), ahora))
  }

  function escribirFecha(v: string) {
    const conBarras = enmascararFecha(v)
    setEscrita(conBarras)
    alCambiar(parseFechaEscrita(conBarras))
  }

  return (
    <View style={{ gap: space[3] }}>
      <Selector
        etiqueta={etiquetaCampo}
        opciones={[...PLAZOS_LARGOS.map((p) => String(p)), OTRA]}
        valor={modo}
        alElegir={elegirModo}
        nombre={(v) => (v === OTRA ? 'Fecha exacta' : etiqueta(v === 'null' ? null : Number(v)))}
      />

      {modo === OTRA && (
        <View>
          <TextInput
            value={escrita}
            onChangeText={escribirFecha}
            placeholder="Día, mes y año"
            placeholderTextColor={c.texto3}
            keyboardType="numeric"
            accessibilityLabel="Fecha de vencimiento"
            style={[
              t.cuerpo,
              {
                color: c.texto,
                backgroundColor: c.tarjeta,
                borderColor: invalida ? c.vencido : c.bordeFuerte,
                borderWidth: 1,
                borderRadius: radius.lg,
                paddingHorizontal: space[4],
                minHeight: tq.min,
              },
            ]}
          />
          {invalida && (
            <Text style={[t.apoyo, { color: c.vencido, marginTop: space[2] }]}>
              Esa fecha no existe. Escríbela como 25/12/2026.
            </Text>
          )}
        </View>
      )}

      {!!caducaISO && !invalida && (
        <Text style={[t.apoyo, { color: c.texto3 }]}>{textoCaducidad(caducaISO, ahora)}</Text>
      )}
    </View>
  )
}
