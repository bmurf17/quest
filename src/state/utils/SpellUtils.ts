import { Enemy } from "@/types/Enemy";
import { Spell } from "@/types/Spell";
import { CharacterData } from "@/types/Character";
import { isEnemy, handleCombatCompletion } from "./CombatUtils";
import { GameStatus } from "@/types/GameStatus";

export type SpellHandlerResult = {
  updatedParty: CharacterData[];
  updatedEnemies: Enemy[];
  combatOrder: (CharacterData | Enemy)[];
  nextIndex: number;
  newAccumulatedExp: number;
  gameStatus: GameStatus;
  earlyCompletion?: {
    completion: any;
  };
};

// calcDamageFn is injected to avoid a circular runtime import on GameState
export function handleSpell(
  spell: Spell,
  target: Enemy | CharacterData | undefined,
  state: any,
  logBuilder: { add: (s: string) => any; build?: () => string[] },
  calcDamageFn: (
    defense: number,
    strength: number,
    dex: number,
    weaponDamage?: number,
  ) => number,
): SpellHandlerResult {
  let updatedParty: CharacterData[] = state.party;
  let updatedEnemies: Enemy[] = (
    state.roomInstances.get(state.room.id) || state.room
  ).enemies;
  let combatOrder: (CharacterData | Enemy)[] = state.combatOrder;
  let nextIndex =
    (state.activeFighterIndex + 1) % Math.max(1, combatOrder.length);
  let newAccumulatedExp = state.accumulatedExp;
  let gameStatus: GameStatus = state.gameStatus;

  switch (spell.effect.type) {
    case "damage":
      if (spell.effect.target === "single" && target && isEnemy(target)) {
        const enemy = target as Enemy;
        const currentAttacker = state.combatOrder[
          state.activeFighterIndex
        ] as CharacterData;
        const currentIntelligence = currentAttacker.abilities.int.score;
        const currentWisdom = currentAttacker.abilities.wis.score;
        const damage = calcDamageFn(
          enemy.defense,
          currentWisdom,
          currentIntelligence,
        );

        const newHealth = Math.max(0, enemy.health - damage);

        if (newHealth <= 0) {
          const defeatedEnemyIndex = combatOrder.findIndex(
            (x) => x.name === enemy.name,
          );

          updatedEnemies = updatedEnemies.filter((e) => e.id !== enemy.id);
          combatOrder = combatOrder.filter((x) => x.name !== enemy.name);
          newAccumulatedExp += enemy.expGain ?? 10;

          logBuilder.add(
            `${enemy.name} takes ${damage} damage and is defeated!`,
          );

          if (defeatedEnemyIndex <= state.activeFighterIndex) {
            nextIndex =
              state.activeFighterIndex % Math.max(1, combatOrder.length);
          } else {
            nextIndex =
              (state.activeFighterIndex + 1) % Math.max(1, combatOrder.length);
          }

          const completion = handleCombatCompletion(
            updatedEnemies,
            nextIndex,
            updatedParty,
            newAccumulatedExp,
          );

          return {
            updatedParty,
            updatedEnemies,
            combatOrder,
            nextIndex,
            newAccumulatedExp,
            gameStatus,
            earlyCompletion: { completion },
          };
        } else {
          updatedEnemies = updatedEnemies.map((e) =>
            e.id === enemy.id ? { ...e, health: newHealth } : e,
          );
          logBuilder.add(`${enemy.name} takes ${damage} damage!`);
        }
      } else if (spell.effect.target === "all") {
        const defeatedEnemies: string[] = [];
        const defeatedIndices: number[] = [];

        combatOrder.forEach((fighter, index) => {
          if (isEnemy(fighter)) {
            const enemy = updatedEnemies.find((e) => e.name === fighter.name);
            if (enemy && enemy.health - spell.effect.amount <= 0) {
              defeatedEnemies.push(enemy.name);
              defeatedIndices.push(index);
            }
          }
        });

        updatedEnemies = updatedEnemies
          .map((enemy) => {
            const newHealth = Math.max(0, enemy.health - spell.effect.amount);
            if (newHealth <= 0) {
              newAccumulatedExp += enemy.expGain ?? 10;
            }
            return { ...enemy, health: newHealth };
          })
          .filter((e) => e.health > 0);

        combatOrder = combatOrder.filter(
          (x) => !defeatedEnemies.includes(x.name),
        );
        if (defeatedEnemies.length > 0) {
          const defeatedBeforeOrAtCurrent = defeatedIndices.filter(
            (idx) => idx <= state.activeFighterIndex,
          ).length;

          if (defeatedBeforeOrAtCurrent > 0) {
            nextIndex =
              state.activeFighterIndex % Math.max(1, combatOrder.length);
          } else {
            nextIndex =
              (state.activeFighterIndex + 1) % Math.max(1, combatOrder.length);
          }

          logBuilder.add(`${defeatedEnemies.join(", ")} defeated!`);
        }
        logBuilder.add(`All enemies take ${spell.effect.amount} damage!`);
      }
      break;

    case "heal":
      if (spell.effect.target === "single" && target && "hp" in target) {
        const character = target as CharacterData;
        let newCombatOrder = [...state.combatOrder];

        updatedParty = updatedParty.map((member) => {
          if (member.name === character.name) {
            const wasDead = !member.alive || member.hp <= 0;
            const newHp = Math.min(
              member.maxHp,
              member.hp + spell.effect.amount,
            );

            if (wasDead && newHp > 0) {
              logBuilder.add(`${member.name} has been revived!`);
              if (!newCombatOrder.find((f) => f.name === member.name)) {
                newCombatOrder.push({ ...member, hp: newHp, alive: true });
              }
            } else {
              logBuilder.add(`${member.name} recovers HP!`);
            }

            return { ...member, hp: newHp, alive: newHp > 0 };
          }
          return member;
        });
        combatOrder = newCombatOrder;
      } else if (spell.effect.target === "party") {
        let newCombatOrder = [...state.combatOrder];
        updatedParty = updatedParty.map((member) => {
          const wasDead = !member.alive || member.hp <= 0;
          const newHp = Math.min(member.maxHp, member.hp + spell.effect.amount);

          if (
            wasDead &&
            newHp > 0 &&
            !newCombatOrder.find((f) => f.name === member.name)
          ) {
            newCombatOrder.push({ ...member, hp: newHp, alive: true });
          }

          return { ...member, hp: newHp, alive: newHp > 0 };
        });
        combatOrder = newCombatOrder;
        logBuilder.add(`The party recovers ${spell.effect.amount} HP!`);
      }
      break;
  }

  return {
    updatedParty,
    updatedEnemies,
    combatOrder,
    nextIndex,
    newAccumulatedExp,
    gameStatus,
  };
}
