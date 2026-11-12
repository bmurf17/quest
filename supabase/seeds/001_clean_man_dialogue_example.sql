-- Example dialogue tree for NPC id=7 (Clean Man).
--
-- This is seed/example data, not a schema migration. Run it manually after
-- the migrations (see supabase/README.md), and only in a development project.
-- Every insert is idempotent so the file can be re-run safely.

-- Insert dialogue tree
INSERT INTO npc_dialogues (id, npc_id, root_node_id, name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 7, '22222222-2222-2222-2222-222222222222', 'Clean Man Greeting')
ON CONFLICT (id) DO NOTHING;

-- Insert root dialogue node
INSERT INTO dialogue_nodes (id, dialogue_id, npc_text, speaker, is_endpoint)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Hello!!', 'NPC', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert player choices
INSERT INTO dialogue_choices (id, node_id, choice_text, next_node_id, sort_order)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Hello! Nice to meet you.', NULL, 0),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Go away!', NULL, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert outcomes for choices
-- "Hello!" leads to friendly
INSERT INTO dialogue_outcomes (id, node_id, choice_id, outcome_type, flag_key, flag_value)
VALUES
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'npc_friendly', 'met_clean_man', 'true')
ON CONFLICT (id) DO NOTHING;

-- "Go away!" leads to NPC leaving
INSERT INTO dialogue_outcomes (id, node_id, choice_id, outcome_type, flag_key, flag_value)
VALUES
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'npc_leave', 'angered_clean_man', 'true')
ON CONFLICT (id) DO NOTHING;
