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

- [x] Generate Supabase DB types (`supabase gen types typescript`) and type the client as `SupabaseClient<Database>`
- [x] Add explicit row types + mappers for DB → domain objects (`Room`, `Enemy`, `Item`, `Quest`)
- [x] Replace non-null assertions with guards or explicit thrown errors

`npx eslint .` now reports **0 errors / 3 warnings** (the pre-existing `react-refresh/only-export-components` warnings).

### 4. Harden save/load — ✅ Done

- [x] `version` is now read and migrated. `SAVE_VERSION = 2`; `saveSchema.ts` runs ordered migrations from v0/v1 and rejects future versions.
- [x] `getSaveData` parses with a Zod schema (`saveSchema.ts`). Invalid saves throw a `SaveDataError` with a field path; legacy saves are repaired with defaults by migrations.
- [x] `importSaveFromJson` validates and migrates the parsed file before writing to localStorage, and surfaces the validation message in `DevPanel`.
- [x] `denormalizeNeighbors` throws on missing room IDs instead of creating `"Unknown"` stubs. `loadGame` now links rooms in two passes so forward neighbor references resolve to the real (canonical) room objects.
- [x] `SaveData` direct fields live in `DIRECT_SAVE_FIELDS` (`saveLoad.ts`); a compile-time completeness check forces new fields to be classified, and both `saveToSlot` and `loadGame` use `pickDirectSaveFields`.
- [x] Confirmed `DevPanel` is intentionally the only save/load surface for now (dev tooling); there is no in-game save menu yet.
- [x] Added `saveSchema.test.ts` and `saveTransforms.test.ts` covering migrations, version rejection, invalid input, and dangling neighbor references. `tsc -b`, `vitest run` (15 tests), and `eslint` pass.

### 5. Split the `GameState` god store — ✅ Done

`src/state/GameState.ts` is now a **28-line composition root**; the store is built from focused slices while keeping the public `useGameStore` API (and the `GameState` type) unchanged.

Slices in `src/state/slices/`:

- [x] `combatSlice` — attack, enterCombat, enemy turns, buffs, cooldowns, spells/targeting
- [x] `dialogueSlice` — active dialogue, choices, outcomes, flags, disposition
- [x] `inventorySlice` — items, gold, consumables, equip/unequip, shop
- [x] `worldSlice` — rooms, movement, chests, sections, cutscenes
- [x] `partySlice` — party, leveling, tavern recruits, quests, town
- [x] `activitySlice` — activity log
- [x] `saveSlice` — `loadGame`
- [x] `slices/types.ts` — the combined `GameState` interface and `GameSlice` helper

Slices are composed into one zustand store rather than five independent stores: combat, dialogue, inventory, and world actions read and write each other's state (e.g. an attack updates party, room, quests, and leveling), so separate stores would have required cross-store subscriptions and duplicated state. The split improves file size and reviewability without changing behaviour.

Long actions extracted into pure helpers under `state/utils/`:

- [x] `InventoryUtils.applyConsumable` / `equipItemInState` / `unequipItemInState`
- [x] `EnemyTurnUtils.resolveEnemyTurn` (the enemy-move switch)
- [x] `AttackUtils.resolveAttack`
- [x] `WorldUtils.resolveMove` / `getCurrentRoomInstance` / `getRoomInstanceKey`
- [x] `saveTransforms.hydrateRoomInstances` (the two-pass room linking used by `loadGame`)

### 6. Fix test coverage — ✅ Done

5 tests for ~17,700 lines of source was the biggest long-term risk. The suite now covers save/load, store actions, DB mappers, and dialogue/quest behaviour.

- [x] Add tests for save/load round-tripping and version handling (`saveLoad.test.ts`, plus the existing `saveSchema.test.ts` / `saveTransforms.test.ts`)
- [x] Add tests for `GameState` actions: combat turn order, consumable use, death/revive, level-up (`gameStateActions.test.ts`)
- [x] Add tests for `RoomQueries` mappers using fixture rows (`src/queries/__tests__/RoomQueries.test.ts`); `mapDbEnemy`, `mapDbItem`, and `mapDbQuest` are now exported for testing/reuse
- [x] Add tests for dialogue outcomes/flags (`dialogue.test.ts`)
- [x] Add `test:coverage` script and a coverage floor for `src/state/` and `src/queries/` (55% statements/lines for state, 35% for queries; `@vitest/coverage-v8` + thresholds in `vitest.config.ts`)
- [x] Added Playwright smoke specs in `tests/e2e/` and the matching `e2e` package script (previously the dependency/config existed with no specs)

