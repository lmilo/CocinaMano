# LAYOUT — Arquitectura y pantallas

## 1. Navegación

`Stack` en la raíz y las pestañas dentro del grupo `(tabs)`, igual que en Recargo: así la
barra inferior existe **solo** en las cuatro pantallas principales y no aparece en la
bienvenida, en la captura por cámara ni en el modo cocina.

```
DESPENSA        QUÉ COCINO        LISTA           YO
qué tengo       qué me alcanza    qué me falta    ajustes
```

Cuatro pestañas, icono vectorial **y** palabra. Nunca icono solo: "despensa" y "lista" no
tienen un símbolo universal, y un icono ambiguo obliga a explorar tocando.

## 2. Guardia de entrada

Sin perfil → `bienvenida`. Términos sin aceptar (o versión nueva) → `legal`. Solo después,
la app. El contenido protegido **no se pinta** mientras haya una redirección pendiente.

No hay clave de 4 números como en Recargo: allá protege el sueldo, que es información
sensible de verdad. Lo que hay en una despensa no lo es, y una fricción sin motivo se paga en
abandono.

## 3. DESPENSA — `(tabs)/index.tsx`

Lo primero de la pantalla **no es el inventario, es el reloj**: una banda superior con lo que
está por perderse.

> **3 cosas se vencen esta semana** → toca y filtra la lista

Si no hay nada por vencerse, la banda no existe. Un contador en cero ocupando el mejor
espacio de la pantalla es ruido.

**Agrupación por urgencia, por defecto.** Es la tesis del producto. Con un conmutador a
agrupar por categoría (nevera, congelador, despensa…), que es el orden útil en el otro
momento de uso: cuando estás guardando el mercado y quieres ver si ya tenías arroz.

**Los tres caminos de entrada van visibles en una barra**, no escondidos tras un `+`:

```
[ Factura ]  [ Código ]  [ Dictar ]  [ A mano ]
```

Esconderlos detrás de un botón flotante sería enterrar justamente lo que hace que esta app
valga la pena en un teléfono. La fricción de cargar la despensa es el problema número uno del
producto; la solución no puede estar a dos toques.

**Vacío inicial:** no un dibujo con "¡Aún no tienes productos!". Una frase y los cuatro
caminos: *«Empieza por la factura del último mercado — es lo más rápido.»*

## 4. QUÉ COCINO — `(tabs)/cocinar.tsx`

Arriba, la cifra grande (`cifraXL`) y el único número que importa:

> **12** recetas te alcanzan

Filtros rápidos: **Me alcanza todo · Me falta 1 · Me falta 2**.

«Me falta 1» es el filtro más valioso de la app y merece estar de primero después de «todo»:
es el único que es accionable — ese ingrediente se manda a la lista de compras de un toque.

**La tarjeta de receta conecta los dos ejes de color**, y ese es el momento estrella del
producto:

> **Ajiaco** · te alcanza todo
> *Usa los tomates que se vencen mañana*

Una receta que consume algo urgente sube en el orden y lleva el acento del reloj además del
de coincidencia. Nada más en la app justifica tanto tener las dos cosas —inventario y
recetas— en el mismo lugar.

## 5. DETALLE DE RECETA — `receta/[id].tsx`

Ingredientes con estado explícito por cada uno: **tienes** (verde) / **falta** (piedra, no
rojo — que te falte algo no es un error). Porciones escalables, que recalculan cantidades y
coste. Pasos numerados.

Tres acciones: **Preparar** (entra a modo cocina), **Agregar lo que falta a la lista**, y
marcar preparada con estrellas al terminar.

## 6. PREPARAR — `receta/preparar.tsx` (modo cocina)

Un paso por pantalla, `cuerpo` a 22px, área táctil de 64dp, pantalla siempre encendida.
Sin barra de pestañas. Avance con toque grande a los lados o deslizando.

El temporizador vive aquí si el paso menciona minutos, no como una función aparte.

## 7. LISTA — `(tabs)/compras.tsx`

Ítems marcables, agregar suelto, y **compartir como texto plano al chat** — que es como
viaja de verdad una lista de mercado en Colombia.

Al marcar comprado, la app ofrece **pasarlo a la despensa** pidiendo cantidad y precio. Eso
cierra el ciclo del producto: compras → despensa → recetas → lista. Si ese paso no existe, el
inventario se desactualiza en una semana y el match empieza a mentir.

## 8. YO — `(tabs)/ajustes.tsx`

Tema (sistema / claro / oscuro), días de antelación del aviso de caducidad, respaldo y
exportación, términos y política, borrar todo y empezar de cero, versión.

La prueba de aviso de 5 segundos, igual que en Recargo: es la única forma de que alguien
confirme que las notificaciones le funcionan sin esperar a mañana.

## 9. CAPTURAR — `capturar/*.tsx`

**Factura** — foto o galería → «leyendo la factura» → **pantalla de revisión, obligatoria**.
Lista editable de lo que se extrajo, con lo dudoso marcado. Nunca se guarda directo: un
recibo trae abreviaturas que ningún modelo acierta al 100% (`LCH DSLC 1LT`), y meter basura
al inventario envenena el match, que es el producto entero.

**Código** — visor de cámara, háptica al leer. Si el EAN es conocido (Open Food Facts o
caché local), confirma con el nombre; si no, formulario con el código ya puesto y lo que el
usuario escriba **se guarda para la próxima vez**.

**Dictar** — botón grande de mantener pulsado, texto en vivo, y el resultado como chips
editables antes de guardar. Nunca guarda a ciegas.

Las tres terminan en revisión. El principio es el mismo: **la app puede equivocarse leyendo,
pero no puede equivocarse guardando**.

## 10. Reglas transversales

- **Cero emojis.** Iconos vectoriales.
- **El color nunca va solo:** todo estado del reloj lleva además texto e icono propio.
- **Vacíos que enseñan**, no que se disculpan: cada pantalla vacía dice cuál es el
  siguiente paso, no que no hay datos.
- **Todo funciona sin señal** salvo factura y generación con IA, que lo dicen antes de
  intentarlo y no rompen nada al fallar.
- **Nada de diálogos nativos de confirmación** salvo para borrar todo.
- El texto escala con el ajuste del sistema. La única excepción son las cuatro palabras de
  las pestañas, que no caben en 360dp con la letra al máximo.
