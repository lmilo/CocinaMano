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
 * Tres rutas:
 *   POST /receta   — inventa una receta con lo que hay en la despensa
 *   POST /factura  — lee la foto de un recibo y saca los productos
 *   POST /dictado  — entiende lo que alguien dictó en voz alta
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
    El prompt pide TRES cosas que la pantalla de revisión necesita y que un extractor
    ingenuo no da: que expanda las abreviaturas a algo que una persona reconozca, que
    resuelva bien el tamaño del envase, y que marque como dudoso lo que no tenga claro. Sin
    lo último, la revisión obliga a releer la lista entera y nadie lo hace.

    LO DEL ENVASE NO ES PARANOIA, es un fallo observado. Con "PECHUGA POLLO BAND X500G" y un
    1 en la columna de cantidad, el modelo devolvía `1 g`: tomaba la unidad del envase y la
    cantidad de la columna. Un gramo de pollo en la despensa hace que el match diga "no te
    alcanza" cuando alcanza de sobra, que es el mismo error que se corrigió en
    `coincidencia.ts` pero entrando por la otra punta.
  */
  const prompt = `Esta es la foto de una factura de supermercado colombiana. Extrae los productos de comida.

Reglas:
- EXPANDE las abreviaturas del recibo a un nombre que una persona reconozca. Ejemplos: "LCH DSLC 1LT" es "Leche deslactosada", "PECHUGA POLLO BAND" es "Pechuga de pollo", "AZUC MORENA" es "Azúcar morena".
- Usa el nombre genérico del alimento, sin la marca. "Leche deslactosada", no "Leche Alquería deslactosada".
- IGNORA todo lo que no sea comida ni bebida: bolsas, aseo, propina, impuestos, totales, descuentos.
- ATENCIÓN CON EL TAMAÑO DEL ENVASE, que suele venir DENTRO del nombre (X500G, 1000ML, 1LT, 1KG, X6). El número de la columna de cantidad es CUÁNTOS ENVASES se llevaron, no el contenido. Devuelve el CONTENIDO TOTAL: multiplica el tamaño del envase por el número de envases.
  · "PECHUGA POLLO BAND X500G" con cantidad 1  →  cantidad 500, unidad "g"   (NUNCA cantidad 1 con unidad "g")
  · "ACEITE GIRASOL 1000ML" con cantidad 1     →  cantidad 1000, unidad "ml"
  · "LCH DSLC ENT 1LT" con cantidad 2          →  cantidad 2, unidad "L"
  · "ARROZ DIANA LB" con cantidad 2            →  cantidad 2, unidad "lb"
- Si el producto se vendió por peso a granel, el número de la columna ya es el peso: "TOMATE CHONTO GRANEL KG 0.850" es cantidad 0.85, unidad "kg".
- Si no se distingue ninguna cantidad, pon 1 y la unidad "unidades".
- En Colombia se compra mucho por libras: si el recibo dice "LB", la unidad es "lb".
- "precio" es el precio TOTAL de esa línea en pesos, sin puntos ni símbolos. Si no se distingue, pon 0.
- Marca "dudoso": true cuando no puedas leer bien la línea, no estés seguro de qué producto es, o hayas tenido que adivinar el tamaño del envase.

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

// ─── /dictado ───────────────────────────────────────────────────────────────

type PeticionDictado = {
  texto?: string
  /** 'AAAA-MM-DD' del día del usuario. El Worker no sabe en qué huso está. */
  hoy?: string
}

/**
 * Entiende lo que alguien dictó.
 *
 * ESTO EMPEZÓ SIENDO UNA TABLA EN EL TELÉFONO, y la tabla se quedó corta en cuanto alguien
 * habló normal. Con "2 bolsas de leche van para la nevera vencen el 4 de mayo" el parseo
 * local dejaba «leche van vencen el 4 de mayo» como nombre del producto, y —lo peor— al no
 * entender la fecha caía a la duración típica de la leche y mostraba una fecha calculada
 * como si hubiera entendido la dictada.
 *
 * Refinar la tabla era un pozo sin fondo: cada frase nueva pide una regla nueva y el
 * lenguaje natural no se acaba. La tabla sigue viva en `voz.ts` como respaldo SIN SEÑAL,
 * que es lo que de verdad justificaba tenerla.
 *
 * La fecha se resuelve aquí y no en el teléfono porque hace falta el contexto de la frase
 * entera: "el 4 de mayo" dicho el 30 de agosto es del año que viene, no de este.
 */
async function entenderDictado(peticion: PeticionDictado, env: Env): Promise<Response> {
  const texto = (peticion?.texto ?? '').trim()
  if (!texto) {
    return new Response(JSON.stringify({ productos: [] }), { status: 200, headers: JSON_HEADERS })
  }
  if (texto.length > 2000) {
    return error(400, 'json_invalido', 'El dictado es demasiado largo.')
  }

  const hoy = /^\d{4}-\d{2}-\d{2}$/.test(peticion?.hoy ?? '')
    ? peticion.hoy!
    : new Date().toISOString().slice(0, 10)

  const prompt = `Alguien está guardando el mercado y dictó esto en voz alta, en español de Colombia:

