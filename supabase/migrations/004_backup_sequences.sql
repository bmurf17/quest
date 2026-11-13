-- Backup/restore helper: reset serial sequences after restoring explicit ids.
--
-- A restore inserts rows with their original primary keys, which does not
-- advance Postgres identity sequences. Without this reset the next insert can
-- collide with a restored id. Run this in the Supabase SQL editor (or
-- `supabase db push`) before using the admin backup restore feature.
--
-- This discovers every single-column integer `id` in the public schema that
-- owns a sequence, rather than using a hardcoded table list. That means it
-- covers `shop_stock` (migration 003) and any content tables added later, and
-- it safely skips UUID ids such as `items.id` and composite keys such as
-- `quest_rewards`.

CREATE OR REPLACE FUNCTION reset_content_sequences()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target RECORD;
  seq_name TEXT;
  max_id BIGINT;
BEGIN
  FOR target IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'id'
      AND c.data_type IN ('smallint', 'integer', 'bigint')
      AND pg_get_serial_sequence(
        format('public.%I', c.table_name),
        c.column_name
      ) IS NOT NULL
    ORDER BY c.table_name
  LOOP
    seq_name := pg_get_serial_sequence(
      format('public.%I', target.table_name),
      target.column_name
    );
    IF seq_name IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'SELECT COALESCE(MAX(%I), 0) FROM public.%I',
      target.column_name,
      target.table_name
    ) INTO max_id;

    PERFORM setval(seq_name, GREATEST(max_id, 1), max_id > 0);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_content_sequences() TO anon, authenticated;
