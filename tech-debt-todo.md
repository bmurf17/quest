# Tech Debt TODO

Code cleanup backlog for `quest`, based on a scan of the current tree.

## Baseline (before cleanup)

- `npx tsc -b` — passes
- `npx vitest run` — 2 files, 5 tests, all passing
- `npx eslint .` — **74 errors / 9 warnings across 24 files** (was 77 errors; hooks violations fixed)
  - 65 × `@typescript-eslint/no-explicit-any`
  - 4 × `prefer-const`
  - 3 × `react-hooks/exhaustive-deps` warnings
  - 3 × `@typescript-eslint/no-unused-vars`
  - 1 × `@typescript-eslint/no-unused-expressions`
  - 1 × `no-empty`
  - 3 × `react-refresh/only-export-components` warnings
- No `typecheck`, `format`, or real `e2e` package script
- No CI config, no `.env.example`, no generated Supabase types

### Quick wins (do first)

- [x] Fix `prefer-const`: `src/state/GameState.ts:974`, `src/state/utils/SpellUtils.ts:40,156,181`
- [x] Remove the comma-expression in `src/components/ActionMenu.tsx:243` (`cond ? a() : (b(), c())`)
- [x] Remove debug `console.log` in `src/components/MainGameArea/_BattleEnemies.tsx:77`
- [x] Delete unused vars in `tests/game-helpers.ts:143,290`, `tests/scenarios/combat-sim.ts:11`
- [x] Replace the empty `catch {}` in `tests/run-game.ts:150`
- [x] Delete the abandoned `vite-project/` scaffold
- [x] Pick one lockfile/package manager (`package-lock.json` vs `pnpm-lock.yaml`)

---

## P0 — Correctness and maintainability

### 1. Fix React hooks violations — ✅ Done

The store action `useConsumable` was named like a hook, so calling it from a handler tripped `rules-of-hooks`:

- [x] `src/components/Party.tsx:42` — called inside `handleCharacterClick`
- [x] `src/components/Inventory.tsx:29,35` — called inside `handleUseItem`

Renamed the action to `consumeItem` across `GameState`, components, and tests. `tsc -b` passes and the three `rules-of-hooks` errors are gone.

### 2. Fix stale `useEffect` dependencies — ✅ Done

- [x] `src/App.tsx:55` — added `preloadDialogueTrees`
- [x] `src/components/MainGameArea/MainGameArea.tsx:42` — derive `cutsceneId` and depend on it (plus `room.id`)
- [x] `src/components/MainGameArea/_BattleEnemies.tsx:35,41` — added sound callbacks (stable `useCallback`s)
- [x] `src/components/MainGameArea/_BattleOrder.tsx:63` — copy `nodeMapRef.current` before cleanup
- [x] `src/components/MainGameArea/_RoomNPC.tsx:29` — added `interaction`, `startDialogue`

All six `react-hooks/exhaustive-deps` warnings are gone; `tsc -b` and `vitest run` pass.

### 3. Eliminate `any` (65 lint errors) — ✅ Done

Highest-impact spots:

- [x] `src/state/saveLoad.ts` — `roomInstances: [number, SerializedRoom][]`, `combatOrder: (CharacterData | Enemy)[]`, `dialogueTrees: [number, DialogueNode][]`, typed `normalizeNeighbors`/`denormalizeNeighbors`
- [x] `src/queries/RoomQueries.ts:58,95,113,116,134,160,173,177` — added `Db*` row types + typed mappers (`mapDbEnemy`, `mapDbItem`, `mapDbQuest`); removed `rooms!` non-null assertion
- [x] `src/components/Admin/game-design/CreateRoom.tsx` — 19 `any`s replaced with generic field setters and discriminated `EnemyMoveEffect` construction
- [x] `src/components/Quests/QuestList.tsx`, `QuestOffer.tsx` — quest/objective types (`npcName` added to `Quest`, `description` to `BaseItem`)
- [x] `src/state/utils/SpellUtils.ts` — typed `SpellState`, `earlyCompletion` from `ReturnType<typeof handleCombatCompletion>`
- [x] Tests: `CombatUtils.test.ts`, `GameState.helpers.test.ts`
- [x] Remaining `any`s in components (`_BattleOrder`, `_BattleEnemies`, `_MapNav`, `_RoomNPC`, `RoomMap`, `CharacterContext`, `Inventory`)

Recommended approach:

- [ ] Generate Supabase DB types (`supabase gen types typescript`) and type the client as `SupabaseClient<Database>`
- [x] Add explicit row types + mappers for DB → domain objects (`Room`, `Enemy`, `Item`, `Quest`)
- [x] Replace non-null assertions with guards or explicit thrown errors

`npx eslint .` now reports **0 errors / 3 warnings** (the pre-existing `react-refresh/only-export-components` warnings).

### 4. Harden save/load

