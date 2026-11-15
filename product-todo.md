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
- [ ] Edit enemies and interactions on an existing room
- [ ] Create multiple exits while forging a new room
- [ ] Explicit start-room flag (today the map uses the first room)
- [ ] Improve create-room flow (inline dialogue picker/creator)

### Phase 2 — Dialogue graph editor

- [x] Load and navigate the full tree, not just the root node
- [x] Add/delete nodes and link choices to next nodes
- [x] Edit speaker, endpoints, skill checks, and outcomes
- [x] Debounced autosave with pending-save merge, flush on leave, and save status
- [ ] Quick dialogue builder inside room creation

Note: the runtime only applies outcomes attached to choices. Node-level outcomes are stored but not actionable, so the editor only exposes choice outcomes.

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