`npx tsc -b`, `vitest run` (55 tests), and `eslint` pass. Coverage is reported to the terminal and `coverage/`.

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

- [x] `CreateRoom.tsx`: it already defines local form components; move `NPCForm`, `MoveForm`, `CombatForm`, `ChestForm`, `CampForm`, `TransitionForm`, `Toast`, and the styled primitives into their own files
- [x] `PartyManagement.tsx`: split `CreateCharacterView` / `ManagePartyView`, extract character-card and equipment UI
- [x] `PartySelection.tsx`: extract party slot, stats panel, and selection logic
- [x] `_TavernOverlay.tsx`: extract card, tooltip, and stat components
- [x] `ActionMenu.tsx`: extract spell/item/attack menus and targeting logic

`CreateRoom.tsx` is now a 168-line page shell; forms live in
`game-design/create-room/` (`NPCForm`, `MoveForm`, `CombatForm`, `ChestForm`,
`CampForm`, `TransitionForm`, `Toast`, primitives, icons, form types) and the
submit flow moved to `useCreateRoomForm`. `PartyManagement` and
`PartySelection` share `shared/CharacterDetailPanel`, `PartyRosterPanel`,
`PartyRosterCard`, `SectionHeader`, and `usePartySelection`; the management
views and `buildCharacter` live in `Party/management/`. The tavern card,
ability tooltip, stat bar, and detail dialog live in `MainGameArea/tavern/`.
Action-menu buttons, slots, combat targeting, and the dialogue/chest/camp/town
sections live in `components/action-menu/`.

### 8. Remove duplicated UI and logic — ✅ Done

- [x] **Four `StatBar` implementations**: consolidated on `src/components/Shared/StatBar.tsx` with size/track/low-value options; `CharacterSheet`, `_LevelUpModal`, and the tavern card now use it, and `TavernStatBar.tsx` was deleted
- [x] **Two character-creation flows**: `CharacterBuilder.tsx` now exposes a shared `CharacterBuilderView` used by both `/create` and `PartyManagement`'s empty-party `CreateCharacterView`; the name step is a shared form and point-buy validation lives in `canCreateCharacter` / `src/lib/character.ts`
- [x] Item mapping: exported typed `mapDbItem` from `RoomQueries.ts` and reused it for quests, chests, and reward rows
- [x] Repeated DB query error handling: added `unwrapQuery` in `src/queries/queryHelpers.ts` and used it for room/section/enemy queries
- [x] `computeModifier` / ability modifier logic: centralized as `abilityModifier` in `src/lib/character.ts`; `TavernUtils` and `buildCharacter` now share it, along with point-buy helpers used by `AbilitiesForm`

### 9. Separate types, data, and logic — ✅ Done

- [x] `src/types/Character.ts` now holds only type definitions. The seven `temp*` fixtures (plus their default spells/skills/equipment) moved to `src/data/fixtures/characters.ts`, and `rollDamageDice`/`formatDamageDice` moved to `src/lib/dice.ts`
- [x] `src/types/Room.ts` now holds only the `Room`/`Section` types. The demo rooms moved to `src/data/fixtures/rooms.ts`, built inside a `createDemoRooms()` factory so importing the module no longer mutates shared state
- [x] `src/types/` now contains only types/enums. Item data moved to `src/data/items.ts`, tavern defaults to `src/data/tavern.ts`, and `getDiscoveryMessage` (the one logic function left in `types/`) to `src/lib/roomInteractions.ts`. All imports/tests updated; `tsc -b`, `vitest run` (58 tests), and `eslint` pass.

### 10. Remove dead/duplicate scaffolding — ✅ Done

- [x] Delete `vite-project/` (nested abandoned Vite scaffold, tracked in git)
- [x] Firebase config (`firebase.json`, `.firebaserc`) is **hosting only**; Supabase is the database/backend. They are complementary, so both stay. Removed the leftover Firebase Hosting default `public/index.html` scaffold (it shadowed the real app shell in `dist/`) and stopped tracking the generated `.firebase/` deploy cache (now gitignored).
- [x] Choose one lockfile: `package-lock.json` or `pnpm-lock.yaml`. `playwright.config.ts` assumes `pnpm`, while the repo also has an npm lockfile — pick one and wire `packageManager`
- [x] Removed the stock `public/vite.svg` and unused `src/assets/react.svg`. `index.html` now points its favicon at an existing game asset and uses the real page title.
- [x] Folded `src/components/MainGameArea/Key Issues` into the appendix below, then deleted the stray file.
- [x] Art policy: app-bundled art lives in `src/assets/` with **kebab-case** filenames (renamed from `PascalCase`); `public/images/` is reserved for paths referenced at runtime from Supabase rows, so those filenames stay unchanged to avoid breaking existing data. New art should go to `src/assets/` unless it must be addressed by a stored URL.

