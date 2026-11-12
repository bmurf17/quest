import { useGameStore } from "@/state/GameState";
import { CharacterData } from "@/types/Character";
import { Spell } from "@/types/Spell";

export function useCombatActions() {
  const attack = useGameStore((state) => state.attack);
  const castSpell = useGameStore((state) => state.castSpell);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);
  const combatOrder = useGameStore((state) => state.combatOrder);
  const index = useGameStore((state) => state.activeFighterIndex);
  const room = useGameStore((state) => state.room);

  const handleAttackClick = () => {
    if (room.enemies.length === 1) {
      attack(room.enemies[0]);
    } else {
      setTargeting(true);
      setTargetingSpell(null);
    }
  };

  const handleSpellClick = (spell: Spell) => {
    const currentCaster = combatOrder[index] as CharacterData;
    if (currentCaster.mp < spell.manaCost) return;

    if (spell.effect.type === "damage") {
      if (spell.effect.target === "single") {
        if (room.enemies.length === 1) {
          castSpell(spell, room.enemies[0]);
        } else {
          setTargeting(true);
          setTargetingSpell(spell);
        }
      } else if (spell.effect.target === "all") {
        castSpell(spell);
      }
    } else if (spell.effect.type === "heal") {
      if (spell.effect.target === "single") {
        setTargeting(true);
        setTargetingSpell(spell);
      } else if (spell.effect.target === "party") {
        castSpell(spell);
      }
    }
  };

  return { handleAttackClick, handleSpellClick };
}
