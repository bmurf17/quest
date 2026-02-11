import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { GameState } from "../GameState";
import { CharacterData } from "@/types/Character";

export const handleCombatCompletion = (
  enemies: Enemy[], 
  currentNextIndex: number, 
  party: CharacterData[],
  accumulatedExp?: number
) => {
  const isVictory = enemies.length === 0;
  
  if (isVictory) {
    const totalExpGained = accumulatedExp ?? 10;
    
    const levelingUpChars: CharacterData[] = [];
    
    const updatedParty = party.map(char => {
      if (char.alive) {
        const newExp = char.exp + totalExpGained;
        
        if (newExp >= char.nextLevelExp) {
          levelingUpChars.push({ ...char, exp: newExp });
        }
        
        return {
          ...char,
          exp: newExp
        };
      }
      return char;
    });

    return {
      nextIndex: 0,
      status: GameStatus.Exploring,
      logSuffix: ` All enemies defeated! Party gained ${totalExpGained} exp!`,
      updatedParty,
      levelingUpChars
    };
  }

  return {
    nextIndex: currentNextIndex,
    status: GameStatus.Combat,
    logSuffix: "",
    updatedParty: party,
    levelingUpChars: []
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
  isDefeated: boolean = false,
  defeatedCount: number = 0
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
    lastDefeatedEnemyId: isDefeated ? hitEnemyId : null,
    lastDefeatedCounter: isDefeated ? defeatedCount : state.lastDefeatedCounter
  };
};