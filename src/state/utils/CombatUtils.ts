import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { GameState } from "../GameState";
import { CharacterData, rollDamageDice } from "@/types/Character";
import { Quest } from "@/types/RoomInteractions";

export const handleCombatCompletion = (
  enemies: Enemy[],
  currentNextIndex: number,
  party: CharacterData[],
  accumulatedExp?: number,
) => {
  const isVictory = enemies.length === 0;

  if (isVictory) {
    const totalExpGained = accumulatedExp ?? 10;

    const levelingUpChars: CharacterData[] = [];

    const updatedParty = party.map((char) => {
      if (char.alive) {
        const newExp = char.exp + totalExpGained;

        if (newExp >= char.nextLevelExp) {
          levelingUpChars.push({ ...char, exp: newExp });
        }

        return {
          ...char,
          exp: newExp,
        };
      }
      return char;
    });

    return {
      nextIndex: 0,
      status: GameStatus.Exploring,
      logSuffix: ` All enemies defeated! Party gained ${totalExpGained} exp!`,
      updatedParty,
      levelingUpChars,
    };
  }

  return {
    nextIndex: currentNextIndex,
    status: GameStatus.Combat,
    logSuffix: "",
    updatedParty: party,
    levelingUpChars: [],
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
  defeatedCount: number = 0,
  quests: Quest[],
) => {
  const currentRoomInstance =
    state.roomInstances.get(state.room.id) || state.room;

  const updatedRoom = {
    ...currentRoomInstance,
    enemies: updatedEnemies,
  };

  const originalTemplateId = [...state.roomInstances.entries()].find(
    ([templateId, instance]) =>
      instance === currentRoomInstance || templateId === state.room.id,
  )?.[0];

  const newRoomInstances = new Map(state.roomInstances);
  if (originalTemplateId !== undefined) {
    newRoomInstances.set(originalTemplateId, updatedRoom);
  }
  const lastDefeatedEnemyId = isDefeated ? hitEnemyId : null;

  const updatedQuests = quests.map((quest) => {
    if (
      quest.type.type === "defeat" &&
      quest.type.enemy.id.toString() === lastDefeatedEnemyId
    ) {
      return {
        ...quest,
        status: "completed",
      };
    }
    return quest;
  });

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
    lastDefeatedCounter: isDefeated ? defeatedCount : state.lastDefeatedCounter,
    quests: updatedQuests,
  };
};

export function getWeaponDamage(attacker: CharacterData | Enemy): number {
  if ("items" in attacker && attacker.items && attacker.items.length > 0) {
    const weapon = attacker.items[0];
    if (weapon.action) {
      return rollDamageDice(weapon.action.damage);
    }
  }
  return 0;
}

export function isEnemy(f: CharacterData | Enemy | undefined): f is Enemy {
  return !!f && "health" in f && "id" in f;
}

export function safeNextIndex(currentIndex: number, length: number): number {
  if (!length || length <= 0) return 0;
  return (currentIndex + 1) % length;
}

export function scheduleEnemyTurn(getState: () => any, delay = 500) {
  setTimeout(() => {
    const {
      gameStatus,
      isCurrentFighterEnemy,
      performEnemyTurn,
      isLevelingUp,
    } = getState();
    if (
      gameStatus === GameStatus.Combat &&
      isCurrentFighterEnemy() &&
      !isLevelingUp
    ) {
      performEnemyTurn();
    }
  }, delay);
}

export function calcDamage(
  defense: number,
  strength: number,
  dex: number,
  weaponDamage: number = 0,
): number {
  const hitChance = dex + Math.floor(Math.random() * 20) + 1;
  if (hitChance >= defense) {
    const baseDamage = strength + Math.floor(Math.random() * 6) + 1;
    const totalDamage = baseDamage + weaponDamage;
    return Math.max(1, totalDamage - defense);
  }
  return 0;
}