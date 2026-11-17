-- Allow the local/solo admin (anon key) to manage dialogue content.
--
-- 001_dialogue_system.sql only allowed authenticated users to write, but the
-- admin has no auth session yet. Reads already worked, so inserts into
-- npc_dialogues/dialogue_nodes returned 401 Unauthorized from the room
-- creator and the dialogue editor. The admin is a local tool, so match the
-- permissive policy already used for shop_stock.
--
-- Apply this file in the Supabase SQL editor (or `supabase db push`) against
-- the live project. Without it, dialogue writes fail with:
--   new row violates row-level security policy for table "npc_dialogues"

GRANT SELECT, INSERT, UPDATE, DELETE
  ON npc_dialogues, dialogue_nodes, dialogue_choices, dialogue_outcomes, conversation_flags
  TO anon, authenticated;

DROP POLICY IF EXISTS "Allow manage npc_dialogues" ON npc_dialogues;
CREATE POLICY "Allow manage npc_dialogues"
  ON npc_dialogues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage dialogue_nodes" ON dialogue_nodes;
CREATE POLICY "Allow manage dialogue_nodes"
  ON dialogue_nodes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage dialogue_choices" ON dialogue_choices;
CREATE POLICY "Allow manage dialogue_choices"
  ON dialogue_choices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage dialogue_outcomes" ON dialogue_outcomes;
CREATE POLICY "Allow manage dialogue_outcomes"
  ON dialogue_outcomes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manage conversation_flags" ON conversation_flags;
CREATE POLICY "Allow manage conversation_flags"
  ON conversation_flags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
