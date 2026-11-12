import type { CharacterData } from "@/types/Character";
import type { Enemy } from "@/types/Enemy";
import type { ActiveBuff } from "@/types/EnemyMove";
import { GameStatus } from "@/types/GameStatus";
import type { Room } from "@/types/Room";
import {
  addBuff,
  calcDamage,
  checkBossPhaseChange,
  getEffectiveBuffAmount,
  getEnemyMaxHealth,
  pickEnemyMove,
  safeNextIndex,
  setCooldown,
  tickBuffs,
  tickCooldowns,
} from "./CombatUtils";
import type { GameState } from "@/state/slices/types";

export type EnemyTurnState = Pick<
  GameState,
  | "combatOrder"
  | "party"
  | "roomInstances"
  | "room"
  | "activeFighterIndex"
  | "enemyCooldowns"
  | "activeBuffs"
  | "activityLog"
>;

export type EnemyTurnResult =
  | { kind: "no-current-enemy" }
  | { kind: "no-living-members" }
  | { kind: "resolved"; updates: Partial<GameState> };

/**
 * Resolve the current enemy's turn. Pure with respect to zustand: the caller
 * applies the returned updates. Extracted from the store so the (large) move
 * effects can be tested without timers or a live store.
 */
export function resolveEnemyTurn(state: EnemyTurnState): EnemyTurnResult {
  let currentEnemy = state.combatOrder[state.activeFighterIndex] as Enemy;
  if (!currentEnemy) return { kind: "no-current-enemy" };

  const phaseResult = checkBossPhaseChange(currentEnemy);
  let phaseLog = "";
  if (phaseResult.phaseChanged) {
    currentEnemy = { ...currentEnemy, phase: phaseResult.newPhase };
    phaseLog = `${currentEnemy.name} enters Phase ${phaseResult.newPhase}! `;
  }

  const enemyCooldowns = state.enemyCooldowns.get(currentEnemy.id);
  const move = pickEnemyMove(currentEnemy, enemyCooldowns);

  const livingMembers = state.party.filter((member) => member.hp > 0);
  if (livingMembers.length === 0) return { kind: "no-living-members" };

  const effect = move.effect;
  let combatOrder = state.combatOrder;
  let updatedParty = state.party;
  let updatedEnemies: Enemy[] = (
    state.roomInstances.get(state.room.id) || state.room
  ).enemies.map((e) => ({ ...e }));
  let logMessage = "";
  let newCooldowns = tickCooldowns(state.enemyCooldowns, currentEnemy.id);
  let newBuffs: Map<string, ActiveBuff[]> = tickBuffs(state.activeBuffs);

  if (phaseResult.phaseChanged) {
    updatedEnemies = updatedEnemies.map((e) =>
      e.id === currentEnemy.id ? { ...e, phase: phaseResult.newPhase } : e,
    );
    combatOrder = combatOrder.map((f) =>
      "id" in f && f.id === currentEnemy.id
        ? { ...f, phase: phaseResult.newPhase }
        : f,
    );
  }

  switch (effect.type) {
    case "damage": {
      let targets: CharacterData[];

      if (effect.target === "all") {
        targets = livingMembers;
      } else {
        targets = [
          livingMembers[Math.floor(Math.random() * livingMembers.length)],
        ];
      }

      const totalLogParts: string[] = [];

      for (const target of targets) {
        const effectiveDef =
          target.abilities.def.score +
          getEffectiveBuffAmount(newBuffs, target.name, "defense");
        const effectiveStr =
          currentEnemy.strength +
          getEffectiveBuffAmount(newBuffs, currentEnemy.name, "strength");
        const effectiveDex =
          currentEnemy.dex +
          getEffectiveBuffAmount(newBuffs, currentEnemy.name, "dex");

        const damage = calcDamage(effectiveDef, effectiveStr, effectiveDex);
        const newHealth = Math.max(0, target.hp - damage);

        updatedParty = updatedParty.map((member) => {
          if (member.name === target.name) {
            return { ...member, hp: newHealth, alive: newHealth > 0 };
          }
          return member;
        });

        if (newHealth <= 0) {
          totalLogParts.push(`${target.name} has been defeated!`);
          combatOrder = combatOrder.filter((x) => x.name !== target.name);
        } else {
          totalLogParts.push(
            `${target.name} takes ${damage} damage (HP: ${newHealth})`,
          );
        }
      }

      logMessage = `${currentEnemy.name} uses ${move.name}! ${totalLogParts.join(" ")}`;
      break;
    }

    case "heal": {
      const allies = updatedEnemies;
      let targets: Enemy[] = [];

      if (effect.target === "self") {
        targets = [currentEnemy];
      } else if (effect.target === "all_allies") {
        targets = allies;
      } else if (effect.target === "lowest_hp_ally") {
        const sorted = [...allies].sort(
          (a, b) =>
            a.health / getEnemyMaxHealth(a) - b.health / getEnemyMaxHealth(b),
        );
        targets = sorted.length > 0 ? [sorted[0]] : [];
      }

      const healAmount = 15;

      for (const target of targets) {
        const maxHp = getEnemyMaxHealth(target);
        const newHealth = Math.min(maxHp, target.health + healAmount);
        updatedEnemies = updatedEnemies.map((e) =>
          e.id === target.id ? { ...e, health: newHealth } : e,
        );
      }

      const targetNames = targets.map((t) => t.name).join(", ");
      logMessage = `${currentEnemy.name} uses ${move.name}! ${targetNames} healed for ${healAmount}.`;
      break;
    }

    case "buff": {
      const targets: Enemy[] =
        effect.target === "self" ? [currentEnemy] : updatedEnemies;

      for (const target of targets) {
        newBuffs = addBuff(newBuffs, target.name, {
          stat: effect.stat,
          amount: effect.amount,
          remainingTurns: effect.duration,
          source: currentEnemy.name,
        });
      }

      const targetNames = targets.map((t) => t.name).join(", ");
      logMessage = `${currentEnemy.name} uses ${move.name}! ${effect.stat.toUpperCase()} +${effect.amount} for ${effect.duration} turns on ${targetNames}.`;
      break;
    }

    case "debuff": {
      const partyTarget =
        livingMembers[Math.floor(Math.random() * livingMembers.length)];
      if (partyTarget) {
        newBuffs = addBuff(newBuffs, partyTarget.name, {
          stat: effect.stat,
          amount: -effect.amount,
          remainingTurns: effect.duration,
          source: currentEnemy.name,
        });
        logMessage = `${currentEnemy.name} uses ${move.name}! ${partyTarget.name}'s ${effect.stat.toUpperCase()} reduced by ${effect.amount} for ${effect.duration} turns.`;
      }
      break;
    }

    case "spawn": {
      const spawnedEnemies: Enemy[] = [];
      const spawnTemplates = currentEnemy.spawns ?? [];

      for (let i = 0; i < effect.count; i++) {
        const template = spawnTemplates[effect.spawnIndex];
        if (template) {
          const maxHp = template.maxHealth ?? template.health;
          const spawned: Enemy = {
            ...template,
            health: maxHp,
            id: -(Date.now() + i + Math.floor(Math.random() * 1000)),
          };
          spawnedEnemies.push(spawned);
        }
      }

      if (spawnedEnemies.length > 0) {
        updatedEnemies = [...updatedEnemies, ...spawnedEnemies];
        combatOrder = [...combatOrder, ...spawnedEnemies];
      }

      const names = spawnedEnemies.map((e) => e.name).join(", ");
      logMessage = `${currentEnemy.name} uses ${move.name}! ${names} appear!`;
      break;
    }

    default: {
      const target =
        livingMembers[Math.floor(Math.random() * livingMembers.length)];
      const damage = calcDamage(
        target.abilities.def.score,
        currentEnemy.strength,
        currentEnemy.dex,
      );
      const newHealth = Math.max(0, target.hp - damage);

      updatedParty = updatedParty.map((member) => {
        if (member.name === target.name) {
          return { ...member, hp: newHealth, alive: newHealth > 0 };
        }
        return member;
      });

      logMessage = `${currentEnemy.name} uses ${move.name}! ${target.name} takes ${damage} damage (HP: ${newHealth})`;

      if (newHealth <= 0) {
        logMessage = `${currentEnemy.name} uses ${move.name}! ${target.name} has been defeated!`;
        combatOrder = combatOrder.filter((x) => x.name !== target.name);
      }
      break;
    }
  }

  newCooldowns = setCooldown(
    newCooldowns,
    currentEnemy.id,
    move.name,
    move.cooldown,
  );

  const currentRoomInstance =
    state.roomInstances.get(state.room.id) || state.room;
  const updatedRoom: Room = { ...currentRoomInstance, enemies: updatedEnemies };

  const isPartyDefeated = updatedParty.every(
    (member) => member.hp <= 0 || !member.alive,
  );

  if (isPartyDefeated) {
    return {
      kind: "resolved",
      updates: {
        party: updatedParty,
        activityLog: [
          ...state.activityLog,
          phaseLog + logMessage,
          "Your party has been defeated...",
        ],
        activeFighterIndex: 0,
        combatOrder: [],
        gameStatus: GameStatus.GameOver,
        enemyCooldowns: newCooldowns,
        activeBuffs: newBuffs,
      },
    };
  }

  const nextIndex = safeNextIndex(
    state.activeFighterIndex,
    combatOrder.length,
  );

  return {
    kind: "resolved",
    updates: {
      party: updatedParty,
      activityLog: [...state.activityLog, phaseLog + logMessage],
      activeFighterIndex: nextIndex,
      combatOrder,
      enemyCooldowns: newCooldowns,
      activeBuffs: newBuffs,
      room: updatedRoom,
      roomInstances: new Map(state.roomInstances).set(
        state.room.id,
        updatedRoom,
      ),
    },
  };
}
