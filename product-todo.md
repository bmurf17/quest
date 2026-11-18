## Product backlog

### Database and admin

- [x] Export DB as backup
- [ ] More control over room stuff
- [ ] Admin
- [ ] Database

### Characters, items, and combat

- NPC inventory
- Spells using stats
- Spells: Fireball, Heal
- Equipment
- Have equipment actually do something
- Orbements — non-equipment items that affect stats
- Set character skill trees
  - make it so that you can get skills can actually be used
- Crit hits
- Can use spells outside combat
- Heal dead party members
- [x] Buy item removes it from shop (limited shop stock)
- Achievements
- Make the battle order scrollable

### World and presentation

- World hub
- Sound effects
- Mobile doesn't suck

### Art to draw

- Axe
- New chars
- Animals
- Armour
- Trees

### Game Admin

- [x] Easier to know where things are
- [ ] More control of creating rooms
- [ ] Can create dialog in the room creation
- [x] Create items
- [x] Balance changes quickly
- [x] more elaborate boss creation

## Admin overhaul progress

Planned order agreed with the design owner. Items are checked as they ship.

### Phase 1 — Navigation + room editing (in progress)

- [x] Persistent admin shell with sidebar navigation and breadcrumbs
- [x] Rooms list with search and section filter
- [x] Edit room name and section
- [x] Delete room (cascades exits/interactions)
- [x] Add/remove symmetric doorways between rooms
- [x] Room diagnostics: isolated rooms, one-way exits, duplicate names, unreachable rooms
- [x] "Edit Room" action from the Realm Map popup
- [x] Full-height admin shell with its own scroll pane (fixes clipped backgrounds)
- [x] Realm Map room dialog stays centered in the viewport
- [x] Edit enemies and interactions on an existing room
- [x] Create multiple exits while forging a new room
- [x] Explicit start-room flag (today the map uses the first room)
- [x] Improve create-room flow (inline dialogue picker/creator)

Room editing now covers the full contents of an existing room: pick reusable enemies from the library, or change the interaction type (NPC, chest, camp, transition, cutscene) and its fields in place. `saveRoomInteraction` updates child rows when the type is unchanged so quests and chest state survive, then cleans up stale children after a type change. The World Builder can also add several exits at once; each exit is mirrored on the destination and duplicate directions are rejected before the room is created.

### Phase 2 — Dialogue graph editor

- [x] Load and navigate the full tree, not just the root node
- [x] Add/delete nodes and link choices to next nodes
- [x] Edit speaker, endpoints, skill checks, and outcomes
- [x] Debounced autosave with pending-save merge, flush on leave, and save status
- [x] Quick dialogue builder inside room creation

Note: the runtime only applies outcomes attached to choices. Node-level outcomes are stored but not actionable, so the editor only exposes choice outcomes.

The room creator now lets you link an existing NPC/dialogue tree or build a quick linear conversation inline: ordered lines, optional player choices, and choice outcomes. Quick-built trees can be refined later in the full graph editor; branching, skill checks, and flags still live there.

### Phase 3 — Items and economy (DB-first)

- [x] Load items from Supabase and seed from current static data
- [x] Item CRUD with live preview (consumable/equipment fields)
- [x] Shop stock and quantities, including limited stock
- [x] Point the shop at the item data instead of hardcoded potions

Note: `003_items_shop.sql` is applied to the live project. Item descriptions reuse the existing `effect` column, so no item migration was required.

### Phase 4 — Enemies, bosses, and balance

- [x] Reusable enemy library instead of per-room duplication
- [x] Attach library enemies to rooms
- [x] Boss editor: phases, per-phase moves, spawns, rewards
- [x] Balance table with inline stat editing and computed estimates
- [ ] Encounter test/simulation using existing combat helpers

Boss phases, moves, and spawns are edited with structured forms on the Enemies page. Each boss/enemy can carry a gold reward and a list of item rewards; both pay out once per kill at runtime (auto-attacks and spells). Rewards use full item snapshots in `reward_items`, the same approach as `spawns`, so combat never needs an extra item lookup.

Note: `006_enemy_rewards.sql` is applied to the live project, so `gold_reward` and `reward_items` exist on `enemies`. The balance tools still give a deterministic threat estimate rather than a full combat simulation.

### Phase 5 — Backup and ops

- [x] One-click JSON export of core tables
- [x] Import/restore with confirmation
- [x] Backup history / snapshots
- [x] Admin remains local/solo (no auth for now, per owner)

Notes: snapshots live in browser localStorage (last 8, 4 MB each). Downloads are the durable copy. Restore clears then reinserts the tables present in the backup, parents first, and requires typing `RESTORE`. Apply `supabase/migrations/004_backup_sequences.sql` so identity sequences are reset after a restore; it auto-discovers every serial `id` table, including `shop_stock`. Without it restore still works but new rows may collide with restored ids.

## Admin overhaul v2 — map-first editing, search, and image libraries

Agreed with the design owner. Nothing here is shipped yet. The map becomes the primary room editor, the admin nav collapses to one rail, and enemies/dialogues gain the image-first treatment items already have.

