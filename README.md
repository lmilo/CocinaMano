# 🍳 Cocina a Mano

App web para **gestionar tu inventario de ingredientes y descubrir qué recetas puedes preparar con lo que ya tienes en casa**. Cada receta muestra un *match score* contra tu despensa para que decidas qué cocinar sin pasar por el supermercado.

---

## ✨ Funcionalidades

- 🔐 **Autenticación** con Supabase (email/contraseña).
- 📦 **Inventario de productos** — nombre, cantidad, unidad, categoría, fecha de caducidad.
- 📖 **Catálogo de recetas** con ingredientes, pasos y porciones.
- 🎯 **Match Badge** — porcentaje de ingredientes que tienes vs los que requiere la receta.
- ✍️ **Crear recetas** manualmente o **generarlas** a partir de los ingredientes disponibles.
- 📊 **Dashboard** con estadísticas de inventario y recetas posibles.
- 📱 **Responsive** con Tailwind CSS.

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | Vue 3 (`<script setup>`) + TypeScript |
| **Build** | Vite 8 |
| **Estado** | Pinia 3 |
| **Routing** | Vue Router 4 |
| **Estilos** | Tailwind CSS 4 (vía `@tailwindcss/vite`) |
| **Backend / Auth / DB** | Supabase (Postgres + Auth + Edge Functions) |
| **Utilidades** | `@vueuse/core` |
| **Deploy** | Vercel (config en `vercel.json`) |

---

## 📂 Estructura

```
CocinaMano/
├── src/
│   ├── views/              # AuthView, DashboardView, InventoryView, RecipesView...
│   ├── components/         # AppLayout, ProductCard, RecipeCard, MatchBadge, StatCard...
│   ├── stores/             # auth.ts, products.ts, recipes.ts (Pinia)
│   ├── router/             # rutas con guard de autenticación
│   ├── lib/                # cliente de Supabase
│   ├── types/              # tipos compartidos
│   ├── data/               # seeds / datos estáticos
│   ├── App.vue
│   └── main.ts
├── supabase/
│   ├── migrations/         # 001_initial_schema.sql
│   └── functions/          # Edge functions
├── public/
├── vite.config.ts
└── vercel.json
```

---

## 🚀 Setup local

### 1. Requisitos
- **Node.js 20+**
- Proyecto en [Supabase](https://supabase.com) creado.

### 2. Variables de entorno
Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### 3. Aplicar el schema en Supabase
Ejecuta `supabase/migrations/001_initial_schema.sql` desde el SQL Editor de tu proyecto Supabase (o con `supabase db push` si usas la CLI).

### 4. Instalar y correr

```bash
npm install
npm run dev      # http://localhost:5173
```

---

## 📦 Scripts

```bash
npm run dev      # servidor de desarrollo
npm run build    # type-check con vue-tsc + build de producción
npm run preview  # previsualizar el build
```

---

## ☁️ Deploy

El proyecto está configurado para **Vercel** (`vercel.json`). Define las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el dashboard del proyecto y conecta el repositorio — el build (`npm run build`) y el output (`dist/`) se detectan automáticamente.
