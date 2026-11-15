import type { Enemy } from "@/types/Enemy";
import type { Spell } from "@/types/Spell";
import type { CharacterData } from "@/types/Character";
import type { ActiveBuff } from "@/types/EnemyMove";
import type { GameStatus } from "@/types/GameStatus";
import type { Room } from "@/types/Room";
import {
  getEffectiveBuffAmount,
  isEnemy,
  getEnemyRewards,
  handleCombatCompletion,
} from "./CombatUtils";
import type { Item } from "@/types/Item";

export type SpellHandlerResult = {
  updatedParty: CharacterData[];
  updatedEnemies: Enemy[];
  combatOrder: (CharacterData | Enemy)[];
  nextIndex: number;
  newAccumulatedExp: number;
  goldGained: number;
  itemsGained: Item[];
  gameStatus: GameStatus;
  earlyCompletion?: {
    completion: ReturnType<typeof handleCombatCompletion>;
  };
};

export type SpellState = {
  party: CharacterData[];
  room: Room;
  roomInstances: Map<number, Room>;
  combatOrder: (CharacterData | Enemy)[];
  activeFighterIndex: number;
  accumulatedExp: number;
  gameStatus: GameStatus;
  activeBuffs?: Map<string, ActiveBuff[]>;
};

// calcDamageFn is injected to avoid a circular runtime import on GameState
export function handleSpell(
  spell: Spell,
  target: Enemy | CharacterData | undefined,
  state: SpellState,
  logBuilder: { add: (s: string) => unknown; build?: () => string[] },
  calcDamageFn: (defense: number, strength: number, dex: number, weaponDamage?: number) => number,
): SpellHandlerResult {
  let updatedParty: CharacterData[] = state.party;
  let updatedEnemies: Enemy[] = (state.roomInstances.get(state.room.id) || state.room).enemies;
  let combatOrder: (CharacterData | Enemy)[] = state.combatOrder;
  let nextIndex = (state.activeFighterIndex + 1) % Math.max(1, combatOrder.length);
  let newAccumulatedExp = state.accumulatedExp;
  let goldGained = 0;
  const itemsGained: Item[] = [];
  const gameStatus: GameStatus = state.gameStatus;

  switch (spell.effect.type) {
    case "damage":
      if (spell.effect.target === "single" && target && isEnemy(target)) {
        const enemy = target;
        const currentAttacker = state.combatOrder[state.activeFighterIndex] as CharacterData;
        const activeBuffs: Map<string, ActiveBuff[]> =
          state.activeBuffs ?? new Map<string, ActiveBuff[]>();
        let currentIntelligence = currentAttacker.abilities.int.score;
        let currentWisdom = currentAttacker.abilities.wis.score;
        currentIntelligence += getEffectiveBuffAmount(
          activeBuffs,
          currentAttacker.name,
          "intelligence",
        );
        currentWisdom += getEffectiveBuffAmount(activeBuffs, currentAttacker.name, "wisdom");
        const effectiveDef =
          enemy.defense + getEffectiveBuffAmount(activeBuffs, enemy.name, "defense");
        const damage = calcDamageFn(effectiveDef, currentWisdom, currentIntelligence);

        const newHealth = Math.max(0, enemy.health - damage);

        if (newHealth <= 0) {
          const defeatedEnemyIndex = combatOrder.findIndex((x) => x.name === enemy.name);

          updatedEnemies = updatedEnemies.filter((e) => e.id !== enemy.id);
          combatOrder = combatOrder.filter((x) => x.name !== enemy.name);
          newAccumulatedExp += enemy.expGain ?? 10;
          const reward = getEnemyRewards(enemy);
          goldGained += reward.gold;
          itemsGained.push(...reward.items);

          logBuilder.add(`${enemy.name} takes ${damage} damage and is defeated!`);

          if (defeatedEnemyIndex <= state.activeFighterIndex) {
            nextIndex = state.activeFighterIndex % Math.max(1, combatOrder.length);
          } else {
            nextIndex = (state.activeFighterIndex + 1) % Math.max(1, combatOrder.length);
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
            goldGained,
            itemsGained,
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
              const reward = getEnemyRewards(enemy);
              goldGained += reward.gold;
              itemsGained.push(...reward.items);
            }
            return { ...enemy, health: newHealth };
          })
          .filter((e) => e.health > 0);

        combatOrder = combatOrder.filter((x) => !defeatedEnemies.includes(x.name));
        if (defeatedEnemies.length > 0) {
          const defeatedBeforeOrAtCurrent = defeatedIndices.filter(
            (idx) => idx <= state.activeFighterIndex,
          ).length;

          if (defeatedBeforeOrAtCurrent > 0) {
            nextIndex = state.activeFighterIndex % Math.max(1, combatOrder.length);
          } else {
            nextIndex = (state.activeFighterIndex + 1) % Math.max(1, combatOrder.length);
          }

          logBuilder.add(`${defeatedEnemies.join(", ")} defeated!`);
        }
        logBuilder.add(`All enemies take ${spell.effect.amount} damage!`);
      }
      break;

    case "heal":
      if (spell.effect.target === "single" && target && "hp" in target) {
        const character = target;
        const newCombatOrder = [...state.combatOrder];

        updatedParty = updatedParty.map((member) => {
          if (member.name === character.name) {
            const wasDead = !member.alive || member.hp <= 0;
            const newHp = Math.min(member.maxHp, member.hp + spell.effect.amount);

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
        const newCombatOrder = [...state.combatOrder];
        updatedParty = updatedParty.map((member) => {
          const wasDead = !member.alive || member.hp <= 0;
          const newHp = Math.min(member.maxHp, member.hp + spell.effect.amount);

          if (wasDead && newHp > 0 && !newCombatOrder.find((f) => f.name === member.name)) {
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
    goldGained,
    itemsGained,
    gameStatus,
  };
}
