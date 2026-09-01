# BRAND — Cocina a Mano

## 1. A quién le hablamos (y por qué eso manda sobre todo lo demás)

No es un *foodie*. No colecciona recetas ni fotografía sus platos.

Es quien acaba de llegar del mercado con seis bolsas y no sabe dónde meter nada. Es quien
abre la nevera a las 7 p.m. con hambre y sin plan. Es quien encuentra, al fondo del cajón,
una libra de tomates que ya no sirve — y le duele, porque los pagó.

La app se usa **de pie, con las manos ocupadas o mojadas, con poca paciencia y mirando de
reojo**. Eso no es una nota de contexto: es la restricción que gobierna cada decisión de este
documento. Área táctil de 52dp, cuerpo desde 16px, y nada que exija precisión de dedo ni
lectura de párrafo.

## 2. Concepto: LA DESPENSA

La app no gestiona recetas. **Gestiona lo que ya compraste.** La receta es la consecuencia,
no el punto.

De ahí sale todo lo visual: papel de estraza, harina, madera clara. El tema oscuro no es "la
noche" genérica — es **la despensa cerrada**, marrón profundo y cálido. Nunca el azul-gris de
sistema, que es el color de las apps que no eligieron ninguno.

## 3. La tesis del producto

**No lista recetas: mide lo que te alcanza.**

Un catálogo de recetas lo tiene cualquiera, y Google tiene más. Lo que un recetario no puede
hacer —y esta app sí— es saber que **te falta un solo ingrediente para tres platos distintos**,
y que uno de esos ingredientes ya lo tienes pero se vence el jueves.

El enemigo declarado es **el desperdicio**. Todo lo que no sirva a eso sobra.

## 4. Los dos ejes de color, y ninguno decora

```
verde albahaca   →   lo que te alcanza        (coincidencia alta, ingrediente que sí tienes)
ámbar → rojo     →   el reloj de la comida    (cuánto le queda antes de perderse)
```

**Lo que tiene tiempo de sobra es piedra.** No lleva acento porque no pide nada. Es la misma
regla del día sin recargo en Recargo: el color se gasta solo donde hay algo que decir.

La escala del reloj tiene cuatro estados y ninguno es negociable:

| Estado | Cuándo | Color | Qué comunica |
|---|---|---|---|
| Con tiempo | >7 días, o sin fecha | Piedra | Nada. Existe y ya. |
| Esta semana | ≤7 días | Ámbar | Úsalo pronto. |
| Hoy o mañana | ≤2 días | Terracota | Ya es urgente. |
| Vencido | Pasó la fecha | Rojo terroso | Se perdió. |

## 5. El dinero NO es acento (y aquí me separo de Recargo)

Recargo pinta el dinero de oro porque **el producto ES sobre dinero**: cuánto ganaste de más.

Aquí el precio se muestra en texto normal, sin color. La app conoce el precio unitario y el
coste estimado del plato, pero darle acento movería la atención al lugar equivocado: el
problema del usuario no es cuánto costó el tomate, es que el tomate se le está dañando. El
dinero es la consecuencia del desperdicio, no el tema.

Copiar el oro de Recargo habría sido lo cómodo y lo incorrecto.

## 6. Qué NO es

- **No es una red social de comida.** No hay fotos de platos terminados, ni likes, ni feed.
- **No es un contador de calorías.** No pesa a nadie ni opina sobre lo que come.
- **No es un planificador de *meal prep* semanal.** Nadie planea la semana; la gente abre la
  nevera y decide en ese momento. La app trabaja en ese momento.
- **No promete que vas a cocinar bien.** Promete que no vas a botar comida.

## 7. Cero emojis

Los iconos son vectoriales: `@expo/vector-icons` para interfaz y `react-native-svg` para lo
que necesite silueta propia — las siete categorías de producto y el indicador de caducidad.

Un emoji es tipografía del sistema: cambia de forma entre fabricantes de Android, no se tiñe
con los tokens, no se anima y no da control de peso visual. La versión web de esta app usaba
veinte, y era la señal más rápida de que no estaba terminada.

## 8. Voz y copy

Segunda persona, frases cortas, **sin signos de admiración**.

> «Te faltan 2 para el ajiaco» — no «¡Solo te faltan 2 ingredientes!»

**Nunca regañar por lo que se venció.** La app informa, no juzga:

> «Se venció el jueves» — no «¡Se te dañó!»

El usuario ya sabe que perdió plata. Recordárselo con signos de admiración no cambia su
conducta, solo hace que cierre la app. Y una app cerrada no evita ningún desperdicio.

Las cantidades se dicen como se dicen en la casa: **libras**, no gramos, cuando el usuario
las escribió en libras.

## 9. Los dos temas

**Claro** es el modo por defecto: una cocina con luz, papel y harina.

**Oscuro** es la despensa cerrada. Importa más de lo que parece: la app se usa de noche
frente a la nevera abierta, que suele ser la única luz del cuarto. Un fondo gris medio
deslumbra en esa situación, así que el fondo baja hasta `#14110D` — profundo, pero cálido.

## 10. Qué recordará quien la use

Que abrió la nevera sin idea de qué hacer, miró el teléfono, y en un vistazo supo que le
alcanzaba para tres cosas — y cuál de ellas convenía hacer hoy.
