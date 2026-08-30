/**
 * Tokens del sistema de diseño — dirección LA DESPENSA.
 *
 * El producto no gestiona recetas: gestiona lo que ya compraste. El enemigo declarado es
 * el desperdicio, y de ahí sale todo lo demás.
 *
 * EL COLOR TIENE DOS EJES Y NINGUNO DECORA:
 *
 *   verde albahaca  = lo que te alcanza      (coincidencia, ingrediente que sí tienes)
 *   ámbar→rojo      = el reloj de la comida  (cuánto le queda antes de perderse)
 *
 * Lo que tiene tiempo de sobra es PIEDRA: no merece un acento porque no pide nada. Es la
 * misma regla del día sin recargo en Recargo, aplicada a otro dominio.
 *
 * EL DINERO NO ES ACENTO, a diferencia de Recargo. Allá el oro es el dinero porque el
 * producto ES sobre dinero. Aquí el precio se muestra en texto normal: darle acento movería
 * la atención al lugar equivocado, que no es cuánto costó sino cuánto le queda.
 *
 * Todos los ratios de este archivo se calcularon con la fórmula WCAG y se verificaron
 * CONTRA EL FONDO DONDE DE VERDAD SE PINTAN — incluidas las cápsulas de acento sobre su
 * propio fondo suave, que es donde estas paletas suelen fallar en silencio.
 */

export const light = {
  // Sustrato: papel de estraza y harina. Más cálido y más amarillo que el hueso de Recargo,
  // porque este no es un cuarto de noche: es una cocina con luz.
  fondo: '#FAF6ED',
  tarjeta: '#FFFFFF',
  tarjetaAlt: '#F2ECE0',

  texto: '#1A1712', // 16.57:1 sobre fondo — casi negro, pero cálido
  texto2: '#4E463A', // 8.61:1
  texto3: '#6B6153', // 5.63:1

  // `borde` separa y no informa, así que no tiene mínimo. `bordeFuerte` es el borde de un
  // control (campo, casilla) y sí cumple 3:1 — WCAG 1.4.11.
  borde: '#E7DFCF',
  bordeFuerte: '#94835E', // 3.44:1 sobre fondo · 3.71:1 sobre tarjeta

  // Marca: albahaca. Es el color de "sí te alcanza" y también el de acción.
  primario: '#245239', // 8.32:1
  primarioOsc: '#183A26', // el press de los botones
  primarioClaro: '#33714F', // 5.38:1
  primarioSuave: '#E2EDE4',

  // ── Eje 1: lo que te alcanza ──────────────────────────────────────────
  alcanza: '#245239',
  alcanzaFill: '#2E6647',
  alcanzaSuave: '#E2EDE4',

  // ── Eje 2: el reloj de la comida ──────────────────────────────────────
  // Con tiempo de sobra (o sin fecha): piedra. No pide nada, no lleva acento.
  conTiempo: '#6B6153', // 5.63:1
  conTiempoFill: '#A0937F',
  conTiempoSuave: '#EFEADF',

  // Esta semana: ámbar. Úsalo pronto.
  estaSemana: '#8A5B06', // 5.44:1
  estaSemanaFill: '#E0A82E', // lleva tinta encima, no blanco: 8.35:1
  estaSemanaSuave: '#FAF0D8',

  // Hoy o mañana: terracota. Ya es urgente.
  pronto: '#A8481C', // 5.40:1
  prontoFill: '#B8551F',
  prontoSuave: '#FAE7DC',

  // Vencido: rojo terroso. Informa, no regaña.
  vencido: '#94302A', // 7.17:1
  vencidoFill: '#A8382F',
  vencidoSuave: '#F9E4E1',

  sobreOscuro: '#FFFFFF',
  sobreClaro: '#1A1712',
  foco: '#245239',
} as const

/** Los valores son `string` y no literales: si no, el tema oscuro exigiría los mismos hex. */
export type Paleta = { readonly [K in keyof typeof light]: string }

/**
 * En oscuro el fondo es LA DESPENSA CERRADA: marrón muy oscuro y cálido, nunca el
 * azul-gris de sistema. No es una inversión mecánica del tema claro.
 *
 * Se usa de noche frente a la nevera abierta, que suele ser la única luz del cuarto — por
 * eso el fondo baja tanto: un gris medio deslumbra en esa situación.
 */
export const dark: Paleta = {
  fondo: '#14110D',
  tarjeta: '#1F1B15',
  tarjetaAlt: '#2A241C',

  texto: '#F5EFE4', // 16.45:1
  texto2: '#C6BBA9', // 9.93:1
  texto3: '#9C9180', // 6.07:1
  borde: '#2E2820',
  bordeFuerte: '#756852', // 3.46:1 sobre fondo · 3.15:1 sobre tarjeta

  primario: '#7FC391', // 9.07:1
  primarioOsc: '#5FA774',
  primarioClaro: '#9BD4AA',
  primarioSuave: '#1A2B1F',

  alcanza: '#7FC391',
  alcanzaFill: '#2E6647',
  alcanzaSuave: '#1A2B1F',

  conTiempo: '#9C9180', // 6.07:1
  conTiempoFill: '#6B6153',
  conTiempoSuave: '#262119',

  estaSemana: '#E8B44A', // 9.91:1
  estaSemanaFill: '#8A5B06',
  estaSemanaSuave: '#2C2211',

  pronto: '#EC8A55', // 7.47:1
  prontoFill: '#A8481C',
  prontoSuave: '#2E1D12',

  vencido: '#E8756B', // 6.44:1
  vencidoFill: '#94302A',
  vencidoSuave: '#2E1715',

  sobreOscuro: '#FFFFFF',
  sobreClaro: '#14110D',
  foco: '#7FC391',
}

