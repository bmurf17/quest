-- Realm Map data foundation.
--
-- Adds saved drag positions for room nodes and an explicit start room per
-- section. Exploration previously started at the first room in a section by
-- array order; the app now prefers `sections.start_room_id` and falls back to
-- the lowest-id room when it is unset.
--
-- Apply this file in the Supabase SQL editor (or `supabase db push`) against
-- the live project. The statements are idempotent.

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS map_x DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS map_y DOUBLE PRECISION;

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS start_room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sections_start_room_id ON sections(start_room_id);

-- Backfill every section's start room from its current lowest-id room. This
-- matches the old runtime behaviour (rooms are loaded ordered by id).
UPDATE sections AS s
SET start_room_id = first_room.room_id
FROM (
  SELECT section_id, MIN(id) AS room_id
  FROM rooms
  WHERE section_id IS NOT NULL
  GROUP BY section_id
) AS first_room
WHERE s.id = first_room.section_id
  AND s.start_room_id IS NULL;

-- Make the new columns available to the local/admin client. The admin runs
-- with the anon key, matching the permissive policy used by the other content
-- tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON rooms, sections TO anon, authenticated;