"${texto}"

Saca los productos. Habla como habla la gente, con muletillas y frases sueltas: "dos bolsas de leche van para la nevera vencen el 4 de mayo" son DOS bolsas de leche, van a la nevera, y se vencen el 4 de mayo.

Reglas:
- "nombre" es SOLO el alimento, sin verbos, sin muletillas y sin nada de lo que se dijo sobre dónde va o cuándo se vence. De la frase del ejemplo, el nombre es "Leche" — nunca "leche van vencen el 4 de mayo".
- Escribe el nombre en singular y con mayúscula inicial: "Leche", "Pechuga de pollo", "Tomate".
- "cantidad" y "unidad": la unidad debe ser EXACTAMENTE una de ${UNIDADES}. Ninguna otra palabra vale como unidad.
  · Los envases que no son medida ("bolsas", "paquetes", "cajas", "latas") van como "unidades", y la cantidad es cuántos envases.
  · Las agrupaciones SE CONVIERTEN a la cantidad que representan: "una docena de huevos" es cantidad 12 y unidad "unidades"; "media docena" es 6; "un par" es 2. NUNCA devuelvas "docenas" como unidad.
  · Si no se dijo cantidad, pon 1 y marca "asumido": true.
- "categoria" debe ser EXACTAMENTE una de: nevera, congelador, despensa, especias, panaderia, bebidas, otro. Si la persona dijo dónde va, respétalo. Si no lo dijo, déjala en null y NO adivines.
- "vence" es la fecha en formato AAAA-MM-DD, o null si la persona no dijo nada al respecto.
  · Hoy es ${hoy}. Una fecha de vencimiento SIEMPRE está en el futuro: si dice "el 4 de mayo" y ese día ya pasó este año, es del año siguiente.
  · "en tres días", "la otra semana", "en un mes" se convierten a fecha contando desde hoy.
  · Si NO dijo nada de vencimiento, pon null. NO calcules cuánto suele durar el alimento: de eso se encarga la app.
- Si dictó varios productos seguidos, devuélvelos todos, en el orden en que los dijo.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni bloques de código:
{
  "productos": [
    { "nombre": "Leche", "cantidad": 2, "unidad": "unidades", "categoria": "nevera", "vence": "2027-05-04", "asumido": false }
  ]
}

Si no se reconoce ningún alimento, devuelve {"productos": []}.`

  // Temperatura baja: esto es transcribir estructura, no proponer nada.
  const salida = await pedirAGemini(env, [{ text: prompt }], 0.1)
  if (!salida.ok) return salida.respuesta

  try {
    const datos = JSON.parse(salida.texto)
    if (!Array.isArray(datos?.productos)) throw new Error('Falta el arreglo de productos')

    const productos = datos.productos.filter(
      (p: any) => p && typeof p.nombre === 'string' && p.nombre.trim().length > 0,
    )
    return new Response(JSON.stringify({ productos }), { status: 200, headers: JSON_HEADERS })
  } catch (err) {
    return error(
      502,
      'respuesta_inesperada',
      'No se entendió lo dictado. Puedes corregirlo a mano.',
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
    if (ruta === '/dictado') return entenderDictado(cuerpo as PeticionDictado, env)

    return error(404, 'ruta_desconocida', 'Esa ruta no existe.')
  },
}