- [ ] `version: 1` is written but never read — add migration/upgrade handling
- [ ] `getSaveData` does `JSON.parse(raw) as SaveData` with no validation — validate the schema (e.g. Zod) and reject/repair bad imports
- [ ] `importSaveFromJson` trusts any parsed object before writing to localStorage
- [ ] `denormalizeNeighbors` silently creates `"Unknown"` stub rooms for missing IDs (buries data bugs). Log/throw, or surface as a load error
- [ ] `loadGame` does a large manual field copy; derive it from a shared save-shape helper so new state fields can't be forgotten
- [ ] Only `DevPanel` can save/load today; confirm that is intentional before building on it

### 5. Split the `GameState` god store

`src/state/GameState.ts` is **1,628 lines** and owns combat, dialogue, inventory, movement, cutscenes, tavern, quests, sections, leveling, and save loading.

Suggested slices:

- [ ] `useCombatStore` — attack, enterCombat, enemy turns, buffs, cooldowns, spells
- [ ] `useDialogueStore` — active dialogue, choices, outcomes, flags, disposition
- [ ] `useInventoryStore` — items, gold, consumables, equip/unequip, shop
- [ ] `useWorldStore` — rooms, movement, sections, cutscenes
- [ ] `usePartyStore` — party, leveling, tavern recruits, quests/activity log

Also extract the very long actions into pure helpers (several already exist in `state/utils/`, but `useConsumable`, `castSpell`, `move`, `attack`, and `loadGame` remain large inline closures).

### 6. Fix test coverage

5 tests for ~17,700 lines of source is the biggest long-term risk.

- [ ] Add tests for save/load round-tripping and version handling
- [ ] Add tests for `GameState` actions: combat turn order, consumable use, death/revive, level-up
- [ ] Add tests for `RoomQueries` mappers using fixture rows
- [ ] Add tests for dialogue outcomes/flags
- [ ] Add `test:coverage` script and a coverage floor for `src/state/` and `src/queries/`
- [ ] `@playwright/test` is installed and configured, but there are **no `*.spec.ts` files** and the dev server command is `pnpm dev`. Either add real E2E specs or remove the dependency/config

---

## P1 — Structure and duplication

### 7. Break up oversized components

| File | Lines |
| --- | --- |
| `src/components/Admin/game-design/CreateRoom.tsx` | 1,676 |
| `src/components/Party/PartyManagement.tsx` | 1,485 |
| `src/components/Party/PartySelection.tsx` | 1,047 |
| `src/components/MainGameArea/_TavernOverlay.tsx` | 863 |
| `src/components/ActionMenu.tsx` | 693 |
| `src/components/Admin/game-design/RoomMap.tsx` | 560 |

- [ ] `CreateRoom.tsx`: it already defines local form components; move `NPCForm`, `MoveForm`, `CombatForm`, `ChestForm`, `CampForm`, `TransitionForm`, `Toast`, and the styled primitives into their own files
- [ ] `PartyManagement.tsx`: split `CreateCharacterView` / `ManagePartyView`, extract character-card and equipment UI
- [ ] `PartySelection.tsx`: extract party slot, stats panel, and selection logic
- [ ] `_TavernOverlay.tsx`: extract card, tooltip, and stat components
- [ ] `ActionMenu.tsx`: extract spell/item/attack menus and targeting logic

### 8. Remove duplicated UI and logic

- [ ] **Four `StatBar` implementations**: `src/components/Shared/StatBar.tsx`, `CharacterSheet.tsx:16`, `_LevelUpModal.tsx:34`, `_TavernOverlay.tsx:14`. Consolidate on the shared version
- [ ] **Two character-creation flows**: `CharacterBuilder.tsx` and `PartyManagement.tsx`'s `CreateCharacterView` / `buildCharacter` duplicate the tab/point-buy/form logic. Reuse one flow
- [ ] Item mapping (`mapItem`) is inline in `RoomQueries.ts`; export a typed mapper and reuse it
- [ ] Repeated DB query error handling (`if (error) throw error` via `.then`) — add a small query helper
- [ ] `computeModifier` / ability modifier logic exists in `TavernUtils.ts` and `PartyManagement.ts`; centralize it

### 9. Separate types, data, and logic

- [ ] `src/types/Character.ts` (343 lines) mixes: type definitions, `rollDamageDice`/`formatDamageDice` utils, defaults, and seven `temp*` character fixtures. Move fixtures to `src/data/fixtures/` (or a `__fixtures__` module) and dice helpers to a utils file
- [ ] `src/types/Room.ts` defines `startRoom`/`northRoom` demo data and mutates them at module load (`push` on import). Move demo rooms to fixtures and make them pure
- [ ] Consider `src/types/` containing only types; data belongs in `src/data/`

### 10. Remove dead/duplicate scaffolding

