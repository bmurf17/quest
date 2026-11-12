# Code conventions

## Imports

- Use the `@/` alias for every import that crosses a directory boundary.
  - Good: `import { useGameStore } from "@/state/GameState";`
  - Good: `import warriorImg from "@/assets/warrior.png";`
  - Avoid: `import { useGameStore } from "../../state/GameState";`
- Use `./` only for files in the **same directory** (sibling modules).
- `eslint` enforces this with `no-restricted-imports`: parent-relative imports
  (`../`, `../../`, ...) are errors in `src/`. Test helpers under `tests/` are
  exempt because `@/` points at `src/`, not at the test directory.
- Import types with `import type`:
  ```ts
  import type { CharacterData } from "@/types/Character";
  ```
  `@typescript-eslint/consistent-type-imports` enforces this.

## Components

```
src/components/
  GameLayout.tsx          # single-file, layout-level component
  CharacterSheet.tsx      # single-file, shared component
  ActionMenu/             # PascalCase feature folder
    ActionMenu.tsx        # feature entry component
    ActionBtn.tsx         # supporting component
    useCombatActions.ts   # feature hook
  MainGameArea/
    MainGameArea.tsx      # feature entry component
    _BattleOrder.tsx      # private partial (`_` prefix)
  Party/
    Party.tsx
    management/           # lowercase internal grouping folder
    shared/               # lowercase reusable sub-components
  shared/                 # cross-feature reusable components
  ui/                     # shadcn/Radix primitives
```

- **Feature folders** are PascalCase and named after the feature. The entry
  component lives in the folder with the same name, e.g.
  `ActionMenu/ActionMenu.tsx`.
- **Single-file components** stay flat in `components/` as PascalCase files.
- **Internal grouping folders** are lowercase (`forms/`, `tavern/`,
  `create-room/`, `management/`). These are implementation details, not
  feature entry points.
- **`shared/`** holds reusable components. `components/shared/` is
  cross-feature; `components/<Feature>/shared/` is reusable within that
  feature only.
- **`ui/`** is reserved for the shadcn/Radix primitives.
- **`_` prefix** marks a private partial: a file that is only imported by the
  entry component in the same folder. Do not import `_` files from other
  folders.

File naming:

- Components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Helpers/utilities: `camelCase.ts`
- Tests: `*.test.ts` in a nearby `__tests__/` folder (or alongside the module)

## Deep imports instead of barrels

There are no `index.ts` barrel files. Import the module directly:

```ts
import { PartySelection } from "@/components/Party/PartySelection";
```

This keeps imports explicit, avoids circular dependency cycles, and lets Vite
tree-shake and split bundles at the module boundary. If a feature needs a
public surface, export the named component from its own file rather than
re-exporting it through a barrel.