### 11. Normalize imports and file conventions — ✅ Done

- [x] Converted every parent-relative import (`../`, `../../`, `../../../`) in `src/` to the `@/` alias and enforced it with `no-restricted-imports` in `eslint.config.js`. Sibling `./` imports remain allowed; `tests/` is exempt because `@/` maps to `src/`.
- [x] Consolidated the layout: `action-menu/` + `ActionMenu.tsx` became `ActionMenu/ActionMenu.tsx` (with its supporting files), `Party.tsx` moved to `Party/Party.tsx`, and `Shared/` became lowercase `shared/`. The convention (PascalCase feature folders, flat single-file components, lowercase internal folders, `_` private partials) is documented in `docs/conventions.md` and linked from `README.md`.
- [x] Documented the deep-import policy in `docs/conventions.md`: no barrels; import modules directly to keep dependencies explicit and preserve tree-shaking/bundle splitting.
- [x] Added `@typescript-eslint/consistent-type-imports` and auto-fixed type-only imports across the tree (including `CharacterData`, `GameState`, `Item`, and other type-only imports).

### 12. Consolidate styling — ✅ Done

- [x] **One global stylesheet.** The 15 embedded `<style>` blocks moved to `src/styles/components.css` (keyframes, hover/scrollbar selectors, shared classes) and are loaded once from `main.tsx`; no component injects `<style>` any more. Box-sizing and number-input resets live in `src/index.css`.
- [x] **Theme tokens instead of duplicated hex.** `#D4AF37`, `#C9A84C`, `#E8DCC8`, `#A8916A`, `#9CA3AF`, `#34D399`, and `#EF4444` usages in components now resolve to `colors.gold`, `colors.goldMuted`, `colors.text`, `colors.textMuted`, `colors.muted`, `colors.success`, and `colors.danger`. Theme-equivalent hex values in `src/` are now zero (excluding `theme.ts` itself).
- [x] **Static styles hoisted.** 488 large static style objects were extracted to module-level `CSSProperties` constants, so they are allocated once instead of on every render. The remaining ~230 inline `style` props are dynamic (computed positions, per-entity colors, animated widths).
- [x] **Strategy documented** in `docs/conventions.md` § Styling: Tailwind utilities + theme tokens first, global component classes for selectors/keyframes, module-level `CSSProperties` for static objects, inline `style` only for runtime-computed values. No CSS modules or CSS-in-JS.
- [x] `tsc -b`, `vitest run` (58 tests), `eslint` (0 errors / 3 pre-existing fast-refresh warnings), and `vite build` all pass.

### 13. Improve resilience and UX — ✅ Done

- [x] Add a top-level React `ErrorBoundary` around the lazy `Suspense` routes (`App.tsx`)
- [x] `App.tsx:50` only `console.error`s a failed room load — show a retry/error state instead of a blank game
- [x] `src/lib/supabase.ts` casts missing env vars to `string`; fail fast with a clear message if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are absent
- [x] Add `.env.example` and document required variables
- [x] Remove/merge the duplicate `src/.env` and root `.env` (both currently gitignored, but two sources are confusing)
- [x] `useSound` logs playback failures only to console; surface or silence intentionally
- [x] Replace debug logging with a `logger` gated by `VITE_DEBUG_MODE`

`ErrorBoundary` (`src/components/ErrorBoundary.tsx`) wraps the lazy routes with a
reload action. `App.tsx` tracks load failures, cancels stale requests, and shows
a `Retry` panel instead of a blank game. `src/lib/supabase.ts` now throws a
descriptive error if either Supabase variable is missing. Logging goes through
`src/lib/logger.ts`: `debug`/`info` are gated by `VITE_DEBUG_MODE`, while
`warn`/`error` always emit. `useSound` deliberately downgrades autoplay
failures to debug output. Vite reads env vars from the root `.env` only, so
`src/.env` was merged into it and removed; `.env.example` plus the README now
document every variable.

### 14. Accessibility — ✅ Done

