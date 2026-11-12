import type { CharacterData } from "@/types/Character";
import { formatDamageDice } from "@/lib/dice";
import { AbilitySlot } from "./AbilitySlot";
import { SectionLabel } from "./SectionLabel";
import { useCombatActions } from "./useCombatActions";

export function CombatActions({ fighter }: { fighter: CharacterData }) {
  const { handleAttackClick, handleSpellClick } = useCombatActions();

  return (
    <div>
      {fighter.equipment?.weapon && (
        <>
          <SectionLabel>Weapons</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
              marginBottom: 4,
              marginLeft: 4,
            }}
          >
            <AbilitySlot
              img={fighter.equipment.weapon.img}
              alt={fighter.equipment.weapon.name}
              title={`${fighter.equipment.weapon.name} — Hit: ${fighter.equipment.weapon.action!.hitDC} · Dmg: ${formatDamageDice(fighter.equipment.weapon.action!.damage)}`}
              onClick={handleAttackClick}
            />
          </div>
        </>
      )}

      {fighter.spells?.length > 0 && (
        <>
          <SectionLabel>Skills</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
              marginLeft: 4,
            }}
          >
            {fighter.spells.map((spell, idx) => {
              const notEnoughMana = fighter.mp < spell.manaCost;
              return (
                <AbilitySlot
                  key={spell.name + idx}
                  img={spell.image}
                  alt={spell.name}
                  badge={spell.manaCost}
                  badgeColor={notEnoughMana ? "#374151" : "#4F46E5"}
                  disabled={notEnoughMana}
                  title={`${spell.name} (${spell.manaCost} MP) — ${spell.description}`}
                  onClick={() => handleSpellClick(spell)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
