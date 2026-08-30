import { useEffect } from 'react'
import { reprogramarAvisos } from '../lib/avisos'
import { useEstado } from '../lib/store'

/**
 * Mantiene los avisos al día con la despensa.
 *
 * No pinta nada: se monta dentro del provider para poder observar el estado. Cada vez que
 * cambian los productos o los ajustes, se cancela todo y se reprograma desde cero — es la
 * única forma de que las notificaciones no se desincronicen de lo que hay en la nevera.
 */
export function SincronizarAvisos() {
  const { estado, cargando } = useEstado()

  useEffect(() => {
    if (cargando) return
    void reprogramarAvisos(estado.productos, estado.ajustes)
  }, [cargando, estado.productos, estado.ajustes])

  return null
}
