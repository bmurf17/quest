# Supabase database

The app uses Supabase for all game data. This directory holds the SQL that
defines and changes the database, plus example seed data.

## Layout

```
supabase/
  migrations/   Ordered schema migrations (apply in filename order)
  seeds/        Optional example/seed data, never applied automatically
```

### Migrations

| File | Purpose |
| --- | --- |
| `000_schema_baseline.sql` | Core tables that predate migrations; makes a fresh project reproducible |
| `001_dialogue_system.sql` | Dialogue trees, choices, outcomes, conversation flags, NPC disposition |
| `002_enemy_enhancements.sql` | Boss phases, moves, spawns, and XP fields on `enemies` |

Rules:

- Use a zero-padded, strictly increasing prefix: `003_add_quest_prerequisites.sql`.
- One prefix maps to one file. Do not reuse a number.
- Prefer `IF NOT EXISTS` / idempotent DDL so a baseline or re-run is safe.
- Migrations are applied in filename order; never renumber an already-applied
  migration. Add a new one instead.
- Example data belongs in `seeds/`, not `migrations/`. The dialogue example is
  run manually and is safe to re-run.

### Applying migrations

With the Supabase CLI linked to a project:

```bash
pnpm exec supabase link --project-ref <project-ref>
pnpm exec supabase db push        # apply pending migrations to the linked DB
```

Locally, `pnpm exec supabase start` starts the local stack and
`pnpm exec supabase db reset` applies every migration plus `seeds/` if wired
into `supabase/config.toml`.

There is currently no `supabase/config.toml`, so treat the linked project as
the source of truth and apply migrations with `db push` or the SQL editor.

## Keeping types in sync

`src/types/database.generated.ts` is the app's compile-time contract for the
`public` schema, and `src/lib/supabase.ts` creates a
`SupabaseClient<Database>`. A query against a table or column that is not in the
generated types fails `tsc`, so the app cannot silently drift from the checked-in
schema.

After changing the database (new migration applied, column added, etc.):

```bash
pnpm db:types     # regenerate src/types/database.generated.ts from the linked DB
pnpm build        # type-check the app against the new types
```

Commit the regenerated file with the migration. To capture a full schema dump
from the live database for review (written to `supabase/schema.sql`):

```bash
pnpm db:baseline  # supabase db dump --remote --schema public
pnpm db:diff      # inspect pending schema differences
```

Never hand-edit `database.generated.ts` to make an error disappear. Change the
schema with a migration, apply it, and regenerate.

## Seeds

`supabase/seeds/001_clean_man_dialogue_example.sql` is example dialogue content
for NPC id 7. It is not a migration; run it manually in a development project
after the migrations. All inserts use `ON CONFLICT DO NOTHING`.

## RLS and permissions

The browser only ever receives the **anon** key (`VITE_SUPABASE_ANON_KEY`).
Never ship the `service_role` key: it bypasses RLS. Current policy intent is:

| Table | Read | Write |
| --- | --- | --- |
| `sections`, `rooms`, `room_enemies`, `neighboring_rooms`, `room_interactions`, `items`, `enemies`, `npcs`, `chests`, `camps`, `transitions`, `quests`, `quest_objectives`, `quest_rewards` | Public (`USING (true)`) so the game can load content | Authenticated users only (`auth.uid() IS NOT NULL`), i.e. the admin/game-design screens |
| `npc_dialogues`, `dialogue_nodes`, `dialogue_choices`, `dialogue_outcomes` | Public so dialogue can load | Authenticated users only |
| `conversation_flags` | Public in the current migration | Authenticated users only |

`001_dialogue_system.sql` enables RLS for the dialogue tables and creates those
policies. The baseline does not create policies for the core tables; those are
managed in the project's SQL editor.

### Follow-up recommended

`conversation_flags` currently allows any client to read every player's flags.
The table is keyed by `player_id TEXT` and the app is single-player today, but if
player accounts are added the read policy should become:

```sql
CREATE POLICY "Read own conversation flags"
  ON conversation_flags FOR SELECT
  USING (auth.uid()::text = player_id);
```

Admin writes should then be split from per-player writes instead of the current
single authenticated-user policy. Review policies whenever a new table or client
query is added.
