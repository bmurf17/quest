-- Dialogue System Tables
-- Run this in Supabase SQL Editor

-- 1. NPC Dispositions tracking
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS disposition TEXT DEFAULT 'neutral';

-- 2. Dialogue trees table
CREATE TABLE IF NOT EXISTS npc_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id INTEGER REFERENCES npcs(id) ON DELETE CASCADE,
  root_node_id UUID NOT NULL,
  name TEXT NOT NULL,
  default_outcome TEXT DEFAULT 'none'
);

-- 3. Dialogue nodes (individual dialogue points)
CREATE TABLE IF NOT EXISTS dialogue_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dialogue_id UUID REFERENCES npc_dialogues(id) ON DELETE CASCADE,
  npc_text TEXT NOT NULL,
  speaker TEXT DEFAULT 'NPC',
  is_endpoint INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 4. Player choices at each node
CREATE TABLE IF NOT EXISTS dialogue_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES dialogue_nodes(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  next_node_id UUID REFERENCES dialogue_nodes(id) ON DELETE SET NULL,
  required_skill TEXT,
  skill_check_dc INTEGER,
  success_node_id UUID REFERENCES dialogue_nodes(id) ON DELETE SET NULL,
  failure_node_id UUID REFERENCES dialogue_nodes(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0
);

-- 5. Outcomes at endpoints or after choices
CREATE TABLE IF NOT EXISTS dialogue_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES dialogue_nodes(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES dialogue_choices(id) ON DELETE SET NULL,
  outcome_type TEXT NOT NULL DEFAULT 'none',
  outcome_value TEXT,
  flag_key TEXT,
  flag_value TEXT
);

-- 6. Conversation state persistence (what choices player has made)
CREATE TABLE IF NOT EXISTS conversation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  npc_id INTEGER REFERENCES npcs(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  flag_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, npc_id, flag_key)
);

-- Enable RLS
ALTER TABLE npc_dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow read access)
CREATE POLICY "Allow read npc_dialogues" ON npc_dialogues FOR SELECT USING (true);
CREATE POLICY "Allow read dialogue_nodes" ON dialogue_nodes FOR SELECT USING (true);
CREATE POLICY "Allow read dialogue_choices" ON dialogue_choices FOR SELECT USING (true);
CREATE POLICY "Allow read dialogue_outcomes" ON dialogue_outcomes FOR SELECT USING (true);
CREATE POLICY "Allow read conversation_flags" ON conversation_flags FOR SELECT USING (true);
CREATE POLICY "Allow read npcs" ON npcs FOR SELECT USING (true);

-- Allow insert/update for authenticated users (admin)
CREATE POLICY "Allow manage npc_dialogues" ON npc_dialogues FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow manage dialogue_nodes" ON dialogue_nodes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow manage dialogue_choices" ON dialogue_choices FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow manage dialogue_outcomes" ON dialogue_outcomes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow manage conversation_flags" ON conversation_flags FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow manage npcs disposition" ON npcs FOR ALL USING (auth.uid() IS NOT NULL);