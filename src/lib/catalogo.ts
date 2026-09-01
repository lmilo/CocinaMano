import crudas from '../../datos/recetas-base.json'
import type { Receta } from './dominio'

/**
 * El catálogo que trae la app. Viaja dentro del bundle, así que está disponible desde el
 * primer arranque y sin señal — que es el punto: la app tiene que servir para algo aunque
 * el usuario nunca escriba una receta ni llegue a usar la IA.
 */
export const RECETAS_BASE = crudas as Receta[]