- [x] Clickable `<div>`s are used as buttons (e.g. the character-builder tabs in `CharacterBuilder.tsx`). Replace with `<button>` or add role/tabIndex/key handlers
- [x] Audit modals/dialogs for focus trapping and labelled titles (Radix primitives are used in places, so standardize)
- [x] Ensure icon-only controls have `aria-label`s

Interactive cards, list rows, action buttons, ability slots, equipment slots, room nodes, and enemy targets are now real `<button>` elements (with `disabled`/`aria-pressed` where appropriate). The tavern character card uses `role="button"` + `tabIndex` + Enter/Space handling because it contains non-interactive presentation content. The custom admin room popup now uses the shared Radix `Dialog` (focus trap, Escape handling, labelled `DialogTitle`) instead of a hand-rolled overlay; the cutscene overlay is labelled as a modal dialog and focuses its continue button. Icon-only controls in the navbar, map navigation, level-up stat controls, toasts, and close buttons now have `aria-label`s, and toasts announce via `role="status"`/`role="alert"`.

### 15. Database/migrations hygiene — ✅ Done

- [x] Two migrations share the `001_` prefix (`001_dialogue_system.sql`, `001_dialogue_system_example.sql`). Renumber; keep the example as a seed/example, not a migration. The example moved to `supabase/seeds/001_clean_man_dialogue_example.sql` (idempotent inserts); migrations are now `000_schema_baseline.sql`, `001_dialogue_system.sql`, `002_enemy_enhancements.sql`.
- [x] Add a schema baseline / generated types so the app and DB can't drift silently. `000_schema_baseline.sql` captures the pre-migration core tables so a fresh project can be built from the repo. `src/types/database.generated.ts` is the checked-in schema contract, `src/lib/supabase.ts` is typed as `SupabaseClient<Database>`, and `src/queries/__tests__/databaseContract.test.ts` fails on an unknown table or a `Db*` row type with columns absent from the generated schema. `pnpm db:types` / `pnpm db:baseline` / `pnpm db:diff` wrap the Supabase CLI.
- [x] Consider RLS/permissions documentation for the client-accessed tables. `supabase/README.md` documents migration ordering, seeds, type regeneration, the anon-vs-service-role rule, and the current public-read/authenticated-write policy split, including a recommended per-player policy for `conversation_flags`.

The generated schema also exposed stale item/transition assumptions: `mapDbItem` now reads the real `items` columns (`attack`/`defense` instead of removed `stats`/`action`/`target`/`cost`), and item price/cost comes from `value`.

---

## P2 — Tooling and docs

### 16. Tooling

- [ ] Add `"typecheck": "tsc -b --noEmit"` (or `tsc -b`) and `"format"` scripts
- [x] Add an `e2e` script that matches `playwright.config.ts`
- [ ] Add CI running `lint`, `typecheck`, `test`, `build` on PRs
- [ ] Add Prettier (or Biome) config; formatting is currently inconsistent (single vs double quotes, semicolons)
- [ ] Enable type-aware ESLint rules (`recommendedTypeChecked`) as the `any` count drops
- [ ] Consider `@typescript-eslint/no-floating-promises` — `useEffect(() => { loadRooms(); }, ...)` and similar async calls are unawaited

### 17. Docs and housekeeping

- [ ] Replace the stock Vite `README.md` with setup, env vars, scripts, architecture, and DB migration instructions
- [ ] Document the folder conventions and state-store layout after the split
- [ ] Remove `src/.DS_Store` and any other untracked macOS artifacts (already gitignored, but present locally)
- [ ] Merge `todos.md` into a single tracked backlog (this file), or clearly separate product TODOs from tech debt. `src/components/MainGameArea/Key Issues` has already been folded into the appendix below.
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

---

## Appendix: notes migrated from `src/components/MainGameArea/Key Issues`

These notes were folded in when the stray `Key Issues` source file was deleted. Status as of the current tree:

1. **Monolithic `GameState.ts`** — resolved: split into slices (see item 5).
2. **Inconsistent component organization** — still tracked under item 11.
3. **`any` types in `saveLoad.ts`** — resolved (see item 3).
4. **Types file doing too much** — resolved: types, fixtures, and logic separated (see item 9).
5. **Dead/duplicate code (vite-project, Firebase alongside Supabase)** — resolved (see item 10).
6. **No barrel exports** — still tracked under item 11.
7. **Stub room fallback in `denormalizeNeighbors`** — resolved: missing rooms now throw instead of creating `"Unknown"` stubs (see item 4).
