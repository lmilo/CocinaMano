# Política de datos — Cocina a Mano

**Versión 1 · 30 de agosto de 2026**

## Lo corto

Tu despensa, tus recetas y tu lista de compras **viven solo en tu teléfono**. No hay cuenta,
no hay servidor donde se guarden y nadie más puede verlas — ni siquiera quien hizo la app.

Hay **dos excepciones**, y son las dos únicas veces que algo sale de tu teléfono. Las dos las
activas tú, a propósito, tocando un botón:

1. **Leer una factura.** La foto que tomas se manda para que la lea un servicio de
   inteligencia artificial, que devuelve la lista de productos.
2. **Generar una receta con IA.** Se manda la lista de ingredientes que tienes.

## Qué se guarda en tu teléfono

- Los productos de tu despensa, con su cantidad, precio y fecha de vencimiento.
- Las recetas que escribas o generes, y cuáles marcaste como preparadas.
- Tu lista de compras.
- Los códigos de barras que hayas escaneado y el nombre que les diste.
- Tus preferencias: tema, avisos y con cuántos días de anticipación.

Todo eso se borra por completo cuando desinstalas la app o cuando usas **Yo → Borrar todo**.

**No hay respaldo automático.** Es la consecuencia directa de no pedirte una cuenta: si
pierdes el teléfono, se pierde. Por eso la app tiene **Yo → Guardar un respaldo**, y el
archivo que sale queda donde tú lo pongas.

## Qué sale del teléfono, exactamente

### Al leer una factura

Se manda **la foto del recibo** a un servidor propio en Cloudflare, que la reenvía a la API
de Google Gemini para extraer los productos.

- La foto **no se almacena** ni en ese servidor ni en la app: se usa para la lectura y se
  descarta.
- Un recibo de supermercado puede traer datos que no son de comida —el nombre del almacén,
  la fecha, una caja, a veces los últimos dígitos de una tarjeta—. **Si eso te preocupa,
  tapa esa parte antes de la foto, o carga el mercado dictándolo o por código de barras**,
  que no salen del teléfono.

### Al generar una receta

Se manda **la lista de nombres de ingredientes** que tienes y los parámetros que elegiste
(porciones, tipo de plato). No se manda tu despensa completa, ni precios, ni fechas.

### En ambos casos

Se manda un **identificador aleatorio de instalación**, que sirve únicamente para limitar
cuántas veces por hora se puede usar el servicio. No está ligado a tu nombre, tu correo, tu
teléfono ni tu cuenta de Google: es un número que nace con la app instalada y muere cuando
la desinstalas.

**No se manda** tu ubicación, tu lista de contactos, ni ningún identificador del dispositivo.

### Al escanear un código de barras

Se consulta el código en [Open Food Facts](https://world.openfoodfacts.org), una base de
datos pública y abierta. Solo viaja el número del código de barras.

## Publicidad

La app muestra un banner de Google AdMob. Google puede usar identificadores de publicidad
del dispositivo según [su propia política](https://policies.google.com/technologies/ads).
Eso lo controlas desde los ajustes de Android, en la sección de privacidad y anuncios.

## Permisos y para qué

| Permiso | Para qué | Si lo niegas |
|---|---|---|
| Cámara | Leer códigos de barras y fotografiar facturas | Puedes agregar a mano o dictando |
| Micrófono | Dictar el mercado | Puedes escribirlo |
| Fotos | Elegir la foto de una factura ya tomada | Puedes tomarla en el momento |
| Notificaciones | Avisarte antes de que algo se venza | La app funciona igual, sin avisos |

Ninguno es obligatorio para usar la app.

## Menores de edad

La app no está dirigida a menores de 13 años y no recoge datos a sabiendas de ellos.

## Cambios

Si esta política cambia de forma que afecte lo que sale de tu teléfono, la app te la vuelve
a mostrar antes de seguir usándola. No basta con haber aceptado una versión anterior.

## Contacto

Escribe a quien hizo la app desde la ficha de Google Play.
