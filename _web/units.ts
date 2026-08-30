import type { Unit } from '@/types'

export const VALID_UNITS: Unit[] = ['kg', 'g', 'L', 'ml', 'unidades', 'tazas', 'cucharadas', 'cucharaditas']

const UNIT_ALIASES: Record<string, Unit> = {
  kilogramo: 'kg', kilogramos: 'kg', kilo: 'kg', kilos: 'kg',
  gramo: 'g', gramos: 'g', gr: 'g', grs: 'g',
  l: 'L', litro: 'L', litros: 'L',
  mililitro: 'ml', mililitros: 'ml',
  unidad: 'unidades', und: 'unidades', u: 'unidades', pieza: 'unidades', piezas: 'unidades',
  diente: 'unidades', dientes: 'unidades', manojo: 'unidades', rama: 'unidades', ramas: 'unidades',
  hoja: 'unidades', hojas: 'unidades', pizca: 'unidades', pizcas: 'unidades', 'al gusto': 'unidades',
  taza: 'tazas',
  cucharada: 'cucharadas', cda: 'cucharadas', cdas: 'cucharadas',
  cucharadita: 'cucharaditas', cdta: 'cucharaditas', cditas: 'cucharaditas',
}

/** Normaliza una unidad arbitraria (p. ej. la que devuelve la IA) al enum válido de la DB. */
export function normalizeUnit(raw: string): Unit {
  const n = raw?.toLowerCase().trim()
  if (VALID_UNITS.includes(n as Unit)) return n as Unit
  return UNIT_ALIASES[n] ?? 'unidades'
}
