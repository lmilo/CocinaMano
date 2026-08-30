/**
 * Lo que el usuario acepta al entrar, y su versión.
 *
 * SE GUARDA LA VERSIÓN Y NO UN BOOLEANO. Quien ya tenía la app instalada nunca vuelve a
 * pasar por la bienvenida, así que si el texto cambia —sobre todo la parte de qué sale del
 * teléfono— esta es la única puerta por la que pasa. El usuario aceptó UN texto, no la idea
 * de aceptar. Subir este número vuelve a pedir la aceptación a todo el mundo.
 *
 * El texto completo vive en TERMINOS.md y PRIVACIDAD.md, en la raíz del repo.
 */
export const VERSION_LEGAL = '1'

export const FECHA_LEGAL = '30 de agosto de 2026'

/** El resumen honesto. Lo largo está en los documentos; esto es lo que de verdad importa. */
export const PUNTOS_CLAVE = [
  {
    icono: 'cellphone-lock' as const,
    titulo: 'Todo vive en tu teléfono',
    texto:
      'Tu despensa, tus recetas y tu lista no se suben a ningún lado. No hay cuenta ni contraseña.',
  },
  {
    icono: 'cloud-upload-outline' as const,
    titulo: 'Salvo dos cosas, que activas tú',
    texto:
      'La foto de una factura y la lista de ingredientes para generar una receta se mandan a un servicio de IA. Nada más sale, y solo cuando tocas ese botón.',
  },
  {
    icono: 'content-save-outline' as const,
    titulo: 'El respaldo lo guardas tú',
    texto:
      'Como nada se sube, nada se recupera solo. Si pierdes el teléfono se pierde, así que guarda un respaldo de vez en cuando.',
  },
  {
    icono: 'eye-check-outline' as const,
    titulo: 'La app avisa, tu nariz decide',
    texto:
      'La fecha que ves es la que se registró. La app no sabe cómo guardaste el producto: antes de comer algo, míralo y huélelo.',
  },
]

/** Una sección del texto legal, para pintarla sin depender de un lector de Markdown. */
export type SeccionLegal = { titulo: string; parrafos: string[] }

export const PRIVACIDAD: SeccionLegal[] = [
  {
    titulo: 'Lo corto',
    parrafos: [
      'Tu despensa, tus recetas y tu lista de compras viven solo en tu teléfono. No hay cuenta, no hay servidor donde se guarden y nadie más puede verlas — ni siquiera quien hizo la app.',
      'Hay dos excepciones, y son las dos únicas veces que algo sale de tu teléfono. Las dos las activas tú, tocando un botón: leer una factura y generar una receta con IA.',
    ],
  },
  {
    titulo: 'Qué se guarda en tu teléfono',
    parrafos: [
      'Los productos de tu despensa con su cantidad, precio y fecha de vencimiento. Las recetas que escribas o generes. Tu lista de compras. Los códigos de barras que hayas escaneado y el nombre que les diste. Tus preferencias de tema y avisos.',
      'Todo eso se borra por completo al desinstalar la app o desde Yo → Borrar todo.',
      'No hay respaldo automático: es la consecuencia directa de no pedirte una cuenta. Por eso está Yo → Guardar un respaldo, y el archivo queda donde tú lo pongas.',
    ],
  },
  {
    titulo: 'Al leer una factura',
    parrafos: [
      'Se manda la foto del recibo a un servidor propio en Cloudflare, que la reenvía a la API de Google Gemini para extraer los productos. La foto no se almacena: se usa para la lectura y se descarta.',
      'Un recibo puede traer datos que no son de comida: el nombre del almacén, la fecha, a veces los últimos dígitos de una tarjeta. Si eso te preocupa, tapa esa parte antes de la foto, o carga el mercado dictándolo o por código de barras, que no salen del teléfono.',
    ],
  },
  {
    titulo: 'Al generar una receta',
    parrafos: [
      'Se manda la lista de nombres de ingredientes que tienes y los parámetros que elegiste. No se manda tu despensa completa, ni precios, ni fechas.',
    ],
  },
  {
    titulo: 'El identificador de instalación',
    parrafos: [
      'En esos dos casos viaja también un número aleatorio que sirve únicamente para limitar cuántas veces por hora se puede usar el servicio. No está ligado a tu nombre, tu correo ni tu cuenta de Google: nace con la app instalada y muere cuando la desinstalas.',
      'No se manda tu ubicación, tus contactos, ni ningún identificador del dispositivo.',
    ],
  },
  {
    titulo: 'Al escanear un código de barras',
    parrafos: [
      'Se consulta el código en Open Food Facts, una base de datos pública y abierta. Solo viaja el número del código de barras.',
    ],
  },
  {
    titulo: 'Publicidad',
    parrafos: [
      'La app muestra un banner de Google AdMob. Google puede usar identificadores de publicidad del dispositivo según su propia política, y eso lo controlas desde los ajustes de privacidad de Android.',
    ],
  },
  {
    titulo: 'Permisos',
    parrafos: [
      'Cámara para leer códigos y fotografiar facturas. Micrófono para dictar. Fotos para elegir una factura ya tomada. Notificaciones para avisarte antes de que algo se venza.',
      'Ninguno es obligatorio: si niegas alguno, esa entrada deja de estar y el resto de la app funciona igual.',
    ],
  },
]

export const TERMINOS: SeccionLegal[] = [
  {
    titulo: 'Qué es',
    parrafos: [
      'Cocina a Mano lleva la cuenta de lo que tienes en la despensa, te avisa antes de que algo se venza y te dice qué recetas te alcanzan con eso. Es una herramienta de organización doméstica.',
    ],
  },
  {
    titulo: 'La app avisa, tu criterio decide',
    parrafos: [
      'La fecha de vencimiento que la app maneja es la que tú escribiste o la que se leyó de un empaque. La app no sabe cómo guardaste el producto, si se rompió la cadena de frío ni si el empaque estaba abierto.',
      'Antes de comer algo, míralo, huélelo y usa tu criterio. La app dice cuándo tocaba revisarlo, no si está bueno.',
    ],
  },
  {
    titulo: 'No es asesoría nutricional ni médica',
    parrafos: [
      'No considera alergias, intolerancias ni condiciones de salud. Si tienes una alergia alimentaria, lee siempre los ingredientes del empaque: ni el catálogo de recetas ni la generación con IA son una fuente confiable para eso.',
    ],
  },
  {
    titulo: 'Lo que hace la IA puede estar mal',
    parrafos: [
      'Las recetas generadas pueden proponer combinaciones malas, tiempos incorrectos o cantidades desproporcionadas. Trátalas como la sugerencia de alguien que no está en tu cocina.',
      'La lectura de facturas también se equivoca, y por eso la app siempre te muestra lo que entendió antes de guardar nada.',
      'Los precios y costos son estimaciones basadas en lo que tú registraste. No sirven para contabilidad.',
    ],
  },
  {
    titulo: 'Responsabilidad',
    parrafos: [
      'La app se ofrece como está. Quien la hizo no responde por comida que se dañe, por una receta que no salga bien, ni por datos que se pierdan al perder o formatear el teléfono. Esto no pretende limitar responsabilidades que la ley colombiana no permita limitar.',
    ],
  },
]
