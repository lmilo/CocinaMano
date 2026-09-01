import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Solo la lógica pura de `src/lib`. Nada de esto toca React Native, así que corre en
    // Node sin configuración extra — que es la razón de que la lógica viva separada de las
    // pantallas y de que el store tenga sus transformaciones en `acciones.ts`.
    include: ['src/**/*.test.ts'],
  },
})
