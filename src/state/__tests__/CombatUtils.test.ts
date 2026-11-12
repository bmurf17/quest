import { describe, it, expect } from 'vitest';
import { finalizeAttackState } from "@/state/utils/CombatUtils";
import type { GameState } from "@/state/GameState";
import type { Enemy } from '@/types/Enemy';
import { startRoom } from '@/data/fixtures/rooms';
import type { Quest } from '@/types/RoomInteractions';
import { manaPotion } from '@/data/items';
import { GameStatus } from '@/types/GameStatus';

describe('CombatUtils finalizeAttackState', () => {
  it('updates roomInstances map using room id keys', () => {
    const goblin: Enemy = {
      id: 1,
      name: 'Gob',
      health: 10,
      strength: 5,
      dex: 5,
      defense: 5,
      img: '',
      expGain: 10,
    };

    const fakeState = {
      room: startRoom,
      roomInstances: new Map([
        [startRoom.id, { ...startRoom, enemies: [goblin] }],
      ]),
      activityLog: [],
      lastDefeatedCounter: 0,
    } as unknown as GameState;

    const updatedEnemies: Enemy[] = [];

      const tempQuest: Quest = {
        id: 0,
        name: "Unknown Quest",
        description: "No description available.",
        type: { type: "fetch", item: manaPotion },
        objectives: [],
        rewards: [manaPotion],
        accepted: false,
        completed: false,
      };

    const result = finalizeAttackState(
      fakeState,
      updatedEnemies,
      // newStatus
      GameStatus.Exploring,
      // nextIndex
      0,
      // combatOrder
      [],
      // logMessage
      'defeated!',
      // hitEnemyId
      'e1',
      // lastHitCounter
      1,
      true,
      1,
      [tempQuest]
    );

    expect(result.roomInstances instanceof Map).toBe(true);
    // the updated room should be stored under the numeric id
    expect(result.roomInstances.get(startRoom.id)).toBeDefined();
    expect(result.room.enemies).toEqual([]);
  });
});
