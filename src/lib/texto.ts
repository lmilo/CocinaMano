/**
 * Cómo se compara el nombre de un alimento con otro.
 *
 * Vive aparte porque lo usan dos módulos que no deberían depender uno del otro:
 * `coincidencia.ts` para cruzar despensa con recetas, y `vidautil.ts` para adivinar cuánto
 * dura un producto. Duplicarlo habría hecho que un arreglo en uno no llegara al otro, que
 * es justo el tipo de divergencia que nadie nota hasta que el match empieza a fallar raro.
 */

const VACIAS = new Set(['del', 'de', 'con', 'los', 'las', 'una', 'para', 'sin'])

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Divide un nombre en palabras significativas. */
export function palabras(texto: string): string[] {
  return normalizar(texto)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !VACIAS.has(t))
}

/**
 * Variantes de raíz para tolerar plurales del español sin confundirlos: vocal+s
 * ("tomates"→"tomate") y consonante+es ("frijoles"→"frijol").
 *
 * Se compara por palabra completa y no por subcadena, que es lo que evita el falso positivo
 * de "sal" dentro de "salchicha".
 */
export function raices(palabra: string): string[] {
  const out = [palabra]
  if (palabra.length > 3 && palabra.endsWith('s')) out.push(palabra.slice(0, -1))
  if (palabra.length > 4 && palabra.endsWith('es')) out.push(palabra.slice(0, -2))
  return out
}

/** True si alguna palabra del nombre coincide, por raíz, con alguno de los términos dados. */
export function mencionaAlguno(nombre: string, terminos: readonly string[]): boolean {
  const propias = new Set<string>()
  for (const p of palabras(nombre)) {
    for (const r of raices(p)) propias.add(r)
  }
  return terminos.some((t) => raices(normalizar(t)).some((r) => propias.has(r)))
}