- [x] Delete `vite-project/` (nested abandoned Vite scaffold, tracked in git)
- [ ] Firebase config (`firebase.json`, `.firebase/`) coexists with Supabase; remove if hosting moved to Supabase, or document why both exist
- [x] Choose one lockfile: `package-lock.json` or `pnpm-lock.yaml`. `playwright.config.ts` assumes `pnpm`, while the repo also has an npm lockfile — pick one and wire `packageManager`
- [ ] Remove unused `public/vite.svg` / `src/assets/react.svg` if unused
- [ ] Decide whether `src/components/MainGameArea/Key Issues` should live as a tracked source file; move notes to `docs/` or fold into this doc
- [ ] `src/assets/` and `public/images/` both hold game art with different naming conventions (`PascalCase` vs `kebab-case`). Pick one location/naming scheme

### 11. Normalize imports and file conventions

- [ ] Mix of `@/...` and long relative paths (`../../types/Character`, `../../../assets/...`). Enforce the `@/` alias via ESLint `no-restricted-imports` or `import/no-relative-parent-imports`
- [ ] Inconsistent component layout: flat files (`Party.tsx`, `Shop.tsx`), subfolders (`Party/`, `Admin/`), and the `_` prefix convention (`_BattleOrder.tsx`) that is not documented. Rename to a consistent convention and document it
- [ ] No barrel exports; either add `index.ts` per feature or explicitly document deep-import policy. (Avoid barrels in hot paths if bundle splitting matters)
- [ ] `CharacterData` is imported as a value in several files even when used only as a type. Use `import type`

### 12. Consolidate styling

- [ ] ~700+ inline `style={{ ... }}` objects (e.g. `PartyManagement` 104, `PartySelection` 88, `_TavernOverlay` 64) alongside 34 files using Tailwind classes
- [ ] 15 components embed raw `<style>` blocks (keyframes/global selectors). Move to CSS modules or a global stylesheet
- [ ] Dozens of hardcoded hex colors duplicate `src/theme.ts` (`#D4AF37` = `colors.gold`, etc.). Replace with theme tokens or Tailwind custom colors
- [ ] Inline style objects recreate allocations on every render; extract static styles or use Tailwind/CSS classes
- [ ] Pick one styling strategy (Tailwind vs inline vs CSS modules) and document it

### 13. Improve resilience and UX

- [ ] Add a top-level React `ErrorBoundary` around the lazy `Suspense` routes (`App.tsx`)
- [ ] `App.tsx:50` only `console.error`s a failed room load — show a retry/error state instead of a blank game
- [ ] `src/lib/supabase.ts` casts missing env vars to `string`; fail fast with a clear message if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are absent
- [ ] Add `.env.example` and document required variables
- [ ] Remove/merge the duplicate `src/.env` and root `.env` (both currently gitignored, but two sources are confusing)
- [ ] `useSound` logs playback failures only to console; surface or silence intentionally
- [ ] Replace debug logging with a `logger` gated by `VITE_DEBUG_MODE`

### 14. Accessibility

- [ ] Clickable `<div>`s are used as buttons (e.g. the character-builder tabs in `CharacterBuilder.tsx`). Replace with `<button>` or add role/tabIndex/key handlers
- [ ] Audit modals/dialogs for focus trapping and labelled titles (Radix primitives are used in places, so standardize)
- [ ] Ensure icon-only controls have `aria-label`s

### 15. Database/migrations hygiene

- [ ] Two migrations share the `001_` prefix (`001_dialogue_system.sql`, `001_dialogue_system_example.sql`). Renumber; keep the example as a seed/example, not a migration
- [ ] Add a schema baseline / generated types so the app and DB can't drift silently
- [ ] Consider RLS/permissions documentation for the client-accessed tables

---

## P2 — Tooling and docs

### 16. Tooling

- [ ] Add `"typecheck": "tsc -b --noEmit"` (or `tsc -b`) and `"format"` scripts
- [ ] Add an `e2e` script that matches `playwright.config.ts`
- [ ] Add CI running `lint`, `typecheck`, `test`, `build` on PRs
- [ ] Add Prettier (or Biome) config; formatting is currently inconsistent (single vs double quotes, semicolons)
- [ ] Enable type-aware ESLint rules (`recommendedTypeChecked`) as the `any` count drops
- [ ] Consider `@typescript-eslint/no-floating-promises` — `useEffect(() => { loadRooms(); }, ...)` and similar async calls are unawaited

### 17. Docs and housekeeping

- [ ] Replace the stock Vite `README.md` with setup, env vars, scripts, architecture, and DB migration instructions
- [ ] Document the folder conventions and state-store layout after the split
- [ ] Remove `src/.DS_Store` and any other untracked macOS artifacts (already gitignored, but present locally)
- [ ] Merge `todos.md` and `src/components/MainGameArea/Key Issues` into a single tracked backlog (this file), or clearly separate product TODOs from tech debt
- [ ] Add license/ownership notes if the project will be shared

---

## Suggested order

1. Quick wins + hooks/naming fixes (unblocks lint)
2. Add `typecheck`/format/CI scripts
3. Split `GameState` and extract top-level state helpers
4. Type save/load + DB queries; add validation
5. Extract the four giant components
6. Consolidate `StatBar`, character creation, styling/tokens
7. Delete dead scaffolding and choose one package manager
8. Raise test coverage in `src/state/` and `src/queries/`
