-- ============================================================
-- Cocina a Mano — Lista de compras
-- ============================================================

CREATE TABLE shopping_list_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  quantity    NUMERIC(10, 3) CHECK (quantity IS NULL OR quantity > 0),
  unit        unit_type,
  checked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX shopping_list_items_user_id_idx ON shopping_list_items(user_id);

ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO authenticated;

CREATE POLICY "shopping: own rows only" ON shopping_list_items
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
