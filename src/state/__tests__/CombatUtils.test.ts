import { describe, it, expect } from 'vitest';
import { finalizeAttackState } from '../utils/CombatUtils';
import { Enemy } from '@/types/Enemy';
import { startRoom } from '@/types/Room';

describe('CombatUtils finalizeAttackState', () => {
  it('updates roomInstances map using room id keys', () => {
    const fakeState: any = {
      room: startRoom,
      roomInstances: new Map<number, any>([
        [startRoom.id, { ...startRoom, enemies: [{ id: 'e1', name: 'Gob', health: 10 } as any] }],
      ]),
      activityLog: [],
      lastDefeatedCounter: 0,
    };

    const updatedEnemies: Enemy[] = [];

    const result = finalizeAttackState(
      fakeState,
      updatedEnemies,
      // newStatus
      0 as any,
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
    );

    expect(result.roomInstances instanceof Map).toBe(true);
    // the updated room should be stored under the numeric id
    expect(result.roomInstances.get(startRoom.id)).toBeDefined();
    expect(result.room.enemies).toEqual([]);
  });
});
