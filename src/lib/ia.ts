import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import type { Receta, Unidad } from './dominio'
import { normalizarUnidad } from './unidades'

/**
 * Lo único de esta app que necesita red.
 *
 * Todo lo demás —despensa, recetas, lista, avisos— funciona sin señal. Aquí la regla es que
 * **fallar no puede romper nada**: si el Worker no responde, estas dos pantallas muestran
 * un mensaje claro y el resto de la app sigue igual. Ver `worker/src/index.ts`.
 */

const URL_BASE = process.env.EXPO_PUBLIC_WORKER_URL ?? ''

export const IA_CONFIGURADA = URL_BASE.length > 0

const CLAVE_INSTALACION = 'cocina.instalacion'

/**
 * Un identificador por instalación, solo para el tope de peticiones del Worker.
 *
 * NO identifica a la persona y no viaja con ningún otro dato: es un UUID aleatorio que nace
 * y muere con la app instalada. Si SecureStore falla se manda vacío y el Worker deja pasar.
 */
async function idInstalacion(): Promise<string> {
  try {
    const guardado = await SecureStore.getItemAsync(CLAVE_INSTALACION)
    if (guardado) return guardado
    const nuevo = Crypto.randomUUID()
    await SecureStore.setItemAsync(CLAVE_INSTALACION, nuevo)
    return nuevo
  } catch {
    return ''
  }
}

export class ErrorIA extends Error {
  constructor(
    mensaje: string,
    readonly codigo: string,
  ) {
    super(mensaje)
  }
}

async function pedir<T>(ruta: string, cuerpo: unknown): Promise<T> {
  if (!IA_CONFIGURADA) {
    throw new ErrorIA('Esta función todavía no está disponible en tu versión.', 'sin_configurar')
  }

  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-instalacion': await idInstalacion(),
      },
      body: JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorIA('No hay conexión. Esto necesita internet; lo demás de la app no.', 'sin_red')
  }

  if (!respuesta.ok) {
    const datos = (await respuesta.json().catch(() => null)) as
      | { error?: { codigo?: string; mensaje?: string } }
      | null
    throw new ErrorIA(
      datos?.error?.mensaje ?? 'Algo salió mal. Intenta de nuevo.',
      datos?.error?.codigo ?? 'desconocido',
    )
  }

  return (await respuesta.json()) as T
}

export type ParametrosReceta = {
  ingredientes?: { nombre: string; unidad: Unidad }[]
  porciones?: number
  tipoPlato?: string
  cocina?: string
  vegana?: boolean
  contexto?: string
}

type RecetaCruda = {
  nombre: string
  descripcion?: string
  porciones?: number
  cocina?: string
  ingredientes: { nombre: string; cantidad: number; unidad: string }[]
  pasos: { orden?: number; texto: string }[]
}

/** Genera una receta y la deja ya en la forma del dominio, con las unidades normalizadas. */
export async function generarReceta(
  parametros: ParametrosReceta,
  id: string,
): Promise<Receta> {
  const cruda = await pedir<RecetaCruda>('/receta', parametros)

  return {
    id,
    origen: 'ia',
    nombre: cruda.nombre.trim(),
    descripcion: cruda.descripcion?.trim() ?? '',
    porciones: cruda.porciones && cruda.porciones > 0 ? cruda.porciones : 4,
    cocina: cruda.cocina?.trim() || null,
    ingredientes: cruda.ingredientes.map((i) => ({
      nombre: i.nombre.trim(),
      cantidad: i.cantidad,
      // El modelo se sale del enum aunque se le pida que no: "gramos" por "g", "dientes"
      // por "unidades". Normalizar aquí es lo que evita que el match compare mal después.
      unidad: normalizarUnidad(i.unidad),
    })),
    pasos: cruda.pasos.map((p, n) => ({ orden: p.orden ?? n + 1, texto: p.texto.trim() })),
  }
}

/** Una línea leída de la factura, todavía sin confirmar por el usuario. */
export type ProductoLeido = {
  nombre: string
  cantidad: number
  unidad: Unidad
  precio: number
  /** El modelo no estaba seguro. La pantalla de revisión lo destaca. */
  dudoso: boolean
}

/**
 * Lee la foto de un recibo.
 *
 * Devuelve candidatos, NO productos: lo que sale de aquí pasa por una pantalla de revisión
 * antes de tocar la despensa. Un recibo trae abreviaturas que ningún modelo acierta al
 * 100%, y meter basura al inventario envenena el match, que es el producto entero.
 */
export async function leerFactura(imagenBase64: string, tipoMime: string): Promise<ProductoLeido[]> {
  const datos = await pedir<{ productos: any[] }>('/factura', { imagenBase64, tipoMime })

  return datos.productos.map((p) => ({
    nombre: String(p.nombre ?? '').trim(),
    cantidad: Number(p.cantidad) > 0 ? Number(p.cantidad) : 1,
    unidad: normalizarUnidad(p.unidad),
    precio: Number.isFinite(Number(p.precio)) ? Math.max(0, Math.round(Number(p.precio))) : 0,
    dudoso: p.dudoso === true,
  }))
}
