/**
 * Qué producto es un código de barras.
 *
 * Se consulta Open Food Facts, que es abierto, gratis y no pide llave. La cobertura de
 * marcas colombianas es IRREGULAR y eso no se puede arreglar desde aquí: por eso el
 * verdadero mecanismo no es esta consulta sino el caché local (`codigosConocidos` en
 * `acciones.ts`). La primera vez que un EAN no aparece, el usuario escribe el nombre; de
 * ahí en adelante la app ya lo sabe, sin red y sin depender de nadie.
 *
 * Con el tiempo, la despensa de cada quien termina conociendo su propio supermercado.
 */

const URL = 'https://world.openfoodfacts.org/api/v2/product'

/** Si tarda más que esto, no vale la pena: el usuario está de pie frente a la despensa. */
const TIEMPO_LIMITE_MS = 5000

export type ResultadoCodigo = {
  nombre: string
  /** De dónde salió: cambia lo que la pantalla le dice al usuario. */
  fuente: 'local' | 'openfoodfacts'
}

/** Un EAN-8 o EAN-13/UPC son solo dígitos. Cualquier otra cosa no vale la pena consultar. */
export function esCodigoValido(codigo: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(codigo)
}

async function consultarOpenFoodFacts(ean: string): Promise<string | null> {
  const control = new AbortController()
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS)

  try {
    const respuesta = await fetch(
      `${URL}/${ean}.json?fields=product_name,product_name_es,generic_name_es,brands`,
      { signal: control.signal },
    )
    if (!respuesta.ok) return null

    const datos = (await respuesta.json()) as any
    if (datos?.status !== 1) return null

    const p = datos.product ?? {}
    // Se prefiere el nombre en español y el genérico sobre el comercial: la despensa se
    // busca por "leche deslactosada", no por el nombre de marca del empaque.
    const nombre: string =
      p.product_name_es || p.generic_name_es || p.product_name || ''

    return nombre.trim() || null
  } catch {
    // Sin red, con timeout o con una respuesta rara: no es un error que valga la pena
    // mostrar. La pantalla cae al formulario manual, que es lo que iba a pasar igual.
    return null
  } finally {
    clearTimeout(reloj)
  }
}

/**
 * Resuelve un código. El caché local manda sobre la consulta remota: lo que el usuario
 * escribió para SU producto vale más que lo que diga una base de datos global.
 */
export async function resolverCodigo(
  ean: string,
  conocidos: Record<string, string>,
): Promise<ResultadoCodigo | null> {
  const local = conocidos[ean]
  if (local) return { nombre: local, fuente: 'local' }

  if (!esCodigoValido(ean)) return null

  const remoto = await consultarOpenFoodFacts(ean)
  return remoto ? { nombre: remoto, fuente: 'openfoodfacts' } : null
}