### Phase 1 — Admin shell and global search

- [x] Slim icon rail (with tooltips) replacing the full-width admin sidebar
- [x] Admin top bar with breadcrumbs and a global search trigger
- [x] `Cmd/Ctrl+K` search palette across rooms, items, enemies, and NPCs, with lazy loading and caching
- [x] URL-driven selection (`?room=`, `?item=`, `?enemy=`, `?npc=`) so search, map links, and browser back work
- [x] Replace the Overview card grid with a dashboard: counts, warnings, recent content, and shortcuts
- [x] Shared `AdminPageHeader` and layout primitives to stop hand-rolled duplicated inline styles

The admin shell now uses a 64px icon rail with hover tooltips, a breadcrumb/search top bar, and a dark command palette that lazy-loads content the first time it opens. Rooms, items, enemies, and NPCs all accept a URL selection parameter, and the Overview page reports counts, structural warnings, recently added rooms, and workspace shortcuts.

### Phase 2 — Realm Map as room cockpit

#### Data foundation

- [x] Migration `008_room_map_and_start_rooms.sql`: `rooms.map_x`, `rooms.map_y`, `sections.start_room_id`
- [x] Backfill each section's start room from its current lowest-id room
- [x] Carry the new fields through `Room`/`Section` types and `getAllRooms`/`getSections`
- [x] `updateRoomPosition`, `setSectionStartRoom`, and `createRoomWithExits` query helpers
- [x] Wire `startSection` in the runtime to `section.startRoomId` (falling back to the first room)

#### Map rendering

- [x] Replace recursive render-by-name with a flat graph builder and deduped edges keyed by room id
- [x] Compass auto-layout per section start, with saved `map_x`/`map_y` drag overrides
- [x] Show disconnected/unreachable rooms in an "Unplaced" lane instead of hiding them
- [x] One SVG edge per connection, direction labels preserved, curves for loops
- [x] Pan vs drag distinction, zoom controls, and wheel zoom
- [x] Room/section selection in the URL; map "Edit Room" selects the node instead of navigating away

#### Inspector drawer

- [x] Right-side inspector (full-screen sheet on mobile) with Basics, Contents, Exits, and Danger tabs
- [x] Basics: name, section, "Make section start", diagnostics warnings
- [x] Contents: reuse the room enemies/interaction editor
- [x] Exits: list/remove doorways, add existing doorway, add a new room in an empty N/S/E/W slot
- [x] Danger: delete room
- [x] Extract `RoomInspector` so the map drawer and Rooms page share one editor
- [x] Fold section create/rename/delete into a map dialog; keep the Sections page as secondary
- [x] Keep `/rooms` as an alternate list view and `/rooms/new` as a fallback create flow

The map is now a flat graph: `buildRoomGraph` collapses both sides of a doorway into one edge, `computeSectionLayout` places rooms by compass steps from the section start, and saved drag coordinates override the auto-layout. Disconnected rooms appear in an "Unplaced" lane. Panning, zooming, and room dragging are separate gestures; dropping a room persists its grid position, and "Reset layout" clears overrides.

`RoomInspector` is shared by the map drawer and `/rooms`, so Basics, Contents, Exits, and Danger behave identically. The inspector can promote a room to section start, add an existing doorway, or create a new room in any empty compass slot. Section create/rename/delete also moved into a map dialog; the Sections page stays as a secondary view.

Note: apply `supabase/migrations/008_room_map_and_start_rooms.sql` to the live project before using drag positions or section starts. Startup still works without it because sections and rooms are read with `select *`, but drag saves and start-room writes need the new columns.

### Phase 3 — Image-first enemies and dialogues

- [ ] Generate `src/data/imageAssets.ts` from `public/images/**` and `src/assets/**` (`predev`/`prebuild` script)
- [ ] Shared `AdminImageField` + preview: searchable picker, category tabs, manual path/URL fallback
- [ ] Generalize `resolveItemImage` into `resolveEntityImage(img, category)`
- [ ] Enemy library rows show sprite thumbnails (placeholder when empty)
- [ ] Enemy editor uses the shared image field and preview card
- [ ] Enemy portraits in the Realm Map inspector/popup
- [ ] NPC list rows show portraits; dialogue editor gains an NPC details block with image editing
- [ ] Persist NPC images from the room interaction editor and quick dialogue builder

### Phase 4 — Polish and verification

- [ ] Consistent save/toast behavior and unsaved-change guard in the map inspector
- [ ] Surface duplicate-name, isolated-room, one-way-exit, and missing-start-room warnings on map nodes
- [ ] Unit tests: layout cycles/islands/overrides, per-section start rooms, image resolver, position/start-room queries
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:run`
- [ ] Update the Admin overhaul progress section as Phase 1 items ship

### Decisions

- Dragging a room auto-saves its position on drop, with a "Reset layout" action in the map header.
- The section start room drives actual exploration, not just the map.
- Rooms page remains available as an alternate view; the map is the primary editor.
- No freeform placement for every room: auto-layout with drag overrides.
- No Supabase Storage uploads yet: asset picker plus path/URL fallback.