export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64 } as const

/**
 * La tarjeta de producto usa `md`. Los chips de estado van a `pill` porque tienen que
 * leerse como etiqueta pegada al alimento, no como botón.
 */
export const radius = { sm: 8, md: 14, lg: 12, pill: 999 } as const

/**
 * Fraunces (Undercase) para títulos y cifras: un serif de display con calidez deliberada
 * —tiene ejes de `SOFT` y `WONK` en la variable— que lee a artesanal sin caer en el
 * lettering de chalkboard que arrastra toda la categoría de comida.
 *
 * Public Sans para interfaz: derivada de Libre Franklin, hecha para uso público, altura-x
 * alta y muy legible en tamaños chicos y a distancia de brazo.
 *
 * Se descartó Nunito por ser la fuente "amigable por defecto", y Pacifico o cualquier
 * script por la misma razón por la que se descartan los emojis: leen a plantilla.
 */
export const fuente = {
  regular: 'PublicSans_400Regular',
  medio: 'PublicSans_500Medium',
  semi: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  // Display
  titulo: 'Fraunces_600SemiBold',
  tituloBold: 'Fraunces_700Bold',
  tituloBlack: 'Fraunces_900Black',
} as const

/** Nada por debajo de 13. El cuerpo arranca en 16: se lee de pie y a distancia de brazo. */
export const type = {
  cifraXL: { fontFamily: fuente.tituloBlack, fontSize: 40, lineHeight: 48, letterSpacing: -1.0 },
  cifraL: { fontFamily: fuente.tituloBold, fontSize: 27, lineHeight: 34, letterSpacing: -0.5 },
  cifraM: { fontFamily: fuente.tituloBold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  titulo: { fontFamily: fuente.tituloBold, fontSize: 23, lineHeight: 30, letterSpacing: -0.4 },
  subtitulo: { fontFamily: fuente.titulo, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  boton: { fontFamily: fuente.semi, fontSize: 17, lineHeight: 23, letterSpacing: 0.3 },
  cuerpo: { fontFamily: fuente.regular, fontSize: 16, lineHeight: 24 },
  cuerpoMed: { fontFamily: fuente.medio, fontSize: 16, lineHeight: 24 },
  apoyo: { fontFamily: fuente.regular, fontSize: 14, lineHeight: 21 },
  apoyoMed: { fontFamily: fuente.medio, fontSize: 14, lineHeight: 21 },
  /** Rótulo en versalitas, el único lugar con tracking positivo amplio. */
  rotulo: { fontFamily: fuente.semi, fontSize: 12, lineHeight: 16, letterSpacing: 1.1 },
  etiqueta: { fontFamily: fuente.bold, fontSize: 13, lineHeight: 18 },
} as const

/**
 * MODO COCINA — la escala de cuando estás preparando la receta.
 *
 * No es el "modo fácil" de Recargo y no se copió: allá el usuario tiene poco manejo
 * tecnológico y la app entera crece. Aquí el usuario ve bien, pero está DE PIE, a un metro
 * del teléfono, con las manos ocupadas o mojadas. La restricción es la distancia y el no
 * poder tocar, no la agudeza visual.
 *
 * Por eso esta escala solo existe en la pantalla de preparación —donde además se mantiene
 * la pantalla encendida— y solo agranda lo que se lee desde lejos: el paso actual y su
 * número. El resto de la app no cambia.
 */
export const typeCocina = {
  ...type,
  cuerpo: { ...type.cuerpo, fontSize: 22, lineHeight: 32 },
  cuerpoMed: { ...type.cuerpoMed, fontSize: 22, lineHeight: 32 },
  titulo: { ...type.titulo, fontSize: 27, lineHeight: 34 },
  cifraXL: { ...type.cifraXL, fontSize: 48, lineHeight: 56 },
  boton: { ...type.boton, fontSize: 21, lineHeight: 28 },
  apoyo: { ...type.apoyo, fontSize: 17, lineHeight: 25 },
  apoyoMed: { ...type.apoyoMed, fontSize: 17, lineHeight: 25 },
} as const

/** Estructural y no `typeof type`: con `as const` los tamaños son literales (16) y la
 *  escala del modo cocina (22) no encajaría. */
type EstiloTipo = {
  readonly fontFamily: string
  readonly fontSize: number
  readonly lineHeight: number
  readonly letterSpacing?: number
}
export type Tipografia = { readonly [K in keyof typeof type]: EstiloTipo }

/**
 * Áreas táctiles. 52dp de base y no los 48 del mínimo de Material: la app se toca con las
 * manos ocupadas y muchas veces con un solo pulgar mientras la otra mano sostiene algo.
 *
 * En modo cocina sube a 64 porque ahí se toca de pie, sin mirar de cerca y a veces con el
 * dorso del dedo para no ensuciar la pantalla.
 */
export const toque = { min: 52, boton: 56, chip: 40 } as const
export const toqueCocina = { min: 64, boton: 72, chip: 48 } as const
export type Toque = { readonly [K in keyof typeof toque]: number }

/**
 * Sombras con tinte de madera, no gris genérico. Muy contenidas: la elevación real la da
 * el borde de 1px, igual que en Recargo.
 */
export const sombra = {
  tarjeta: {
    shadowColor: '#3A2E1C',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  elevada: {
    shadowColor: '#3A2E1C',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  boton: {
    shadowColor: '#3A2E1C',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const
