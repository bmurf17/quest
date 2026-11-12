-- Schema baseline for the core game tables.
--
-- The original tables were created by hand in the Supabase SQL editor before
-- migrations were added, so the numbered migrations only describe changes to
-- that pre-existing schema. This baseline makes a fresh project reproducible
-- from the repository: run it first, then 001 and 002 in order.
--
-- The statements are idempotent so the baseline is also safe to apply to an
-- existing project as a no-op. Regenerate/inspect the live schema with
-- `pnpm db:baseline` when the database changes.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE direction_enum AS ENUM ('North', 'South', 'East', 'West');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE interaction_type_enum AS ENUM (
    'NPC',
    'chest',
    'camp',
    'transition',
    'cutscene'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Core content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  img TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('consumable', 'equipment')),
  effect TEXT,
  hp_change INTEGER,
  mana_change INTEGER,
  stack_size INTEGER,
  slot TEXT,
  attack INTEGER,
  defense INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enemies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  health INTEGER NOT NULL DEFAULT 1,
  strength INTEGER NOT NULL DEFAULT 0,
  defense INTEGER NOT NULL DEFAULT 0,
  dex INTEGER NOT NULL DEFAULT 0,
  img TEXT NOT NULL DEFAULT '',
  -- Legacy camelCase column kept because existing rows still have it.
  "expGain" INTEGER,
  exp_gain INTEGER NOT NULL DEFAULT 10,
  type TEXT NOT NULL DEFAULT 'enemy' CHECK (type IN ('enemy', 'boss')),
  max_health INTEGER,
  phase INTEGER DEFAULT 1,
  phase_thresholds JSONB DEFAULT '[]'::jsonb,
  moves JSONB DEFAULT '[]'::jsonb,
  spawns JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quest_type TEXT NOT NULL,
  fetch_item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
  defeat_enemy_id INTEGER REFERENCES enemies(id) ON DELETE SET NULL,
  explore_room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS npcs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dialogue TEXT[] NOT NULL DEFAULT '{}',
  quest_id INTEGER REFERENCES quests(id) ON DELETE SET NULL,
  discovery_message TEXT,
  npc_type TEXT NOT NULL DEFAULT 'generic',
  img TEXT NOT NULL DEFAULT '',
  disposition TEXT DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_objectives (
  id SERIAL PRIMARY KEY,
  quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  objective TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_rewards (
  quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (quest_id, item_id)
);

CREATE TABLE IF NOT EXISTS chests (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_open BOOLEAN NOT NULL DEFAULT false,
  discovery_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS camps (
  id SERIAL PRIMARY KEY,
  heal_amount INTEGER NOT NULL,
  restores_mana BOOLEAN NOT NULL DEFAULT false,
  cost INTEGER,
  discovery_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transitions (
  id SERIAL PRIMARY KEY,
  destination TEXT NOT NULL,
  discovery_message TEXT
);

CREATE TABLE IF NOT EXISTS room_interactions (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  interaction_type interaction_type_enum NOT NULL,
  npc_id INTEGER REFERENCES npcs(id) ON DELETE CASCADE,
  chest_id INTEGER REFERENCES chests(id) ON DELETE CASCADE,
  camp_id INTEGER REFERENCES camps(id) ON DELETE CASCADE,
  transition_id INTEGER REFERENCES transitions(id) ON DELETE CASCADE,
  cutscene_id TEXT,
  discovery_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (room_id)
);

-- ---------------------------------------------------------------------------
-- Junctions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS room_enemies (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, enemy_id)
);

CREATE TABLE IF NOT EXISTS neighboring_rooms (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  neighbor_room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  direction direction_enum NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, direction)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_rooms_section_id ON rooms(section_id);
CREATE INDEX IF NOT EXISTS idx_room_enemies_room_id ON room_enemies(room_id);
CREATE INDEX IF NOT EXISTS idx_room_enemies_enemy_id ON room_enemies(enemy_id);
CREATE INDEX IF NOT EXISTS idx_neighboring_rooms_room_id ON neighboring_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_neighboring_rooms_neighbor_id ON neighboring_rooms(neighbor_room_id);
CREATE INDEX IF NOT EXISTS idx_room_interactions_room_id ON room_interactions(room_id);
CREATE INDEX IF NOT EXISTS idx_room_interactions_type ON room_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_quest_objectives_quest_id ON quest_objectives(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_rewards_quest_id ON quest_rewards(quest_id);
