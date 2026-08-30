import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Solo la lógica pura de la app móvil. `_web` es el frontend Vue en retirada y sus
    // tests dependen de Supabase, que ya no es dependencia del proyecto.
    include: ['src/**/*.test.ts'],
  },
})
