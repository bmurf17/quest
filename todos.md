Database 
    NPC inventory
Consumables used by a single char
Spells using stats
Char Creation
    Enter the Char's name
    Char is a template
    Assign the skills
Equipment
Consumables get used
Consumables do the right thing (mana potions heal hp)
Consumables progress combat
Orbements- non equipment that effects stats??
Mini Map
Admin
    More control over room stuff
    Export db as backup
    Set Character Skill Trees
    Create Transition (one map to the next) Rooms
Things to draw
    Axe
    New Chars
    Animals
    Armour
    Trees
Dialogue Trees
Split Game State into helper methods
Game Over
Transition From One Map to the Next
World Hub
Buy item removes it from shop (certain items)
Sound effects
    Spells
        fireball
        Heal
Crit hits


2. Extract shared primitives into a ui/ component folder
You've already got StatBar, SectionHeader, ActionBtn, and AbilitySlot duplicated or re-implemented across files. Move them to src/components/ui/ so every screen imports the same ones.
3. Replace the repeated Google Fonts <style> tag
Every component imports Cinzel and Lato independently via an @import in a <style> tag. Move this once into your root index.css or App.tsx and delete it from every component.
4. Consider CSS variables for the theme
Since you're mixing Tailwind and inline styles, CSS variables declared on :root would let both systems share the same values — your inline styles use var(--color-gold) and your Tailwind config references the same variable.
5. Consolidate the ActionBtn / button patterns
You have subtle button styling differences between ActionMenu, ManageRooms, the admin cards, and the party screen. One <Button> component with variant and size props would standardise hover states, press animations, and disabled logic in one place.
6. Audit the Tailwind / inline style split
Right now some components are pure inline styles, some are pure Tailwind, and some mix both (like MainGameArea). Picking one approach per layer — Tailwind for layout and spacing, inline/CSS vars for the custom theme colors — would make the codebase much easier to scan.