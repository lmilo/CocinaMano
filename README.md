# Cocina a Mano

App móvil para no botar comida: lleva la cuenta de lo que hay en la despensa, avisa antes de
que algo se venza, y dice qué recetas te alcanzan con eso.

La tesis del producto: **no lista recetas, mide lo que te alcanza**. Un catálogo lo tiene
cualquiera y Google tiene más. Lo que un recetario no puede hacer es saber que te falta un
solo ingrediente para tres platos, y que uno de los que ya tienes se vence el jueves.

## Qué hace

- **Cargar la despensa por cuatro caminos**: foto de la factura, código de barras, dictado
  por voz, o a mano.
- **Avisar** antes de que algo se venza, con un solo aviso al día y agrupado.
- **Ordenar las recetas por lo que te falta**, subiendo las que aprovechan lo que se está
  por perder.
- **Mandar lo que falta a la lista de compras** de un toque, y devolverlo a la despensa
  cuando lo compres.
- **Cocinar** en modo de pantalla encendida, un paso por vez y con letra grande.
- **Exportar**: la receta en PDF, la lista al chat, y un respaldo del todo.

## Estado

**Escrita y verificada en el escritorio; todavía no se ha instalado en un teléfono.** Eso es
lo que falta y no es un detalle: las tres capacidades nuevas —cámara, códigos y voz— solo se
pueden juzgar de verdad con el mercado de una semana en la mano. Ver
[Lo que falta](#lo-que-falta).

| | |
|---|---|
| Pruebas | 90, sobre la lógica pura (coincidencia, unidades, caducidad, avisos, dictado, estado) |
| Typecheck | sin errores, en la app y en el Worker |
| Empaquetado | Metro compila para Android |
| Plataforma | Android. iOS compilaría, pero no es un destino soportado |
| Datos | 100% en el teléfono, sin cuentas ni servidor |
| Catálogo | 50 recetas, auditadas contra el enum de unidades en la suite |
| Accesibilidad | contrastes AA verificados con la fórmula · tema claro/oscuro · modo cocina |
| Legal | términos y política de datos aceptados en el primer arranque |

## Correrla

```bash
npm install
npx expo start
```

> **En Expo Go funciona casi todo**, incluida la cámara (`expo-camera` y
> `expo-image-picker` son del SDK), así que el escáner de códigos y la lectura de facturas
> con IA se pueden probar ahí.
>
> Lo que **no** existe en Expo Go es el **dictado por voz** (`expo-speech-recognition` no es
> paquete oficial de Expo), los **avisos** (`expo-notifications` perdió soporte en Android
> desde el SDK 53) y los **anuncios**. Los tres cargan protegidos, así que la app no se cae:
> simplemente esas entradas no están, y la pantalla de ajustes lo explica. En el APK sí.

```bash
npm test            # 90 pruebas de la lógica pura
npx tsc --noEmit    # tipos
python3 scripts/icono.py   # regenera los iconos desde la marca
```

## Armar el APK

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

`preview` arma un APK instalable; `production` arma el `.aab` de Play Store y es el **único**
perfil que activa los anuncios reales. Ver [Anuncios](#anuncios).

## El Worker (la IA)

La app es offline. El único servidor existe porque **la clave de Gemini no puede viajar
dentro del APK**: cualquiera desempaqueta un `.aab` y la saca.

Está en **Cloudflare Workers y no en una Edge Function de Supabase**, que es de donde viene
el código de `/receta`. Un proyecto gratuito de Supabase se pausa por inactividad, y una app
instalada que deja de funcionar al tercer mes es peor que una que nunca lo tuvo.

```bash
cd worker
npm install
npx wrangler login

# La clave de Gemini, cifrada. La que venía del proyecto Supabase quedó en worker/.dev.vars
# (ignorada por git, y es también donde `wrangler dev` la lee en local).
npx wrangler secret put GEMINI_API_KEY

# El tope de peticiones (opcional pero recomendado)
npx wrangler kv namespace create LIMITES
# → pega el id que imprime en wrangler.toml y descomenta el bloque

npx wrangler deploy
```

Después, la URL que devuelve va en el `.env` de la raíz:

```bash
cp .env.example .env
# EXPO_PUBLIC_WORKER_URL=https://cocina-a-mano.camiloarinconc.workers.dev
```

**Ya está desplegado** en esa URL, con la clave como secret y el KV `LIMITES` enlazado.

**Sin esa variable la app funciona completa**, solo que la lectura de facturas y la
generación con IA avisan que no están disponibles. Todo lo demás es local.

Para probarlo sin teléfono:

```bash
curl -X POST https://cocina-a-mano.camiloarinconc.workers.dev/receta \
  -H 'content-type: application/json' \
  -d '{"ingredientes":[{"nombre":"arroz","unidad":"tazas"},{"nombre":"pollo","unidad":"g"}],"porciones":2}'
```

## Decisiones que explican el código

**No hay cuentas, y por eso no hay servidor de datos.** La versión web usaba login anónimo de
Supabase, que tenía lo peor de los dos mundos: dependía de un servidor pero no daba
recuperación real —borrabas la app y perdías todo igual—. Sin cuentas ese punto de falla no
existe. La contrapartida honesta es que **la exportación es el respaldo**, y la app lo dice.

**El match mira las cantidades.** Antes solo comprobaba presencia por palabra: tener 5 g de
arroz puntuaba igual que tener 5 kg, y la app decía "te alcanza" cuando no alcanzaba. Ahora
compara cuando las unidades son convertibles y **admite que no puede** cuando no lo son —
masa y volumen no se convierten sin densidades, y una tabla inventada daría cifras que
parecen exactas y no lo son.

**Un solo tipo de receta.** Antes las del catálogo y las del usuario eran tipos distintos y
el match solo aceptaba el primero, así que las recetas propias y las generadas con IA
quedaban fuera justo del match, que es lo único que hace útil tenerlas.

**La libra son 500 g, no 453,592.** Es una decisión de dominio: la avoirdupois es la del
sistema imperial, y la de la plaza de mercado en Colombia es medio kilo. Usar el valor
imperial metería un 10% de error en cada compra por ser técnicamente correcto en un sistema
que aquí nadie usa.

**Solo se funden productos sin fecha.** Si tienes leche que se vence mañana y compras leche
nueva, sumarlas borraría el reloj del lote viejo — que es exactamente lo que la app existe
para no dejar perder. El arroz y la sal sí se funden, que es donde fundir no cuesta nada.

**El dictado se parsea en local, sin IA.** De "dos libras de arroz" a `{2, lb, arroz}` no hay
nada que un modelo haga mejor que una tabla, y mandarlo a la red costaría una llamada, una
espera y que la función deje de servir sin señal — justo cuando alguien está guardando el
mercado.

**Lo que la IA lee siempre pasa por revisión.** Un recibo trae abreviaturas que ningún modelo
acierta al 100% (`LCH DSLC 1LT`), y meter basura al inventario envenena el match. La app
puede equivocarse leyendo; no puede equivocarse guardando.

**El color codifica dos ejes y ninguno decora.** Verde albahaca para lo que te alcanza, y la
escala ámbar → terracota → rojo para el reloj de la comida. Lo que tiene tiempo de sobra
queda en piedra, sin acento, porque no pide nada. Los contrastes están calculados con la
fórmula WCAG y verificados contra el fondo donde de verdad se pintan. Ver `_branding/`.

**El dinero no lleva acento**, a diferencia de Recargo. Allá el producto es sobre dinero;
aquí el problema no es cuánto costó el tomate, es que se está dañando.

**Cero emojis.** La versión web usaba veinte como iconos. Un emoji es tipografía del sistema:
cambia de forma entre fabricantes, no se tiñe con los tokens y no se anima.

## Los documentos legales

`TERMINOS.md` y `PRIVACIDAD.md` de este repositorio son la **fuente de verdad**, y están
publicados en el portafolio porque Google Play exige una URL pública y estable:

| | |
|---|---|
| Tratamiento de datos | `https://camilorc.netlify.app/legal/cocina-a-mano/privacidad` |
| Términos de uso | `https://camilorc.netlify.app/legal/cocina-a-mano/terminos` |

Esa primera es la que va en la ficha de Play Console. Si se rompe, la ficha queda
apuntando a un 404 y eso es motivo de suspensión.

**Al cambiar los `.md` de aquí hay que traer el cambio allá**, a
`app/utils/legalCocina.ts` en el repositorio del portafolio, y subir `VERSION_LEGAL` en
`src/constants/legal.ts` para que la app vuelva a pedir la aceptación. La fecha de vigencia
es lo que permite detectar que se desincronizaron.

## Anuncios

Los IDs de prueba son el valor por defecto **a propósito**. Tocar tus propios anuncios reales
es actividad inválida y Google cierra cuentas por eso; los APK de perfil `preview` son los
que se instalan a mano para probar, y en ellos `__DEV__` es `false`. Por eso la unidad real
solo entra con `EXPO_PUBLIC_ADS_REALES`, que **solo** define el perfil `production` de
`eas.json`.

Falta crear la app en AdMob (`com.crincon.cocinamano`) y poner el `androidAppId` real en
`app.json` y la unidad real en `src/lib/anuncios.ts`.

## Estructura

```
src/
├── app/            # expo-router: (tabs), producto/, receta/, capturar/, bienvenida, legal
├── components/     # ui.tsx (base), dominio.tsx (tarjetas), BannerAnuncio
├── constants/      # tokens.ts (el sistema de diseño), legal.ts
└── lib/
    ├── dominio.ts       # los tipos, en un solo sitio
    ├── acciones.ts      # transformaciones puras del estado (probadas)
    ├── store.tsx        # React + AsyncStorage sobre acciones.ts
    ├── coincidencia.ts  # cuánto te alcanza de cada receta
    ├── caducidad.ts     # el reloj de la comida
    ├── unidades.ts      # conversión y normalización
    ├── voz.ts           # parseo del dictado (local, sin IA)
    ├── ia.ts · codigo.ts · avisos.ts · anuncios.ts · reconocedor.ts · exportar.ts
datos/recetas-base.json  # el catálogo, dentro del bundle
worker/                  # el Worker de Cloudflare
_branding/               # BRAND · TOKENS · LAYOUT · MOODBOARD
```

## Lo que falta

- **Probarla en un teléfono real con el mercado de una semana.** Es lo único que puede
  juzgar si el matching sirve: "pechuga de pollo" en la receta contra `POLLO PECHUGA BAND
  500G` en la factura no coinciden con tokens y plurales. El caché de códigos y la pantalla
  de revisión lo mitigan, pero **es el punto donde esto se gana o se pierde**.
- Desplegar el Worker y poner `EXPO_PUBLIC_WORKER_URL`.
- Crear la app en AdMob y poner los IDs reales.
- Tomar capturas del APK para la ficha del portafolio y para Play Store.

## De dónde viene

Era una PWA en Vue 3 + Vite + Pinia + Tailwind con Supabase detrás. El producto —"qué puedo
cocinar con lo que ya tengo"— se usa **de pie en la cocina, con el mercado en la mano**, y
ese es un lugar de teléfono, no de navegador.

De la versión web sobrevivieron la lógica de matching, las unidades, el catálogo y el modelo
de dominio. Las vistas, los stores de Pinia y el esquema de Postgres no: Vue no cruza a React
Native, y sin cuentas no hace falta una base de datos.

Esa versión ya no está en la rama, pero **no se perdió**: vive completa en `main` y en el
historial de `movil`. Para consultarla, `git show main:_web/views/RecipesView.vue` o
`git checkout main -- _web`.

El estándar técnico está tomado de [Recargo](../recargo), que es la otra app Android de este
portafolio: mismo stack, misma disciplina de decisiones escritas, y las mismas trampas ya
resueltas —módulos nativos cargados con protección, IDs de anuncios de prueba por defecto, y
el store que no puede leerse por fuera del snapshot con el React Compiler activo.
