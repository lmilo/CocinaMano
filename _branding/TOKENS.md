# TOKENS — Sistema de diseño

Los valores viven en `src/constants/tokens.ts`. Este documento explica **por qué** son esos y
no otros. Todos los ratios se calcularon con la fórmula WCAG y se verificaron contra el fondo
donde de verdad se pintan.

## 1. Tipografía: dos familias con oficio

**Fraunces** (Undercase) para títulos y cifras. Es un serif de display con calidez
deliberada — tiene ejes de `SOFT` y `WONK` en su versión variable, o sea que fue diseñada
para poder ser irregular a propósito. Da lo artesanal sin caer en el *lettering* de pizarra
de café que arrastra toda la categoría de comida.

**Public Sans** para interfaz. Derivada de Libre Franklin, hecha para uso público: altura-x
alta, formas abiertas, muy legible en tamaños chicos y **a distancia de brazo**, que es la
distancia real de esta app.

Se descartó **Nunito** por ser la fuente "amigable por defecto", y cualquier *script* o
manuscrita por lo mismo que se descartan los emojis: leen a plantilla, no a producto.

| Token | Familia | px / interlínea | Dónde |
|---|---|---|---|
| `cifraXL` | Fraunces 900 | 40 / 48 | El número grande del panel: cuántas recetas te alcanzan |
| `cifraL` | Fraunces 700 | 27 / 34 | Porcentaje de coincidencia en el detalle |
| `cifraM` | Fraunces 700 | 19 / 25 | Cantidades en la tarjeta de producto |
| `titulo` | Fraunces 700 | 23 / 30 | Título de pantalla y de receta |
| `subtitulo` | Fraunces 600 | 17 / 24 | Encabezado de sección |
| `boton` | Public Sans 600 | 17 / 23 | — |
| `cuerpo` | Public Sans 400 | 16 / 24 | El piso. Nada de texto de lectura baja de aquí |
| `apoyo` | Public Sans 400 | 14 / 21 | Secundario: fecha, categoría, precio |
| `rotulo` | Public Sans 600 | 12 / 16, +1.1 | Versalitas. El único tracking positivo amplio |
| `etiqueta` | Public Sans 700 | 13 / 18 | Pestañas y chips |

Nada por debajo de 13. El cuerpo arranca en 16 y no se negocia.

## 2. Color — tema claro

Sustrato de papel de estraza: `#FAF6ED`. Más cálido y más amarillo que el hueso de Recargo,
porque este no es un cuarto de noche — es una cocina con luz.

| Token | Hex | Contraste sobre fondo |
|---|---|---|
| `texto` | `#1A1712` | 16.57:1 |
| `texto2` | `#4E463A` | 8.61:1 |
| `texto3` | `#6B6153` | 5.63:1 |
| `primario` | `#245239` | 8.32:1 |
| `bordeFuerte` | `#94835E` | 3.44:1 (mínimo no textual) |

`borde` (`#E7DFCF`) **separa y no informa**, así que no tiene mínimo de contraste.
`bordeFuerte` es el borde de un control —campo de texto, casilla— y por eso sí cumple 3:1,
según WCAG 1.4.11. Confundir los dos es el error clásico: o se pinta todo con un gris que no
se ve, o se pinta todo con uno que ensucia la pantalla.

## 3. Los colores con significado

**Eje 1 — lo que te alcanza:**

| Token | Claro | Oscuro | Significa |
|---|---|---|---|
| `alcanza` | `#245239` | `#7FC391` | Coincidencia alta, ingrediente que sí tienes |

**Eje 2 — el reloj de la comida:**

| Token | Claro | Oscuro | Umbral |
|---|---|---|---|
| `conTiempo` | `#6B6153` | `#9C9180` | >7 días o sin fecha |
| `estaSemana` | `#8A5B06` | `#E8B44A` | ≤7 días |
| `pronto` | `#A8481C` | `#EC8A55` | ≤2 días |
| `vencido` | `#94302A` | `#E8756B` | Pasó la fecha |

Cada uno tiene su `…Fill` (relleno sólido de chip) y su `…Suave` (fondo de cápsula).

**El relleno ámbar es la excepción que hay que recordar:** `estaSemanaFill` (`#E0A82E`) es
demasiado claro para texto blanco. Lleva **tinta** encima, no blanco — 8.35:1. Es el único
relleno de la paleta que se comporta así, y es exactamente el tipo de detalle que se rompe
solo cuando alguien copia y pega el estilo del chip de al lado.

**El color nunca va solo.** Un daltónico protanopo no distingue el ámbar del terracota, así
que cada estado del reloj lleva además texto («se vence el jueves», «se venció») y una
silueta de icono distinta. El color acelera la lectura de quien lo ve; no es el canal único
para nadie.

## 4. Color — tema oscuro: la despensa cerrada

No es una inversión mecánica del tema claro. El fondo (`#14110D`) baja mucho más de lo que
pide el contraste porque la app se usa **de noche frente a la nevera abierta**, que suele ser
la única luz del cuarto: un gris medio deslumbra en esa situación.

Los acentos se aclaran e invierten su relación con el relleno — en claro `alcanza` es el
verde profundo y `alcanzaFill` el más claro; en oscuro es al revés. Por eso `Paleta` se tipa
como `string` y no con los literales de `light`: forzar los mismos hex habría hecho imposible
esta inversión.

## 5. Espaciado, forma y tacto

Escala de 4: `space[1]`=4 … `space[16]`=64.

Radios: `sm`=8, `lg`=12 (botones), `md`=14 (tarjetas), `pill`=999. Los chips de estado van a
`pill` porque tienen que leerse como **etiqueta pegada al alimento**, no como botón que se
puede tocar.

**Áreas táctiles de 52dp**, no los 48 del mínimo de Material. La app se toca con las manos
ocupadas y muchas veces con un solo pulgar mientras la otra mano sostiene una bolsa.

## 6. Modo cocina

No es el "modo fácil" de Recargo, y no se copió. Allá el usuario tiene poco manejo
tecnológico y la app entera crece. **Aquí el usuario ve bien, pero está de pie, a un metro
del teléfono, con las manos sucias.** La restricción es la distancia y el no poder tocar, no
la agudeza visual.

Por eso el modo cocina:

- Existe **solo en la pantalla de preparación**, no en toda la app.
- Agranda únicamente lo que se lee desde lejos: el paso actual (16 → 22px) y su número.
- Sube el área táctil a 64dp, porque ahí se toca a veces con el dorso del dedo.
- Mantiene la pantalla encendida (`expo-keep-awake`). Que se apague a mitad de un sofrito y
  haya que desbloquear con las manos llenas de aceite es el fallo más caro de esta pantalla.

## 7. Movimiento

Contenido y funcional. Transición lateral entre pantallas, `fade` para las de entrada.

La háptica se reserva para **confirmaciones que el usuario no puede verificar mirando**: el
código de barras que sí leyó, el producto que se guardó desde el dictado por voz. Son los dos
momentos en que no está viendo la pantalla. En todo lo demás sobra.
