import type { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import {
  calcDamage,
  finalizeAttackState,
  getEffectiveBuffAmount,
  getWeaponDamage,
  handleCombatCompletion,
  safeNextIndex,
} from "./CombatUtils";
import type { GameState } from "@/state/slices/types";

export type AttackState = Pick<
  GameState,
  | "combatOrder"
  | "activeFighterIndex"
  | "activeBuffs"
  | "accumulatedExp"
  | "lastHitCounter"
  | "lastDefeatedCounter"
  | "activityLog"
  | "room"
  | "roomInstances"
  | "party"
  | "quests"
>;

/**
 * Resolve a player attack. Pure with respect to zustand: the caller applies
 * the returned updates or schedules the next enemy turn.
 */
export function resolveAttack(
  state: AttackState,
  enemy: Enemy,
): Partial<GameState> {
  const currentAttacker = state.combatOrder[state.activeFighterIndex];
  const attackerName = currentAttacker?.name || "Unknown";

  let currentDex =
    "abilities" in currentAttacker
      ? currentAttacker.abilities.dex.score
      : currentAttacker.dex;
  let currentStr =
    "abilities" in currentAttacker
      ? currentAttacker.abilities.str.score
      : currentAttacker.strength;

  currentDex += getEffectiveBuffAmount(
    state.activeBuffs,
    currentAttacker.name,
    "dex",
  );
  currentStr += getEffectiveBuffAmount(
    state.activeBuffs,
    currentAttacker.name,
    "strength",
  );

  const effectiveDef =
    enemy.defense +
    getEffectiveBuffAmount(state.activeBuffs, enemy.name, "defense");

  const weaponDmg = getWeaponDamage(currentAttacker);
  const damage = calcDamage(effectiveDef, currentStr, currentDex, weaponDmg);
  const newHealth = enemy.health - damage;
  const hitEnemyId = enemy.id;
  const hitCount = state.lastHitCounter + 1;

  let nextIndex = safeNextIndex(
    state.activeFighterIndex,
    state.combatOrder.length,
  );
  let combatOrder = state.combatOrder;
  let updatedEnemies: Enemy[];

  const currentRoomInstance =
    state.roomInstances.get(state.room.id) || state.room;

  if (newHealth <= 0) {
    updatedEnemies = currentRoomInstance.enemies.filter(
      (e) => e.id !== enemy.id,
    );
    combatOrder = combatOrder.filter((x) => x.name !== enemy.name);

    nextIndex = safeNextIndex(state.activeFighterIndex, combatOrder.length);

    const expMultiplier =
      enemy.type === "boss"
        ? Math.max(enemy.phaseThresholds?.length ?? 1, 2)
        : 1;
    const newAccumulatedExp =
      state.accumulatedExp + (enemy.expGain ?? 10) * expMultiplier;

    const completion = handleCombatCompletion(
      updatedEnemies,
      nextIndex,
      state.party,
      newAccumulatedExp,
    );
    nextIndex = completion.nextIndex;
    const status = completion.status;

    const logMessage = `${attackerName} defeated ${enemy.name}!${completion.logSuffix}`;
    const defeatedCount = state.lastDefeatedCounter + 1;

    return {
      ...finalizeAttackState(
        state,
        updatedEnemies,
        status,
        nextIndex,
        combatOrder,
        logMessage,
        hitEnemyId.toString(),
        hitCount,
        true,
        defeatedCount,
        state.quests,
      ),
      party: completion.updatedParty,
      accumulatedExp:
        status === GameStatus.Exploring ? 0 : newAccumulatedExp,
      isTargeting: false,
      levelingUpChars: completion.levelingUpChars || [],
      isLevelingUp: (completion.levelingUpChars || []).length > 0,
      currentLevelingCharIndex:
        (completion.levelingUpChars || []).length > 0 ? 0 : -1,
    };
  }

  updatedEnemies = currentRoomInstance.enemies.map((e) =>
    e.id === enemy.id ? { ...e, health: newHealth } : e,
  );
  const logMessage = `${attackerName} attacked ${enemy.name} for ${damage} damage!`;

  return {
    ...finalizeAttackState(
      state,
      updatedEnemies,
      GameStatus.Combat,
      nextIndex,
      combatOrder,
      logMessage,
      hitEnemyId.toString(),
      hitCount,
      false,
      0,
      state.quests,
    ),
    isTargeting: false,
  };
}
