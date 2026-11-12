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

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Supabase project URL. The app fails fast at startup if this is missing. |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anonymous/public API key. |
| `VITE_DEBUG_MODE` | no | Set to `true` to emit `logger.debug`/`logger.info` output. Defaults to silent. |

See [.env.example](.env.example) for a template. Do not commit `.env`; it is
gitignored.

## Scripts

```bash
pnpm dev            # start Vite
pnpm build          # type-check and build for production
pnpm preview        # preview the production build
pnpm lint           # ESLint
pnpm test           # Vitest (watch mode)
pnpm test:coverage  # Vitest with coverage floors
pnpm e2e            # Playwright smoke tests
```

## Docs

See [docs/conventions.md](docs/conventions.md) for the project's import, component layout, deep-import, and styling conventions.

