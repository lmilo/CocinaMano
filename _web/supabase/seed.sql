-- ============================================================
-- Cocina a Mano — Seed de desarrollo
-- ============================================================
-- SOLO PARA DESARROLLO LOCAL. No desplegar en producción.
--
-- Como la app usa login anónimo, no conocemos de antemano el user_id.
-- Solución: una función que llena la despensa de un usuario dado y un
-- trigger que la dispara cuando se crea CUALQUIER usuario nuevo. Así, al
-- pulsar "Entrar" siempre verás la app con datos.
--
-- Las fechas de caducidad son relativas a CURRENT_DATE para que los
-- estados (vencido / vence hoy / por vencer) se vean siempre vigentes.
--
-- Nota de costos: unit_cost es el precio POR UNIDAD del ingrediente
-- (por g, por taza, por unidad, etc.), de modo que cantidad × unit_cost
-- da el costo de esa línea y la suma coincide con total_cost.
-- ============================================================

create or replace function public.seed_demo_inventory(target_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  -- Idempotente: si el usuario ya tiene inventario, no duplicamos.
  if exists (select 1 from products where user_id = target_uid) then
    return;
  end if;

  -- ─── Inventario ──────────────────────────────────────────
  insert into products (user_id, name, category, quantity, unit, unit_price, expiry_date) values
    (target_uid, 'Arroz',            'despensa',   2,   'kg',        3200, null),
    (target_uid, 'Frijol cargamanto','despensa',   1,   'kg',        6500, null),
    (target_uid, 'Pasta',            'despensa',   500, 'g',         2800, current_date + 210),
    (target_uid, 'Aceite de girasol','despensa',   1,   'L',         9000, current_date + 120),
    (target_uid, 'Atún en lata',     'despensa',   3,   'unidades',  4200, current_date + 300),
    (target_uid, 'Lentejas',         'despensa',   500, 'g',         3500, null),
    (target_uid, 'Ajo',              'despensa',   1,   'unidades',  1800, null),
    (target_uid, 'Sal',              'especias',   1,   'kg',        1500, null),
    (target_uid, 'Comino molido',    'especias',   50,  'g',         2000, current_date + 365),
    (target_uid, 'Leche entera',     'nevera',     1,   'L',         4500, current_date + 2),
    (target_uid, 'Huevos',           'nevera',     12,  'unidades',  9000, current_date + 10),
    (target_uid, 'Queso campesino',  'nevera',     250, 'g',         7000, current_date - 1),
    (target_uid, 'Yogur natural',    'nevera',     1,   'L',         6000, current_date),
    (target_uid, 'Mantequilla',      'nevera',     250, 'g',         5500, current_date + 30),
    (target_uid, 'Tomate',           'nevera',     6,   'unidades',  3000, current_date + 3),
    (target_uid, 'Cebolla',          'nevera',     3,   'unidades',  2000, current_date + 14),
    (target_uid, 'Zanahoria',        'nevera',     4,   'unidades',  2500, current_date + 9),
    (target_uid, 'Pollo',            'congelador', 1,   'kg',       12000, current_date + 60),
    (target_uid, 'Carne molida',     'congelador', 500, 'g',        11000, current_date + 45),
    (target_uid, 'Pan tajado',       'panaderia',  1,   'unidades',  4800, current_date + 1),
    (target_uid, 'Jugo de naranja',  'bebidas',    1.5, 'L',         5500, current_date + 5);

  -- ─── Recetas (unit_cost = precio por unidad de medida) ───

  -- 1. Arroz con pollo · total 9320
  insert into recipes (user_id, name, description, servings, total_cost, is_ai_generated, cooked, rating, steps, cuisine_type)
  values (target_uid, 'Arroz con pollo', 'Clásico arroz colombiano con pollo tierno y vegetales.', 4, 9320, false, true, 5,
    '[{"order":1,"description":"Sofríe la cebolla y el ajo en aceite hasta dorar."},
      {"order":2,"description":"Agrega el pollo troceado y sella por todos los lados."},
      {"order":3,"description":"Añade la zanahoria en cubos, el arroz y 4 tazas de agua."},
      {"order":4,"description":"Salpimienta, tapa y cocina a fuego bajo por 20 minutos."}]'::jsonb,
    'colombiana')
  returning id into rid;
  insert into recipe_ingredients (recipe_id, ingredient_name, quantity, unit, unit_cost) values
    (rid, 'arroz',     2,   'tazas',         700),
    (rid, 'pollo',     500, 'g',              12),
    (rid, 'zanahoria', 1,   'unidades',      600),
    (rid, 'cebolla',   1,   'unidades',      700),
    (rid, 'ajo',       3,   'unidades',      100),
    (rid, 'aceite',    2,   'cucharadas',    150),
    (rid, 'sal',       1,   'cucharaditas',   20);

  -- 2. Frijoles paisas · total 8570
  insert into recipes (user_id, name, description, servings, total_cost, is_ai_generated, cooked, rating, steps, cuisine_type)
  values (target_uid, 'Frijoles paisas', 'Frijol cargamanto espeso, base de la bandeja paisa.', 6, 8570, false, true, 4,
    '[{"order":1,"description":"Remoja los frijoles la noche anterior."},
      {"order":2,"description":"Cocínalos en olla a presión con cebolla y ajo por 40 minutos."},
      {"order":3,"description":"Sofríe un hogao con tomate y cebolla, e incorpóralo."},
      {"order":4,"description":"Ajusta sal y cocina destapado hasta espesar."}]'::jsonb,
    'colombiana')
  returning id into rid;
  insert into recipe_ingredients (recipe_id, ingredient_name, quantity, unit, unit_cost) values
    (rid, 'frijol',  500, 'g',              13),
    (rid, 'cebolla', 1,   'unidades',      700),
    (rid, 'tomate',  2,   'unidades',      500),
    (rid, 'ajo',     2,   'unidades',      100),
    (rid, 'aceite',  1,   'cucharadas',    150),
    (rid, 'sal',     1,   'cucharaditas',   20);

  -- 3. Huevos pericos · total 4220
  insert into recipes (user_id, name, description, servings, total_cost, is_ai_generated, steps, cuisine_type)
  values (target_uid, 'Huevos pericos', 'Desayuno rápido de huevos revueltos con tomate y cebolla.', 2, 4220, false,
    '[{"order":1,"description":"Sofríe la cebolla y el tomate picados."},
      {"order":2,"description":"Bate los huevos con sal y viértelos en la sartén."},
      {"order":3,"description":"Revuelve a fuego medio hasta cuajar al punto deseado."}]'::jsonb,
    'colombiana')
  returning id into rid;
  insert into recipe_ingredients (recipe_id, ingredient_name, quantity, unit, unit_cost) values
    (rid, 'huevos',  4, 'unidades',     750),
    (rid, 'tomate',  1, 'unidades',     500),
    (rid, 'cebolla', 1, 'unidades',     700),
    (rid, 'sal',     1, 'cucharaditas',  20);

  -- 4. Pasta al atún · total 5120
  insert into recipes (user_id, name, description, servings, total_cost, is_ai_generated, steps, cuisine_type)
  values (target_uid, 'Pasta al atún', 'Pasta rápida con atún, ajo y aceite de oliva.', 3, 5120, false,
    '[{"order":1,"description":"Hierve la pasta en agua con sal hasta al dente."},
      {"order":2,"description":"Dora el ajo en aceite y agrega el atún escurrido."},
      {"order":3,"description":"Mezcla la pasta con la salsa y sirve caliente."}]'::jsonb,
    'italiana')
  returning id into rid;
  insert into recipe_ingredients (recipe_id, ingredient_name, quantity, unit, unit_cost) values
    (rid, 'pasta',  300, 'g',             6),
    (rid, 'atún',   2,   'unidades',   1400),
    (rid, 'ajo',    2,   'unidades',    100),
    (rid, 'aceite', 2,   'cucharadas',  150),
    (rid, 'sal',    1,   'cucharaditas',  20);

  -- 5. Lentejas guisadas · total 5620
  insert into recipes (user_id, name, description, servings, total_cost, is_ai_generated, steps, cuisine_type)
  values (target_uid, 'Lentejas guisadas', 'Lentejas con verduras, económicas y nutritivas.', 4, 5620, false,
    '[{"order":1,"description":"Cocina las lentejas en agua hasta ablandar."},
      {"order":2,"description":"Aparte sofríe cebolla, ajo y zanahoria en cubos."},
      {"order":3,"description":"Une todo, ajusta sal y cocina 10 minutos más."}]'::jsonb,
    'colombiana')
  returning id into rid;
  insert into recipe_ingredients (recipe_id, ingredient_name, quantity, unit, unit_cost) values
    (rid, 'lentejas',  500, 'g',             7),
    (rid, 'zanahoria', 2,   'unidades',    600),
    (rid, 'cebolla',   1,   'unidades',    700),
    (rid, 'ajo',       2,   'unidades',    100),
    (rid, 'sal',       1,   'cucharaditas',  20);
end;
$$;

-- ─── Trigger: poblar cada usuario nuevo (dev) ───────────────
create or replace function public.handle_new_user_seed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_demo_inventory(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed on auth.users;
create trigger on_auth_user_created_seed
  after insert on auth.users
  for each row execute function public.handle_new_user_seed();

-- ─── Poblar los usuarios que ya existen ─────────────────────
do $$
declare u record;
begin
  for u in select id from auth.users loop
    perform public.seed_demo_inventory(u.id);
  end loop;
end;
$$;
