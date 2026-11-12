# Quest

A React + TypeScript + Vite dungeon-crawler, backed by Supabase.

## Setup

Requires Node.js and pnpm.

```bash
pnpm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
pnpm dev
```

### Environment variables

The app reads these from the root `.env` file (Vite's default env directory):

| Variable                 | Required | Description                                                                    |
| ------------------------ | -------- | ------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | yes      | Supabase project URL. The app fails fast at startup if this is missing.        |
| `VITE_SUPABASE_ANON_KEY` | yes      | Supabase anonymous/public API key.                                             |
| `VITE_DEBUG_MODE`        | no       | Set to `true` to emit `logger.debug`/`logger.info` output. Defaults to silent. |

See [.env.example](.env.example) for a template. Do not commit `.env`; it is
gitignored.

## Scripts

```bash
pnpm dev            # start Vite
pnpm build          # type-check and build for production
pnpm typecheck      # TypeScript project build (no emit)
pnpm preview        # preview the production build
pnpm lint           # ESLint (type-aware)
pnpm format         # format with Prettier
pnpm format:check   # verify formatting without writing
pnpm test           # Vitest (watch mode)
pnpm test:run       # Vitest once (used by CI)
pnpm test:coverage  # Vitest with coverage floors
pnpm e2e            # Playwright smoke tests
pnpm db:types       # regenerate Supabase types from the linked project
pnpm db:baseline    # dump the linked schema to supabase/schema.sql
pnpm db:diff        # inspect pending schema differences
```

CI runs lint, typecheck, tests, and a production build on every pull request
and on pushes to `main` (see `.github/workflows/ci.yml`).

## Architecture

```
src/
  components/     React UI (feature folders, shared/, ui/ Radix primitives)
  state/          Zustand game store, slices, save/load, state helpers
  queries/        Supabase data access and DB-row -> domain mappers
  types/          Type definitions, enums, and generated Supabase schema
  lib/            Framework-free helpers (character maths, dice, logging)
  data/           Static game data and demo fixtures
  hooks/          Reusable React hooks
  styles/         Global component CSS
  assets/         App-bundled art (kebab-case filenames)
```

The game store is a single Zustand store composed from focused slices in
`src/state/slices/` (`combatSlice`, `dialogueSlice`, `inventorySlice`,
`partySlice`, `worldSlice`, `activitySlice`, `saveSlice`). `GameState.ts` is the
28-line composition root that re-exports the public `useGameStore` API. Slices
share the combined `GameState` type because the systems are coupled (combat
updates party, dialogue changes rooms, and so on). Save data is validated with
Zod and migrated by `state/saveSchema.ts`; import/export transforms live in
`state/saveTransforms.ts`. Extract long actions into pure helpers under
`state/utils/` rather than growing a slice.

`src/types/` contains only types and enums. Static data lives in `src/data/`,
and framework-free logic lives in `src/lib/`. React components never query
Supabase directly; they go through `src/queries/`.

See [docs/conventions.md](docs/conventions.md) for the full import, component,
deep-import, styling, and state-store conventions.

## Database

Supabase is the database and backend; the app only receives the anon key. SQL
lives in `supabase/`:

- `supabase/migrations/` — ordered, zero-padded migrations applied by filename.
- `supabase/seeds/` — example content, run manually, never applied automatically.
- `src/types/database.generated.ts` — the checked-in schema contract used by the
  typed Supabase client.

Apply migrations to a linked project:

```bash
pnpm exec supabase link --project-ref <project-ref>
pnpm exec supabase db push
pnpm db:types        # regenerate src/types/database.generated.ts
pnpm build           # verify the app against the new schema
```

Commit the regenerated types with the migration. Never hand-edit
`database.generated.ts`; change the schema and regenerate. See
[supabase/README.md](supabase/README.md) for migration ordering, seeding,
schema dumps, and RLS/permissions notes.

## Ownership and license

Copyright © 2026 Brendan Murphy. All rights reserved.

This repository is currently private and unlicensed: no permission is granted to
use, copy, modify, or distribute it. A license must be chosen and added before
the project is shared publicly or reused by others.
