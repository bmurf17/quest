-- Boss and enemy rewards.
--
-- Rewards are stored on the enemy so a defeat pays out once per kill:
--   gold_reward  — gold granted when this enemy is defeated.
--   reward_items — JSON array of full item snapshots (same approach as spawns).
--                  Full snapshots avoid the items.id UUID/TEXT mismatch across
--                  projects and keep combat reward handling synchronous.
ALTER TABLE enemies
  ADD COLUMN IF NOT EXISTS gold_reward INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_items JSONB NOT NULL DEFAULT '[]'::jsonb;
