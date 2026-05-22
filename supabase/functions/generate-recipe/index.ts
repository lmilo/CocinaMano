import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngredientInput {
  name: string
  unit: string
}

interface RequestBody {
  ingredients: IngredientInput[]
  context?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const { ingredients, context } = body

    if (!ingredients || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: 'No ingredients provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ingredientList = ingredients.map((i) => `${i.name} (${i.unit})`).join(', ')
    const contextNote = context ? `\nContexto adicional: ${context}` : ''

    const prompt = `Eres un chef experto. Con los siguientes ingredientes disponibles: ${ingredientList}.${contextNote}

Crea UNA receta detallada en español. Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin markdown, sin bloques de código):
{
  "name": "Nombre de la receta",
  "description": "Descripción breve de 1-2 oraciones",
  "servings": 4,
  "cuisine_type": "tipo de cocina",
  "ingredients": [
    { "name": "nombre ingrediente", "quantity": 2, "unit": "tazas" }
  ],
  "steps": [
    { "order": 1, "description": "Descripción del paso" }
  ]
}

Usa solo los ingredientes disponibles o ingredientes básicos de despensa (sal, aceite, agua, pimienta). Incluye al menos 3 pasos.`

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      throw new Error(`Gemini API error: ${errText}`)
    }

    const geminiData = await geminiResponse.json()
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Strip markdown code blocks if present
    const cleaned = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()

    const recipe = JSON.parse(cleaned)

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
