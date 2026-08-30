/**
 * El único servidor de Cocina a Mano.
 *
 * La app es offline: despensa, recetas y lista viven en el teléfono y no salen de ahí. Esto
 * existe solo porque la clave de Gemini NO PUEDE VIAJAR DENTRO DEL APK — cualquiera
 * desempaqueta un .aab y la saca.
 *
 * Está en Cloudflare Workers y no en una Edge Function de Supabase, que es de donde viene
 * el código de `/receta`: un proyecto gratuito de Supabase se pausa por inactividad, y una
 * app instalada que deja de funcionar al tercer mes es peor que una que nunca lo tuvo. Un
 * Worker no duerme.
 *
 * Dos rutas:
 *   POST /receta   — inventa una receta con lo que hay en la despensa
 *   POST /factura  — lee la foto de un recibo y saca los productos
 */

export interface Env {
  GEMINI_API_KEY: string
  /** Opcional. Sin él no hay tope de peticiones — ver `dentroDelLimite`. */
  LIMITES?: KVNamespace
}

const MODELO = 'gemini-2.5-flash'
const URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`

/** Peticiones por instalación y por hora. Generoso para uso real, corto para abuso. */
const TOPE_POR_HORA = 20

/** Base64 de más de 6 MB no es una foto de recibo, es otra cosa. */
const MAX_BASE64 = 6 * 1024 * 1024

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-instalacion',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const JSON_HEADERS = { ...CORS, 'Content-Type': 'application/json' }

type CodigoError =
  | 'metodo_no_permitido'
  | 'ruta_desconocida'
  | 'json_invalido'
  | 'sin_configurar'
  | 'imagen_invalida'
  | 'demasiadas_peticiones'
  | 'ia_inalcanzable'
  | 'ia_con_error'
  | 'respuesta_inesperada'

function error(status: number, codigo: CodigoError, mensaje: string, detalle?: unknown): Response {
  return new Response(JSON.stringify({ error: { codigo, mensaje, detalle } }), {
    status,
    headers: JSON_HEADERS,
  })
}

/**
 * Tope de peticiones por instalación.
 *
 * FALLA ABIERTO A PROPÓSITO: si KV no está configurado o falla, la petición pasa. Esto no
 * es un control de seguridad —sin cuentas no hay identidad real y el `x-instalacion` lo
 * puede inventar cualquiera—, es un tope de gasto. El respaldo de verdad es la cuota del
 * proyecto de Gemini. Dejar sin funcionar la app de un usuario legítimo porque un KV no
 * respondió sería cambiar un problema de centavos por uno de producto.
 */
async function dentroDelLimite(env: Env, instalacion: string): Promise<boolean> {
  if (!env.LIMITES || !instalacion) return true

  const hora = new Date().toISOString().slice(0, 13) // 'AAAA-MM-DDTHH'
  const clave = `${instalacion}:${hora}`

  try {
    const usadas = Number((await env.LIMITES.get(clave)) ?? '0')
    if (usadas >= TOPE_POR_HORA) return false
    // TTL de 2 horas: la clave incluye la hora, así que no hace falta limpiarla a mano.
    await env.LIMITES.put(clave, String(usadas + 1), { expirationTtl: 7200 })
    return true
  } catch {
    return true
  }
}

async function pedirAGemini(
  env: Env,
  partes: unknown[],
  temperatura: number,
): Promise<{ ok: true; texto: string } | { ok: false; respuesta: Response }> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_GEMINI}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: partes }],
        generationConfig: {
          temperature: temperatura,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  } catch (err) {
    return {
      ok: false,
      respuesta: error(
        502,
        'ia_inalcanzable',
        'No se pudo contactar el servicio. Intenta de nuevo.',
        err instanceof Error ? err.message : String(err),
      ),
    }
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '')
    return {
      ok: false,
      respuesta: error(502, 'ia_con_error', 'El servicio respondió con un error. Intenta en un momento.', {
        status: respuesta.status,
        cuerpo: detalle.slice(0, 500),
      }),
    }
  }

  const datos = (await respuesta.json()) as any
  const crudo: string = datos?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const limpio = crudo.replace(/```json?\n?/g, '').replace(/```/g, '').trim()

  if (!limpio) {
    return { ok: false, respuesta: error(502, 'respuesta_inesperada', 'El servicio devolvió una respuesta vacía.') }
  }
  return { ok: true, texto: limpio }
}

/** Las unidades que la app entiende. Deben coincidir con `src/lib/dominio.ts`. */
const UNIDADES = 'kg, g, lb, L, ml, unidades, tazas, cucharadas, cucharaditas'

// ─── /receta ────────────────────────────────────────────────────────────────

type PeticionReceta = {
  ingredientes?: { nombre: string; unidad: string }[]
  porciones?: number
  tipoPlato?: string
  cocina?: string
  vegana?: boolean
  contexto?: string
}

function recetaValida(r: unknown): boolean {
  if (typeof r !== 'object' || r === null) return false
  const x = r as Record<string, unknown>
  const ings = x.ingredientes
  const pasos = x.pasos

  const ingOk = (i: unknown) => {
    const o = i as Record<string, unknown>
    return (
      !!o &&
      typeof o.nombre === 'string' &&
      o.nombre.trim().length > 0 &&
      typeof o.cantidad === 'number' &&
      o.cantidad > 0 &&
      typeof o.unidad === 'string'
    )
  }
  const pasoOk = (p: unknown) => {
    const o = p as Record<string, unknown>
    return !!o && typeof o.texto === 'string' && o.texto.trim().length > 0
  }

  return (
    typeof x.nombre === 'string' &&
    x.nombre.trim().length > 0 &&
    Array.isArray(ings) &&
    ings.length > 0 &&
    ings.every(ingOk) &&
    Array.isArray(pasos) &&
    pasos.length > 0 &&
    pasos.every(pasoOk)
  )
}

async function generarReceta(peticion: PeticionReceta, env: Env): Promise<Response> {
  const { ingredientes, porciones, tipoPlato, cocina, vegana, contexto } = peticion ?? {}

  const personas =
    typeof porciones === 'number' && Number.isFinite(porciones) && porciones > 0
      ? Math.min(Math.round(porciones), 20)
      : 4

  const lineas = ['Eres un chef experto. Crea UNA receta en español según estos parámetros:']
  lineas.push(`- Para ${personas} persona(s).`)
  if (tipoPlato) lineas.push(`- Tipo de plato: ${tipoPlato}.`)
  if (cocina) lineas.push(`- Cocina o nacionalidad: ${cocina}.`)
  if (vegana) lineas.push('- La receta debe ser 100% VEGANA, sin ningún ingrediente de origen animal.')

  if (Array.isArray(ingredientes) && ingredientes.length > 0) {
    const lista = ingredientes.map((i) => `${i.nombre} (${i.unidad})`).join(', ')
    lineas.push(
      `- Usa principalmente estos ingredientes, que es lo que la persona tiene en casa: ${lista}. Puedes añadir básicos de despensa como sal, aceite, agua y especias.`,
    )
  } else {
    lineas.push(
      '- No hay ingredientes específicos: propón una receta coherente con los parámetros, con ingredientes comunes y fáciles de conseguir en Colombia.',
    )
  }
  if (contexto) lineas.push(`- Contexto adicional: ${contexto}.`)

  const prompt = `${lineas.join('\n')}

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni bloques de código, con esta estructura exacta:
{
  "nombre": "Nombre de la receta",
  "descripcion": "Una o dos oraciones",
  "porciones": ${personas},
  "cocina": "tipo de cocina",
  "ingredientes": [{ "nombre": "arroz", "cantidad": 2, "unidad": "tazas" }],
  "pasos": [{ "orden": 1, "texto": "Descripción del paso" }]
}

Incluye al menos 3 pasos. La "unidad" debe ser EXACTAMENTE una de: ${UNIDADES}.`

  const salida = await pedirAGemini(env, [{ text: prompt }], 0.8)
  if (!salida.ok) return salida.respuesta

  try {
    const receta = JSON.parse(salida.texto)
    if (!recetaValida(receta)) throw new Error('Faltan campos obligatorios o vienen vacíos')
    return new Response(JSON.stringify(receta), { status: 200, headers: JSON_HEADERS })
  } catch (err) {
    return error(
      502,
      'respuesta_inesperada',
      'No se recibió una receta con el formato esperado. Intenta de nuevo.',
      err instanceof Error ? err.message : String(err),
    )
  }
}

// ─── /factura ───────────────────────────────────────────────────────────────

type PeticionFactura = {
  imagenBase64?: string
  tipoMime?: string
}

async function leerFactura(peticion: PeticionFactura, env: Env): Promise<Response> {
  const { imagenBase64, tipoMime } = peticion ?? {}

  if (!imagenBase64 || typeof imagenBase64 !== 'string') {
    return error(400, 'imagen_invalida', 'Falta la foto de la factura.')
  }
  if (imagenBase64.length > MAX_BASE64) {
    return error(400, 'imagen_invalida', 'La foto pesa demasiado. Tómala de nuevo con menos calidad.')
  }

  /*
    El prompt pide DOS cosas que la pantalla de revisión necesita y que un extractor
    ingenuo no da: que expanda las abreviaturas del recibo a algo que una persona reconozca,
    y que marque como dudoso lo que no tenga claro. Sin lo segundo, la revisión obliga a
    releer la lista entera y nadie lo hace.
  */
  const prompt = `Esta es la foto de una factura de supermercado colombiana. Extrae los productos de comida.

Reglas:
- EXPANDE las abreviaturas del recibo a un nombre que una persona reconozca. Ejemplos: "LCH DSLC 1LT" es "Leche deslactosada", "PECHUGA POLLO BAND" es "Pechuga de pollo", "AZUC MORENA" es "Azúcar morena".
- Usa el nombre genérico del alimento, sin la marca. "Leche deslactosada", no "Leche Alquería deslactosada".
- IGNORA todo lo que no sea comida ni bebida: bolsas, aseo, propina, impuestos, totales, descuentos.
- Si la cantidad no aparece, pon 1 y la unidad "unidades".
- Si el peso viene en gramos o kilos, respétalo. En Colombia se compra mucho por libras: si el recibo dice "LB", la unidad es "lb".
- "precio" es el precio TOTAL de esa línea en pesos, sin puntos ni símbolos. Si no se distingue, pon 0.
- Marca "dudoso": true cuando no puedas leer bien la línea o no estés seguro de qué producto es.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni bloques de código:
{
  "productos": [
    { "nombre": "Leche deslactosada", "cantidad": 1, "unidad": "L", "precio": 4500, "dudoso": false }
  ]
}

La "unidad" debe ser EXACTAMENTE una de: ${UNIDADES}.
Si la foto no es una factura o no se lee nada, devuelve {"productos": []}.`

  const salida = await pedirAGemini(
    env,
    [
      { inline_data: { mime_type: tipoMime || 'image/jpeg', data: imagenBase64 } },
      { text: prompt },
    ],
    // Temperatura baja: leer un recibo es transcribir, no inventar.
    0.1,
  )
  if (!salida.ok) return salida.respuesta

  try {
    const datos = JSON.parse(salida.texto)
    if (!Array.isArray(datos?.productos)) throw new Error('Falta el arreglo de productos')

    // Se filtra aquí y no en la app: lo que no tenga nombre no sirve para nada y solo haría
    // ruido en la pantalla de revisión.
    const productos = datos.productos.filter(
      (p: any) => p && typeof p.nombre === 'string' && p.nombre.trim().length > 0,
    )
    return new Response(JSON.stringify({ productos }), { status: 200, headers: JSON_HEADERS })
  } catch (err) {
    return error(
      502,
      'respuesta_inesperada',
      'No se pudo leer la factura. Intenta con otra foto.',
      err instanceof Error ? err.message : String(err),
    )
  }
}

// ─── entrada ────────────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    if (req.method !== 'POST') {
      return error(405, 'metodo_no_permitido', 'Usa POST.')
    }

    if (!env.GEMINI_API_KEY) {
      return error(500, 'sin_configurar', 'El servicio no está configurado.')
    }

    const instalacion = req.headers.get('x-instalacion') ?? ''
    if (!(await dentroDelLimite(env, instalacion))) {
      return error(429, 'demasiadas_peticiones', 'Has usado esto muchas veces esta hora. Prueba más tarde.')
    }

    let cuerpo: unknown
    try {
      cuerpo = await req.json()
    } catch {
      return error(400, 'json_invalido', 'El cuerpo no es JSON válido.')
    }

    const ruta = new URL(req.url).pathname
    if (ruta === '/receta') return generarReceta(cuerpo as PeticionReceta, env)
    if (ruta === '/factura') return leerFactura(cuerpo as PeticionFactura, env)

    return error(404, 'ruta_desconocida', 'Esa ruta no existe.')
  },
}
