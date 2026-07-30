-- Add new columns to the enemies table for boss battles, moves, and enhanced mechanics

ALTER TABLE enemies
  ADD COLUMN IF NOT EXISTS exp_gain INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'enemy' CHECK (type IN ('enemy', 'boss')),
  ADD COLUMN IF NOT EXISTS max_health INTEGER,
  ADD COLUMN IF NOT EXISTS phase INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phase_thresholds JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS moves JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spawns JSONB DEFAULT '[]'::jsonb;
