import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

/** Respuesta de error consistente: { error: { code, message, details? } } */
function errorResponse(status: number, code: string, message: string, details?: unknown): Response {
  return new Response(JSON.stringify({ error: { code, message, details } }), {
    status,
    headers: JSON_HEADERS,
  })
}

interface IngredientInput {
  name: string
  unit: string
}

interface RequestBody {
  ingredients?: IngredientInput[]
  servings?: number
  mealType?: string
  cuisine?: string
  vegan?: boolean
  context?: string
}

/** Valida que la receta de la IA tenga la estructura mínima usable. */
function isValidRecipe(r: unknown): boolean {
  if (typeof r !== 'object' || r === null) return false
  const x = r as Record<string, unknown>
  const ings = x.ingredients
  const steps = x.steps
  const okIng = (i: unknown) => {
    const o = i as Record<string, unknown>
    return (
      !!o &&
      typeof o.name === 'string' &&
      o.name.trim().length > 0 &&
      typeof o.quantity === 'number' &&
      o.quantity > 0 &&
      typeof o.unit === 'string'
    )
  }
  const okStep = (s: unknown) => {
    const o = s as Record<string, unknown>
    return !!o && typeof o.description === 'string' && o.description.trim().length > 0
  }
  return (
    typeof x.name === 'string' &&
    x.name.trim().length > 0 &&
    Array.isArray(ings) &&
    ings.length > 0 &&
    ings.every(okIng) &&
    Array.isArray(steps) &&
    steps.length > 0 &&
    steps.every(okStep)
  )
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'method_not_allowed', 'Usa POST para generar una receta.')
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'El cuerpo de la solicitud no es JSON válido.')
  }

  if (!GEMINI_API_KEY) {
    return errorResponse(
      500,
      'config_error',
      'El servicio de IA no está configurado (falta GEMINI_API_KEY).',
    )
  }

  const { ingredients, servings, mealType, cuisine, vegan, context } = body ?? {}
  const personas =
    typeof servings === 'number' && Number.isFinite(servings) && servings > 0
      ? Math.min(Math.round(servings), 20)
      : 4

  // Prompt parametrizado
  const lines: string[] = ['Eres un chef experto. Crea UNA receta en español según estos parámetros:']
  lines.push(`- Para ${personas} persona(s).`)
  if (mealType) lines.push(`- Tipo de plato: ${mealType}.`)
  if (cuisine) lines.push(`- Cocina / nacionalidad: ${cuisine}.`)
  if (vegan) lines.push('- La receta debe ser 100% VEGANA (sin ningún ingrediente de origen animal).')
  if (Array.isArray(ingredients) && ingredients.length > 0) {
    const list = ingredients.map((i) => `${i.name} (${i.unit})`).join(', ')
    lines.push(
      `- Usa principalmente estos ingredientes disponibles: ${list}. Puedes añadir básicos de despensa (sal, aceite, agua, especias).`,
    )
  } else {
    lines.push(
      '- No hay ingredientes específicos: propón una receta coherente con los parámetros, con ingredientes comunes y fáciles de conseguir.',
    )
  }
  if (context) lines.push(`- Contexto adicional: ${context}.`)

  const prompt = `${lines.join('\n')}

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin bloques de código) con esta estructura exacta:
{
  "name": "Nombre de la receta",
  "description": "Descripción breve de 1-2 oraciones",
  "servings": ${personas},
  "cuisine_type": "tipo de cocina",
  "ingredients": [{ "name": "nombre", "quantity": 2, "unit": "tazas" }],
  "steps": [{ "order": 1, "description": "Descripción del paso" }]
}

Incluye al menos 3 pasos. Las unidades ("unit") deben ser EXACTAMENTE una de: kg, g, L, ml, unidades, tazas, cucharadas, cucharaditas.`

  let geminiResponse: Response
  try {
    geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  } catch (err) {
    return errorResponse(
      502,
      'upstream_unreachable',
      'No se pudo contactar el servicio de IA. Intenta de nuevo.',
      err instanceof Error ? err.message : String(err),
    )
  }

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text().catch(() => '')
    return errorResponse(
      502,
      'upstream_error',
      'El servicio de IA respondió con un error. Intenta de nuevo en un momento.',
      { status: geminiResponse.status, body: detail.slice(0, 500) },
    )
  }

  let recipe: unknown
  try {
    const geminiData = await geminiResponse.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    if (!cleaned) throw new Error('Respuesta vacía del modelo')
    recipe = JSON.parse(cleaned)
    if (!isValidRecipe(recipe)) {
      throw new Error('Receta incompleta: faltan campos obligatorios o vienen vacíos')
    }
  } catch (err) {
    return errorResponse(
      502,
      'bad_upstream_response',
      'La IA no devolvió una receta con el formato esperado. Intenta de nuevo.',
      err instanceof Error ? err.message : String(err),
    )
  }

  return new Response(JSON.stringify(recipe), { status: 200, headers: JSON_HEADERS })
})
