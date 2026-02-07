import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { GameState } from "../GameState";
import { CharacterData } from "@/types/Character";


export const handleCombatCompletion = (enemies: Enemy[], currentNextIndex: number, party: CharacterData[]) => {
  const isVictory = enemies.length === 0;
  
  if (isVictory) {
    const updatedParty = party.map(char => {
      if (char.alive) {
        return {
          ...char,
          exp: char.exp + 10
        };
      }
      return char;
    });

    return {
      nextIndex: 0,
      status: GameStatus.Exploring,
      logSuffix: " All enemies defeated! Party gained 10 exp!",
      updatedParty
    };
  }

  return {
    nextIndex: currentNextIndex,
    status: GameStatus.Combat,
    logSuffix: "",
    updatedParty: party
  };
};

export const finalizeAttackState = (
  state: GameState,
  updatedEnemies: Enemy[],
  newStatus: GameStatus,
  nextIndex: number,
  combatOrder: any[],
  logMessage: string,
  hitEnemyId: string,
  lastHitCounter: number,
) => {
  const currentRoomInstance = state.roomInstances.get(state.room) || state.room;

  const updatedRoom = {
    ...currentRoomInstance,
    enemies: updatedEnemies,
  };

  const originalTemplate = [...state.roomInstances.entries()].find(
    ([template, instance]) =>
      instance === currentRoomInstance || template === state.room,
  )?.[0];

  const newRoomInstances = new Map(state.roomInstances);
  if (originalTemplate) {
    newRoomInstances.set(originalTemplate, updatedRoom);
  }

  return {
    room: updatedRoom,
    roomInstances: newRoomInstances,
    gameStatus: newStatus,
    activityLog: [...state.activityLog, logMessage],
    activeFighterIndex: nextIndex,
    combatOrder: combatOrder,
    lastHitEnemyId: hitEnemyId,
    lastHitCounter: lastHitCounter,
  };
};