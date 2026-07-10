# 🍳 Cocina a Mano

App web para **gestionar tu inventario de ingredientes y descubrir qué recetas puedes preparar con lo que ya tienes en casa**. Cada receta muestra un *match score* contra tu despensa para que decidas qué cocinar sin pasar por el supermercado.

---

## ✨ Funcionalidades

- 🔐 **Login anónimo** con Supabase — entras de un clic, sin correo ni contraseña.
- 📦 **Inventario de productos** — nombre, cantidad, unidad, categoría, precio unitario y fecha de caducidad.
- 📖 **Catálogo de recetas** con ingredientes, pasos, porciones y coste estimado.
- 🎯 **Match Badge** — porcentaje de ingredientes que tienes vs los que requiere la receta, con normalización de unidades.
- ✍️ **Crear recetas** manualmente o **generarlas con IA** (Gemini) a partir de los ingredientes disponibles.
- 🛒 **Lista de compras** — añade ítems sueltos, márcalos como comprados.
- ⭐ **Marcar como preparada y valorar** cada receta con una nota de 1 a 5 estrellas.
- 📊 **Dashboard** con estadísticas de inventario y recetas posibles.
- 🔔 **Toasts** de feedback y **manejo de errores** centralizado.
- 📱 **PWA instalable** y responsive con Tailwind CSS.

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Vue 3 (`<script setup>`) + TypeScript |
| **Build** | Vite 8 (+ `vite-plugin-pwa`) |
| **Estado** | Pinia 3 |
| **Routing** | Vue Router 4 |
| **Estilos** | Tailwind CSS 4 (vía `@tailwindcss/vite`) |
| **Backend / Auth / DB** | Supabase (Postgres + Auth + Edge Functions) |
| **IA** | Google Gemini (`gemini-2.5-flash`) vía Edge Function |
| **Utilidades** | `@vueuse/core` |
| **Tests** | Vitest |
| **CI** | GitHub Actions (`.github/workflows/ci.yml`) |
| **Deploy** | Vercel (`vercel.json`) |

---

## 📂 Estructura

```
CocinaMano/
├── src/
│   ├── views/              # Auth, Dashboard, Inventory, Recipes, RecipeDetail,
│   │                       # RecipeCreate, RecipeGenerate, ShoppingList
│   ├── components/         # AppLayout, ProductCard, ProductFormModal, RecipeCard,
│   │                       # MatchBadge, StatCard, StarRating, ToastHost, ErrorBanner
│   ├── stores/             # auth, products, recipes, shopping, toast (Pinia)
│   ├── lib/                # supabase (cliente), recipeMatching, units, errors
│   ├── router/             # rutas con guard de autenticación
│   ├── types/              # tipos compartidos del dominio
│   ├── data/               # catálogo base de recetas (baseRecipes.json)
│   ├── App.vue
│   └── main.ts
├── supabase/
│   ├── migrations/         # 001_initial_schema.sql, 002_shopping_list.sql
│   ├── functions/          # generate-recipe (Edge Function de IA)
│   ├── seed.sql            # datos de ejemplo para desarrollo local
│   └── config.toml         # configuración de Supabase CLI
├── .github/workflows/      # ci.yml (type-check + build + tests)
├── public/
├── vite.config.ts
└── vercel.json
```

---

## 🚀 Setup local

### 1. Requisitos
- **Node.js 20+** (CI corre en Node 24).
- Proyecto en [Supabase](https://supabase.com) (o la Supabase CLI con Docker para desarrollo local).

### 2. Variables de entorno
Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### 3. Aplicar el schema
Ejecuta las migraciones de `supabase/migrations/` desde el SQL Editor de tu proyecto, o con la CLI (`supabase db push`). Con Supabase local (`npm run db`) se aplican automáticamente.

### 4. Instalar y correr

```bash
npm install
npm run dev      # http://localhost:5173
```

---

## 🚀 Levantar en local (orden para `/run`)

Stack local: **Supabase CLI (Docker)** + **Edge Function de IA (Gemini)** + **Vite**.
Levantar SIEMPRE en este orden:

1. **Infraestructura (DB + Auth + API):** `npm run db`
   _(la primera vez baja imágenes de Docker; aplica las migraciones de `supabase/migrations/` automáticamente.)_
2. **Backend de IA (Edge Function):** `npm run functions` _(en segundo plano)_
   _Requiere `supabase/functions/.env` con `GEMINI_API_KEY=...` (ver abajo)._
3. **Frontend:** `npm run dev`

Variables de entorno necesarias:
- Raíz `.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (con Supabase local: `http://127.0.0.1:54321` y el `anon key` que imprime `supabase start`).
- `supabase/functions/.env` → `GEMINI_API_KEY` (clave gratuita de [Google AI Studio](https://aistudio.google.com/apikey); **ignorada por git**). Sin ella, la IA responde con error claro pero el resto de la app funciona.

---

## 📦 Scripts

```bash
npm run dev         # frontend (Vite) — http://localhost:5173
npm run build       # type-check con vue-tsc + build de producción
npm run preview     # previsualizar el build
npm run db          # levanta Supabase local (Docker) — supabase start
npm run db:stop     # detiene Supabase local
npm run functions   # sirve la Edge Function de IA con su .env
npm run test        # tests unitarios (Vitest, una pasada)
npm run test:watch  # tests en modo watch
```

---

## 🧪 Tests

Tests unitarios con **Vitest** sobre la lógica pura (`src/lib/`): matching de recetas, normalización de unidades y manejo de errores.

```bash
npm run test
```

El workflow de **CI** (`.github/workflows/ci.yml`) corre en cada push y PR: type-check + build + tests.

---

## ☁️ Deploy

Configurado para **Vercel** (`vercel.json` con rewrites para SPA). Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el dashboard del proyecto y conecta el repositorio — el build (`npm run build`) y el output (`dist/`) se detectan automáticamente.
