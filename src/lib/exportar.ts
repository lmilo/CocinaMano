import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Estado, ESTADO_INICIAL } from './acciones'
import type { RecetaEvaluada } from './coincidencia'
import { escalar } from './coincidencia'
import { formatearCantidad } from './unidades'

/**
 * Sacar cosas de la app.
 *
 * SIN SERVIDOR, LA EXPORTACIÓN ES EL RESPALDO. Es la contrapartida honesta de no pedirle una
 * cuenta a nadie: nada se sube, así que nada se recupera solo. Un respaldo que no se puede
 * restaurar no es un respaldo, por eso aquí están las dos mitades.
 */

const VERSION_RESPALDO = 1

type Respaldo = {
  app: 'cocina-a-mano'
  version: number
  cuandoISO: string
  estado: Estado
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * La receta como PDF.
 *
 * Los estilos van en línea y con colores fijos: el PDF sale del teléfono y se ve en el de
 * otra persona, donde los tokens del tema no significan nada. Aquí sí conviene el papel
 * blanco de toda la vida.
 */
export async function compartirRecetaPDF(
  evaluada: RecetaEvaluada,
  porciones: number,
): Promise<void> {
  const { receta } = evaluada

  const ingredientes = receta.ingredientes
    .map((i) => {
      const cantidad = formatearCantidad(escalar(i.cantidad, receta.porciones, porciones), i.unidad)
      return `<li><span>${escapar(i.nombre)}</span><b>${escapar(cantidad)}</b></li>`
    })
    .join('')

  const pasos = receta.pasos
    .map((p) => `<li>${escapar(p.texto)}</li>`)
    .join('')

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1A1712; padding: 40px 44px; line-height: 1.55; }
  h1 { font-size: 30px; margin: 0 0 6px; letter-spacing: -0.4px; }
  .apoyo { color: #6B6153; font-size: 14px; margin: 0 0 28px; }
  h2 { font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase; color: #6B6153;
       border-bottom: 1px solid #E7DFCF; padding-bottom: 6px; margin: 28px 0 12px; }
  ul.ingredientes { list-style: none; padding: 0; margin: 0; }
  ul.ingredientes li { display: flex; justify-content: space-between; gap: 20px;
       padding: 7px 0; border-bottom: 1px dotted #E7DFCF; font-size: 15px; }
  ol { padding-left: 20px; margin: 0; }
  ol li { margin-bottom: 12px; font-size: 15px; }
  footer { margin-top: 40px; color: #94835E; font-size: 12px;
       border-top: 1px solid #E7DFCF; padding-top: 12px; }
</style></head>
<body>
  <h1>${escapar(receta.nombre)}</h1>
  <p class="apoyo">${escapar(receta.descripcion)}${receta.descripcion ? ' · ' : ''}Para ${porciones} ${porciones === 1 ? 'persona' : 'personas'}</p>

  <h2>Qué lleva</h2>
  <ul class="ingredientes">${ingredientes}</ul>

  <h2>Cómo se hace</h2>
  <ol>${pasos}</ol>

  <footer>Cocina a Mano</footer>
</body></html>`

  const { uri } = await Print.printToFileAsync({ html })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: receta.nombre })
  }
}

/** Nombre con fecha: quien guarde varios respaldos necesita distinguirlos de un vistazo. */
function nombreDeRespaldo(): string {
  const hoy = new Date()
  const f = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  return `cocina-a-mano-${f}.json`
}

export async function exportarRespaldo(estado: Estado): Promise<void> {
  const respaldo: Respaldo = {
    app: 'cocina-a-mano',
    version: VERSION_RESPALDO,
    cuandoISO: new Date().toISOString(),
    estado,
  }

  const archivo = new File(Paths.cache, nombreDeRespaldo())
  if (archivo.exists) archivo.delete()
  archivo.create()
  archivo.write(JSON.stringify(respaldo, null, 2))

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(archivo.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Guardar el respaldo',
    })
  }
}

export class ErrorRespaldo extends Error {}

/**
 * Lee un respaldo y devuelve el estado, o `null` si el usuario canceló.
 *
 * Valida que el archivo sea de esta app antes de tocar nada: restaurar un JSON cualquiera
 * dejaría la app en un estado imposible, y el usuario habría perdido su despensa a cambio
 * de nada.
 */
export async function leerRespaldo(): Promise<Estado | null> {
  const elegido = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  })
  if (elegido.canceled || !elegido.assets[0]) return null

  let crudo: string
  try {
    crudo = await new File(elegido.assets[0].uri).text()
  } catch {
    throw new ErrorRespaldo('No se pudo abrir ese archivo.')
  }

  let datos: Respaldo
  try {
    datos = JSON.parse(crudo)
  } catch {
    throw new ErrorRespaldo('Ese archivo no es un respaldo de Cocina a Mano.')
  }

  if (datos?.app !== 'cocina-a-mano' || typeof datos.estado !== 'object' || datos.estado === null) {
    throw new ErrorRespaldo('Ese archivo no es un respaldo de Cocina a Mano.')
  }
  if (datos.version > VERSION_RESPALDO) {
    throw new ErrorRespaldo('Ese respaldo es de una versión más nueva de la app.')
  }

  // Se mezcla contra el inicial para que un respaldo viejo, sin los campos que se hayan
  // añadido después, no llegue a las pantallas con propiedades en `undefined`.
  return { ...ESTADO_INICIAL, ...datos.estado }
}
