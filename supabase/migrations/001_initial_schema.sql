-- ============================================================
-- Cocina a Mano — Initial Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE product_category AS ENUM (
  'nevera',
  'congelador',
  'despensa',
  'especias',
  'panaderia',
  'bebidas',
  'otro'
);

CREATE TYPE unit_type AS ENUM (
  'kg',
  'g',
  'L',
  'ml',
  'unidades',
  'tazas',
  'cucharadas',
  'cucharaditas'
);

-- ─── TABLES ──────────────────────────────────────────────────

-- Products (user inventory)
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    product_category NOT NULL DEFAULT 'despensa',
  quantity    NUMERIC(10, 3) NOT NULL DEFAULT 0,
  unit        unit_type NOT NULL DEFAULT 'unidades',
  unit_price  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipes
CREATE TABLE recipes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  servings         INTEGER NOT NULL DEFAULT 4,
  total_cost       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
  steps            JSONB NOT NULL DEFAULT '[]'::jsonb,
  cuisine_type     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe ingredients (snapshot of cost at creation time)
CREATE TABLE recipe_ingredients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id        UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  ingredient_name  TEXT NOT NULL,
  quantity         NUMERIC(10, 3) NOT NULL DEFAULT 0,
  unit             unit_type NOT NULL DEFAULT 'unidades',
  unit_cost        NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX recipes_user_id_idx ON recipes(user_id);
CREATE INDEX recipe_ingredients_recipe_id_idx ON recipe_ingredients(recipe_id);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Products: users only see/modify their own rows
CREATE POLICY "products: own rows only" ON products
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recipes: users only see/modify their own rows
CREATE POLICY "recipes: own rows only" ON recipes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recipe ingredients: accessible through recipe ownership
CREATE POLICY "recipe_ingredients: via recipe ownership" ON recipe_ingredients
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
