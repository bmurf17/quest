-- Items and shop stock
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- Shop stock belongs to a named shop. `shop_key` is `town` for the town shop
-- or `npc:<id>` for a merchant's personal stock. A NULL quantity means the
-- item is always in stock; a number is limited stock remaining.
--
-- `item_id` copies the type of `items.id`, because projects differ: the checked
-- in baseline declares it TEXT, while the live project uses UUID. Deriving the
-- type keeps this migration runnable on both.
DO $$
DECLARE
  item_id_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
  INTO item_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.items'::regclass
    AND a.attname = 'id'
    AND NOT a.attisdropped;

  IF item_id_type IS NULL THEN
    RAISE EXCEPTION 'Could not find public.items.id';
  END IF;

  EXECUTE format($f$
    CREATE TABLE IF NOT EXISTS shop_stock (
      id SERIAL PRIMARY KEY,
      shop_key TEXT NOT NULL,
      item_id %s NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE (shop_key, item_id)
    )
  $f$, item_id_type);
END $$;

CREATE INDEX IF NOT EXISTS idx_shop_stock_shop_key ON shop_stock(shop_key);

-- The admin is a local/solo tool, so allow the anon key to manage stock.
ALTER TABLE shop_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read shop_stock" ON shop_stock;
CREATE POLICY "Allow read shop_stock" ON shop_stock FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage shop_stock" ON shop_stock;
CREATE POLICY "Allow manage shop_stock" ON shop_stock FOR ALL USING (true) WITH CHECK (true);

-- Seed the town shop from the existing item rows. Limited quantities make the
-- "buy removes stock" behaviour visible straight away.
INSERT INTO shop_stock (shop_key, item_id, quantity, sort_order)
SELECT
  'town',
  id,
  CASE name
    WHEN 'Health Potion' THEN 10
    WHEN 'Mana Potion' THEN 5
    ELSE NULL
  END,
  ROW_NUMBER() OVER (ORDER BY name)
FROM items
ON CONFLICT (shop_key, item_id) DO NOTHING;
