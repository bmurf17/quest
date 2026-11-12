import type { CharacterData } from "@/types/Character";
import type { Enemy } from "@/types/Enemy";
import type { ActiveBuff } from "@/types/EnemyMove";
import { GameStatus } from "@/types/GameStatus";
import { startRoom } from "@/data/fixtures/rooms";
import type { Spell } from "@/types/Spell";
import {
  calcDamage,
  handleCombatCompletion,
  isEnemy,
  safeNextIndex,
  scheduleEnemyTurn,
} from "@/state/utils/CombatUtils";
import { resolveAttack } from "@/state/utils/AttackUtils";
import { resolveEnemyTurn } from "@/state/utils/EnemyTurnUtils";
import { handleSpell } from "@/state/utils/SpellUtils";
import { ActivityLogBuilder } from "@/state/utils/ActivityLogUtils";
import type { GameState, GameSlice } from "./types";

export type CombatSlice = Pick<
  GameState,
  | "combatOrder"
  | "activeFighterIndex"
  | "enemyCooldowns"
  | "activeBuffs"
  | "accumulatedExp"
  | "attack"
  | "enterCombat"
  | "isCurrentFighterEnemy"
  | "performEnemyTurn"
  | "castSpell"
  | "lastHitEnemyId"
  | "lastHitCounter"
  | "lastDefeatedEnemyId"
  | "lastDefeatedCounter"
  | "isTargeting"
  | "setTargeting"
  | "targetingSpell"
  | "setTargetingSpell"
>;

export const createCombatSlice: GameSlice<CombatSlice> = (set, get) => ({
  combatOrder: [],
  activeFighterIndex: 0,
  enemyCooldowns: new Map<number, Map<string, number>>(),
  activeBuffs: new Map<string, ActiveBuff[]>(),
  accumulatedExp: 0,
  lastHitEnemyId: null,
  lastHitCounter: 0,
  lastDefeatedEnemyId: null,
  lastDefeatedCounter: 0,
  isTargeting: false,
  targetingSpell: null,

  setTargeting: (targeting: boolean) => set({ isTargeting: targeting }),

  setTargetingSpell: (spell: Spell | null) => set({ targetingSpell: spell }),

  isCurrentFighterEnemy: () => {
    const state = get();
    const currentFighter = state.combatOrder[state.activeFighterIndex];
    return isEnemy(currentFighter);
  },

  performEnemyTurn: () => {
    const result = resolveEnemyTurn(get());
    if (result.kind !== "resolved") return;
    set(result.updates);
    scheduleEnemyTurn(get);
  },

  attack: (enemy: Enemy) => {
    set((state) => resolveAttack(state, enemy));
    scheduleEnemyTurn(get);
  },

  enterCombat: () =>
    set((state) => {
      const room = state.room !== null && state.room !== undefined ? state.room : startRoom;

      return {
        combatOrder: [...state.party, ...room.enemies],
        enemyCooldowns: new Map<number, Map<string, number>>(),
        activeBuffs: new Map<string, ActiveBuff[]>(),
      };
    }),

  castSpell: (spell: Spell, target?: Enemy | CharacterData) =>
    set((state) => {
      const currentCaster = state.combatOrder[state.activeFighterIndex] as CharacterData;

      if (currentCaster.mp < spell.manaCost) {
        return {
          activityLog: [...state.activityLog, `Not enough mana to cast ${spell.name}!`],
        };
      }

      const logBuilder = new ActivityLogBuilder().add(`${currentCaster.name} casts ${spell.name}!`);

      let updatedParty = state.party;
      let updatedEnemies = (state.roomInstances.get(state.room.id) || state.room).enemies;
      let combatOrder = state.combatOrder;
      let nextIndex = safeNextIndex(state.activeFighterIndex, state.combatOrder.length);
      let newAccumulatedExp = state.accumulatedExp;
      let gameStatus = state.gameStatus;

      updatedParty = updatedParty.map((member) => {
        if (member.name === currentCaster.name) {
          return { ...member, mp: member.mp - spell.manaCost };
        }
        return member;
      });

      const result = handleSpell(spell, target, state, logBuilder, calcDamage);
      if (result.earlyCompletion) {
        const completion = result.earlyCompletion.completion;

        nextIndex = completion.nextIndex;
        updatedParty = completion.updatedParty;
        gameStatus = completion.status;

        const currentRoomInstance = state.roomInstances.get(state.room.id) || state.room;
        const updatedRoom = {
          ...currentRoomInstance,
          enemies: result.updatedEnemies,
        };
        const newRoomInstances = new Map(state.roomInstances);
        newRoomInstances.set(state.room.id, updatedRoom);

        setTimeout(() => {
          const { gameStatus, isCurrentFighterEnemy, performEnemyTurn } = get();
          if (gameStatus === GameStatus.Combat && isCurrentFighterEnemy()) {
            performEnemyTurn();
          }
        }, 500);

        return {
          party: updatedParty,
          activityLog: [...state.activityLog, ...logBuilder.build()],
          combatOrder: result.combatOrder,
          activeFighterIndex: nextIndex,
          gameStatus: gameStatus,
          room: updatedRoom,
          roomInstances: newRoomInstances,
          accumulatedExp: gameStatus === GameStatus.Exploring ? 0 : result.newAccumulatedExp,
          isTargeting: false,
          targetingSpell: null,
          levelingUpChars: completion.levelingUpChars || [],
          isLevelingUp: (completion.levelingUpChars || []).length > 0,
          currentLevelingCharIndex: (completion.levelingUpChars || []).length > 0 ? 0 : -1,
        };
      }

      updatedParty = result.updatedParty;
      updatedEnemies = result.updatedEnemies;
      combatOrder = result.combatOrder;
      nextIndex = result.nextIndex;
      newAccumulatedExp = result.newAccumulatedExp;
      gameStatus = result.gameStatus;

      const currentRoomInstance = state.roomInstances.get(state.room.id) || state.room;
      const updatedRoom = { ...currentRoomInstance, enemies: updatedEnemies };
      const newRoomInstances = new Map(state.roomInstances);
      newRoomInstances.set(state.room.id, updatedRoom);

      if (updatedEnemies.length === 0 && state.gameStatus === GameStatus.Combat) {
        const completion = handleCombatCompletion(
          updatedEnemies,
          nextIndex,
          updatedParty,
          newAccumulatedExp,
        );

        return {
          party: completion.updatedParty,
          activityLog: [...state.activityLog, ...logBuilder.build()],
          combatOrder,
          activeFighterIndex: completion.nextIndex,
          gameStatus: completion.status,
          room: updatedRoom,
          roomInstances: newRoomInstances,
          accumulatedExp: completion.status === GameStatus.Exploring ? 0 : newAccumulatedExp,
          isTargeting: false,
          targetingSpell: null,
        };
      }

      setTimeout(() => {
        const { gameStatus, isCurrentFighterEnemy, performEnemyTurn } = get();
        if (gameStatus === GameStatus.Combat && isCurrentFighterEnemy()) {
          performEnemyTurn();
        }
      }, 500);
      return {
        party: updatedParty,
        activityLog: [...state.activityLog, ...logBuilder.build()],
        combatOrder,
        activeFighterIndex: nextIndex,
        room: updatedRoom,
        roomInstances: newRoomInstances,
        accumulatedExp: newAccumulatedExp,
        isTargeting: false,
        targetingSpell: null,
      };
    }),
});
