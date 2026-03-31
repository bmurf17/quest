import { CharacterData, rollDamageDice } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { Consumable, healthPotion, Item } from "@/types/Item";
import { Room, Section, startRoom } from "@/types/Room";
import {
  Camp,
  Chest,
  getDiscoveryMessage,
  NPC,
} from "@/types/RoomInteractions";
import { create } from "zustand";
import {
  handleCombatCompletion,
  finalizeAttackState,
} from "./utils/CombatUtils";
import { Spell } from "@/types/Spell";

function getWeaponDamage(attacker: CharacterData | Enemy): number {
  if ("items" in attacker && attacker.items && attacker.items.length > 0) {
    const weapon = attacker.items[0];
    if (weapon.action) {
      return rollDamageDice(weapon.action.damage);
    }
  }
  return 0;
}

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  roomInstances: Map<number, Room>;
  gameStatus: GameStatus;
  rooms: Room[];
  combatOrder: (CharacterData | Enemy)[];
  activeFighterIndex: number;
  inventory: Item[];
  addToLog: (log: string) => void;
  attack: (enemy: Enemy) => void;
  move: (direction: Directions) => void;
  speak: (npc: NPC) => void;
  rest: (camp: Camp) => void;
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
  setParty: (characters: CharacterData[]) => void;
  updateChest: (chest: Chest) => void;
  takeFromChest: (chest: Chest) => void;
  enterCombat: () => void;
  isCurrentFighterEnemy: () => boolean;
  performEnemyTurn: () => void;
  useConsumable: (item: Consumable, target?: CharacterData) => void;
  buyItem: (item: Item) => void;
  dialogueIndex: number;
  advanceDialogue: () => void;
  lastHitEnemyId: string | null;
  lastHitCounter: number;
  castSpell: (spell: Spell, target?: Enemy | CharacterData) => void;
  accumulatedExp: number;
  isTargeting: boolean;
  setTargeting: (targeting: boolean) => void;
  lastDefeatedEnemyId: string | null;
  lastDefeatedCounter: number;
  targetingSpell: Spell | null;
  setTargetingSpell: (spell: Spell | null) => void;
  goldPieces: number;
  isLevelingUp: boolean;
  levelingUpChars: CharacterData[];
  currentLevelingCharIndex: number;
  setLevelingUpChars: (chars: CharacterData[]) => void;
  applyLevelUp: (char: CharacterData) => void;
  nextLevelingChar: () => void;
  enterTown: () => void;
  exitTown: () => void;
  restInTown: () => void;
  targetingConsumable: Consumable | null;
  setTargetingConsumable: (item: Consumable | null) => void;
  currentSection: number | null;
  beatenSections: number[];
  availableSections: Section[];
  loadSections: (sections: Section[]) => void;
  startSection: (sectionId: number, rooms: Room[]) => void;
  completeSection: () => void;
  isSectionUnlocked: (sectionId: number) => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
  party: [],
  activityLog: ["You start your adventure."],
  room: startRoom,
  gameStatus: GameStatus.Exploring,
  roomInstances: new Map<number, Room>([
    [
      startRoom.id,
      { ...startRoom, enemies: startRoom.enemies.map((e) => ({ ...e })) },
    ],
  ]),
  rooms: [],
  combatOrder: [],
  activeFighterIndex: 0,
  dialogueIndex: 0,
  inventory: [healthPotion],
  lastHitEnemyId: null,
  lastHitCounter: 0,
  accumulatedExp: 0,
  isTargeting: false,
  lastDefeatedEnemyId: null,
  lastDefeatedCounter: 0,
  targetingSpell: null,
  goldPieces: 5,
  isLevelingUp: false,
  levelingUpChars: [],
  currentLevelingCharIndex: -1,
  targetingConsumable: null,
  currentSection: null,
  beatenSections: [],
  availableSections: [],

  setTargetingConsumable: (item) => set({ targetingConsumable: item }),

  setTargeting: (targeting: boolean) =>
    set(() => ({
      isTargeting: targeting,
    })),

  setTargetingSpell: (spell: Spell | null) =>
    set(() => ({
      targetingSpell: spell,
    })),

  addToLog: (message: string) =>
    set((state) => ({
      activityLog: [...state.activityLog, message],
    })),

  isCurrentFighterEnemy: () => {
    const state = get();
    const currentFighter = state.combatOrder[state.activeFighterIndex];
  return isEnemy(currentFighter);
  },

  performEnemyTurn: () => {
    const state = get();
    const currentEnemy = state.combatOrder[state.activeFighterIndex] as Enemy;

    if (!currentEnemy) return;

    // Pick a random living party member to attack
    const livingMembers = state.party.filter((member) => member.hp > 0);
    if (livingMembers.length === 0) return;

    const target =
      livingMembers[Math.floor(Math.random() * livingMembers.length)];

    set((state) => {
      const damage = calcDamage(
        target.abilities.def.score,
        currentEnemy.dex,
        currentEnemy.strength,
      );
      const newHealth = Math.max(0, target.hp - damage);
      let combatOrder = state.combatOrder;

      const updatedParty = state.party.map((member) => {
        if (member.name === target.name) {
          return { ...member, hp: newHealth, alive: newHealth > 0 };
        }
        return member;
      });

      let logMessage = `${currentEnemy.name} attacked ${
        target.name
      } for ${damage} damage! ${target.name}'s HP: ${newHealth}`;

      if (newHealth <= 0) {
        logMessage += ` \n ${target.name} has been defeated!`;

        combatOrder = combatOrder.filter((x) => {
          const shouldKeep = x.name !== target.name;
          return shouldKeep;
        });
      }

      const isPartyDefeated = updatedParty.every(
        (member) => member.hp <= 0 || !member.alive,
      );

      if (isPartyDefeated) {
        return {
          party: updatedParty,
          activityLog: [...state.activityLog, logMessage, "Your party has been defeated..."],
          activeFighterIndex: 0,
          combatOrder: [],
          gameStatus: GameStatus.GameOver,
        };
      }

      const nextIndex = safeNextIndex(
        state.activeFighterIndex,
        state.combatOrder.length,
      );

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, logMessage],
        activeFighterIndex: nextIndex,
        combatOrder: combatOrder,
      };
    });

  scheduleEnemyTurn(get);
  },

  attack: (enemy: Enemy) => {
    set((state) => {
      const currentAttacker = state.combatOrder[state.activeFighterIndex];
      const attackerName = currentAttacker?.name || "Unknown";

      const currentDex =
        "abilities" in currentAttacker
          ? currentAttacker.abilities.dex.score
          : currentAttacker.dex;
      const currentStr =
        "abilities" in currentAttacker
          ? currentAttacker.abilities.str.score
          : currentAttacker.strength;

      const weaponDmg = getWeaponDamage(currentAttacker);
      const damage = calcDamage(enemy.defense, currentStr, currentDex, weaponDmg);
      const newHealth = enemy.health - damage;
      const hitEnemyId = enemy.id;
      const hitCount = state.lastHitCounter + 1;

      let nextIndex = safeNextIndex(
        state.activeFighterIndex,
        state.combatOrder.length,
      );
      let combatOrder = state.combatOrder;
      let updatedEnemies: Enemy[];
      let logMessage: string;

      const currentRoomInstance =
        state.roomInstances.get(state.room.id) || state.room;

      if (newHealth <= 0) {
        updatedEnemies = currentRoomInstance.enemies.filter(
          (e) => e.id !== enemy.id,
        );
        combatOrder = combatOrder.filter((x) => x.name !== enemy.name);

        const newAccumulatedExp = state.accumulatedExp + (enemy.expGain ?? 10);

        const completion = handleCombatCompletion(
          updatedEnemies,
          nextIndex,
          state.party,
          newAccumulatedExp,
        );
        nextIndex = completion.nextIndex;
        const status = completion.status;

        logMessage = `${attackerName} defeated ${enemy.name}!${completion.logSuffix}`;
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
          ),
          party: completion.updatedParty,
          accumulatedExp:
            status === GameStatus.Exploring ? 0 : newAccumulatedExp,
          isTargeting: false,
          // Add leveling state
          levelingUpChars: completion.levelingUpChars || [],
          isLevelingUp: (completion.levelingUpChars || []).length > 0,
          currentLevelingCharIndex:
            (completion.levelingUpChars || []).length > 0 ? 0 : -1,
        };
      } else {
        updatedEnemies = currentRoomInstance.enemies.map((e) =>
          e.id === enemy.id ? { ...e, health: newHealth } : e,
        );
        logMessage = `${attackerName} attacked ${enemy.name} for ${damage} damage!`;

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
          ),
          isTargeting: false,
        };
      }
    });

    setTimeout(() => {
      const {
        gameStatus,
        isCurrentFighterEnemy,
        performEnemyTurn,
        isLevelingUp,
      } = get();
      if (
        gameStatus === GameStatus.Combat &&
        isCurrentFighterEnemy() &&
        !isLevelingUp
      ) {
        performEnemyTurn();
      }
    }, 500);
  },

  speak: (npc: NPC) =>
    set((state) => {
      const nextIndex = state.dialogueIndex + 1;
      const currentLine = npc.dialogue[state.dialogueIndex];

      if (currentLine) {
        return {
          dialogueIndex: Math.min(nextIndex, npc.dialogue.length - 1),
          activityLog: [...state.activityLog, `${npc.name}: ${currentLine}`],
        };
      }
      return state;
    }),

  setLevelingUpChars: (chars: CharacterData[]) => {
    set({
      levelingUpChars: chars,
      isLevelingUp: chars.length > 0,
      currentLevelingCharIndex: chars.length > 0 ? 0 : -1,
    });
  },

  applyLevelUp: (updatedChar: CharacterData) => {
    const state = get();
    const updatedParty = state.party.map((char) =>
      char.name === updatedChar.name ? updatedChar : char,
    );

    set({
      party: updatedParty,
    });

    state.nextLevelingChar();
  },

  nextLevelingChar: () => {
    const state = get();
    const nextIndex = state.currentLevelingCharIndex + 1;

    if (nextIndex >= state.levelingUpChars.length) {
      const shouldContinueCombat = state.gameStatus === GameStatus.Combat;

      set({
        levelingUpChars: [],
        isLevelingUp: false,
        currentLevelingCharIndex: -1,
      });

      if (shouldContinueCombat) {
        setTimeout(() => {
          const { isCurrentFighterEnemy, performEnemyTurn } = get();
          if (isCurrentFighterEnemy()) {
            performEnemyTurn();
          }
        }, 500);
      }
    } else {
      set({
        currentLevelingCharIndex: nextIndex,
      });
    }
  },

  rest: (camp: Camp) =>
    set((state) => {
      const updatedParty = state.party.map((member) => {
        const newHp = Math.min(member.maxHp, member.hp + camp.healAmount);
        const newMp = Math.min(member.maxMp, member.mp + camp.healAmount);
        return {
          ...member,
          hp: newHp,
          mp: newMp,
          alive: newHp > 0,
        };
      });

      const logBuilder = new ActivityLogBuilder().add(
        `Your party rests and heals ${camp.healAmount} HP. Everyone is ready for battle!`,
      );

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, ...logBuilder.build()],
      };
    }),

  move: (direction: Directions) =>
    set((state) => {
      const targetRoomTemplate = state.room.neighboringRooms.find(
        ([mapDirection]) => mapDirection === direction,
      )?.[1];

      if (!targetRoomTemplate) {
        return state;
      }

  let roomInstance = state.roomInstances.get(targetRoomTemplate.id);
      if (!roomInstance) {
        roomInstance = {
          ...targetRoomTemplate,
          enemies: targetRoomTemplate.enemies.map((enemy) => ({ ...enemy })),
        };
      }

      const status =
        roomInstance.enemies.length > 0
          ? GameStatus.Combat
          : GameStatus.Exploring;

      let combatOrder = state.combatOrder;
      if (status === GameStatus.Combat) {
        combatOrder = [...state.party, ...roomInstance.enemies];
      }

      const logBuilder = new ActivityLogBuilder()
        .add(`Your party has moved ${Directions[direction]}`)
        .addIf(
          status === GameStatus.Exploring && !!roomInstance.interaction,
          roomInstance.interaction
            ? getDiscoveryMessage(roomInstance.interaction)
            : "",
        )
        .addIf(
          roomInstance.enemies.length > 0,
          `You encounter ${roomInstance.enemies.length} ${
            roomInstance.enemies.length === 1 ? "enemy" : "enemies"
          }!`,
        );

  const newRoomInstances = new Map(state.roomInstances);
  newRoomInstances.set(targetRoomTemplate.id, roomInstance);

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: roomInstance,
        roomInstances: newRoomInstances,
        gameStatus: status,
        combatOrder: combatOrder,
        dialogueIndex: 0,
      };
    }),

  setRooms: (rooms: Room[]) =>
    set(() => ({
      rooms: rooms,
    })),

  addRoom: (room: Room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),

  updateRoom: (room: Room) =>
    set((state) => {
      return {
        rooms: state.rooms.map((x) => (x.name !== room.name ? x : room)),
      };
    }),

  setParty: (chars: CharacterData[]) =>
    set(() => {
      return {
        party: chars,
      };
    }),

  updateChest: (chest: Chest) =>
    set((state) => {
      const currentRoomInstance =
        state.roomInstances.get(state.room.id) || state.room;
      const logBuilder = new ActivityLogBuilder().add(
        `You have opened the chest!`,
      );
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: chest },
      };

      const originalTemplateId = [...state.roomInstances.entries()].find(
        ([templateId, instance]) =>
          instance === currentRoomInstance || templateId === state.room.id,
      )?.[0];

      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplateId !== undefined) {
        newRoomInstances.set(originalTemplateId, updatedRoom);
      }

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: updatedRoom,
        roomInstances: newRoomInstances,
      };
    }),

  enterCombat: () =>
    set((state) => {
      const theParty = state.party;
      const room =
        state.room !== null && state.room !== undefined
          ? state.room
          : startRoom;

      const theEnemies = room.enemies;

      const combatOrder = [...theParty, ...theEnemies];

      return {
        combatOrder: combatOrder,
      };
    }),

useConsumable: (item: Consumable,  target?: CharacterData) => {
    set((state) => {
      const logBuilder = new ActivityLogBuilder().add(`${item.effect}`);
      let newCombatOrder = [...state.combatOrder];

      const updatedParty = state.party.map((member) => {
        if (target && member.name !== target.name) return member;
        const wasDead = !member.alive || member.hp <= 0;
        const newHp = Math.min(member.maxHp, member.hp + item.hpChange);
        const isNowAlive = newHp > 0;

        if (wasDead && isNowAlive) {
          const alreadyInOrder = newCombatOrder.find(
            (f) => f.name === member.name,
          );
          if (state.gameStatus === GameStatus.Combat && !alreadyInOrder) {
            newCombatOrder.push({ ...member, hp: newHp, alive: true });
          }
        }

        return {
          ...member,
          hp: newHp,
          alive: isNowAlive,
        };
      });

      const itemIndex = state.inventory.findIndex((i) => i.name === item.name);
      const updatedInventory =
        itemIndex !== -1
          ? [
              ...state.inventory.slice(0, itemIndex),
              ...state.inventory.slice(itemIndex + 1),
            ]
          : state.inventory;

      const nextFighterIndex =
        state.gameStatus === GameStatus.Combat
          ? (state.activeFighterIndex + 1) % newCombatOrder.length
          : state.activeFighterIndex;

      return {
        party: updatedParty,
        combatOrder: newCombatOrder,
        activityLog: [...state.activityLog, ...logBuilder.build()],
        inventory: updatedInventory,
        activeFighterIndex: nextFighterIndex,
      };
    });

    setTimeout(() => {
      const {
        gameStatus,
        isCurrentFighterEnemy,
        performEnemyTurn,
        isLevelingUp,
      } = get();
      if (
        gameStatus === GameStatus.Combat &&
        isCurrentFighterEnemy() &&
        !isLevelingUp
      ) {
        performEnemyTurn();
      }
    }, 500);
  },


  takeFromChest: (chest: Chest) =>
    set((state) => {
      const currentRoomInstance =
        state.roomInstances.get(state.room.id) || state.room;
      const logBuilder = new ActivityLogBuilder().add(
        `You take from the chest!`,
      );
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: { ...chest } },
      };

      const originalTemplateId = [...state.roomInstances.entries()].find(
        ([templateId, instance]) =>
          instance === currentRoomInstance || templateId === state.room.id,
      )?.[0];

      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplateId !== undefined) {
        newRoomInstances.set(originalTemplateId, updatedRoom);
      }

      const inventory = state.inventory;

      if (chest.item) {
        inventory.push(chest.item);
      }

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: updatedRoom,
        roomInstances: newRoomInstances,
        inventory: inventory,
      };
    }),

  buyItem(item) {
    set((state) => {
      if (item.cost > state.goldPieces) {
        return {
          activityLog: [
            ...state.activityLog,
            `Not enough gold to buy ${item.name}!`,
          ],
        };
      }

      const inventory = [...state.inventory, item];

      return {
        inventory,
        goldPieces: state.goldPieces - item.cost,
      };
    });
  },

  advanceDialogue: () =>
    set((state) => ({
      dialogueIndex: state.dialogueIndex + 1,
    })),

  castSpell: (spell: Spell, target?: Enemy | CharacterData) =>
    set((state) => {
      const currentCaster = state.combatOrder[
        state.activeFighterIndex
      ] as CharacterData;

      if (currentCaster.mp < spell.manaCost) {
        return {
          activityLog: [
            ...state.activityLog,
            `Not enough mana to cast ${spell.name}!`,
          ],
        };
      }

      const logBuilder = new ActivityLogBuilder().add(
        `${currentCaster.name} casts ${spell.name}!`,
      );

      let updatedParty = state.party;
  let updatedEnemies = (state.roomInstances.get(state.room.id) || state.room)
        .enemies;
      let combatOrder = state.combatOrder;
      let nextIndex = safeNextIndex(
        state.activeFighterIndex,
        state.combatOrder.length,
      );
      let newAccumulatedExp = state.accumulatedExp;
      let gameStatus = state.gameStatus;

      updatedParty = updatedParty.map((member) => {
        if (member.name === currentCaster.name) {
          return { ...member, mp: member.mp - spell.manaCost };
        }
        return member;
      });

      switch (spell.effect.type) {
        case "damage":
          if (
            spell.effect.target === "single" &&
            target &&
            isEnemy(target)
          ) {
            const enemy = target as Enemy;
            const currentAttacker = state.combatOrder[
              state.activeFighterIndex
            ] as CharacterData;
            const currentIntelligence = currentAttacker.abilities.int.score;
            const currentWisdom = currentAttacker.abilities.wis.score;
            const damage = calcDamage(
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
                  (state.activeFighterIndex + 1) %
                  Math.max(1, combatOrder.length);
              }

              const completion = handleCombatCompletion(
                updatedEnemies,
                nextIndex,
                updatedParty,
                newAccumulatedExp,
              );

              nextIndex = completion.nextIndex;
              updatedParty = completion.updatedParty;
              gameStatus = completion.status;

              const currentRoomInstance =
                state.roomInstances.get(state.room.id) || state.room;
              const updatedRoom = {
                ...currentRoomInstance,
                enemies: updatedEnemies,
              };
              const newRoomInstances = new Map(state.roomInstances);
              newRoomInstances.set(state.room.id, updatedRoom);

              setTimeout(() => {
                const { gameStatus, isCurrentFighterEnemy, performEnemyTurn } =
                  get();
                if (
                  gameStatus === GameStatus.Combat &&
                  isCurrentFighterEnemy()
                ) {
                  performEnemyTurn();
                }
              }, 500);

              return {
                party: updatedParty,
                activityLog: [...state.activityLog, ...logBuilder.build()],
                combatOrder,
                activeFighterIndex: nextIndex,
                gameStatus: gameStatus,
                room: updatedRoom,
                roomInstances: newRoomInstances,
                accumulatedExp:
                  gameStatus === GameStatus.Exploring ? 0 : newAccumulatedExp,
                isTargeting: false,
                targetingSpell: null,
                levelingUpChars: completion.levelingUpChars || [],
                isLevelingUp: (completion.levelingUpChars || []).length > 0,
                currentLevelingCharIndex:
                  (completion.levelingUpChars || []).length > 0 ? 0 : -1,
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
                const enemy = updatedEnemies.find(
                  (e) => e.name === fighter.name,
                );
                if (enemy && enemy.health - spell.effect.amount <= 0) {
                  defeatedEnemies.push(enemy.name);
                  defeatedIndices.push(index);
                }
              }
            });

            updatedEnemies = updatedEnemies
              .map((enemy) => {
                const newHealth = Math.max(
                  0,
                  enemy.health - spell.effect.amount,
                );
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
                  (state.activeFighterIndex + 1) %
                  Math.max(1, combatOrder.length);
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
              const newHp = Math.min(
                member.maxHp,
                member.hp + spell.effect.amount,
              );

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

      const currentRoomInstance =
        state.roomInstances.get(state.room.id) || state.room;
      const updatedRoom = { ...currentRoomInstance, enemies: updatedEnemies };
  const newRoomInstances = new Map(state.roomInstances);
  newRoomInstances.set(state.room.id, updatedRoom);

      if (
        updatedEnemies.length === 0 &&
        state.gameStatus === GameStatus.Combat
      ) {
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
          accumulatedExp:
            completion.status === GameStatus.Exploring ? 0 : newAccumulatedExp,
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

  enterTown: () => {
    set((state) => {
      const updates: Partial<GameState> = { gameStatus: GameStatus.InTown };

      if (state.currentSection !== null && !state.beatenSections.includes(state.currentSection)) {
        const sectionName =
          state.availableSections.find((s) => s.id === state.currentSection)?.name ?? "the area";
        updates.beatenSections = [...state.beatenSections, state.currentSection];
        updates.activityLog = [
          ...state.activityLog,
          `You return to town. ${sectionName} has been completed!`,
        ];
      } else {
        updates.activityLog = [...state.activityLog, "You return to town."];
      }

      return updates;
    });
  },

  exitTown: () =>
    set(() => ({
      gameStatus: GameStatus.Exploring,
    })),

  restInTown: () =>
    set((state) => {
      const updatedParty = state.party.map((member) => ({
        ...member,
        hp: member.maxHp,
        mp: member.maxMp,
        alive: member.maxHp > 0,
      }));

      return {
        party: updatedParty,
        activityLog: [
          ...state.activityLog,
          "You rest at the inn. Your party is fully restored!",
        ],
      };
    }),

  loadSections: (sections) => set({ availableSections: sections }),

  startSection: (sectionId, rooms) =>
    set((state) => {
      const sectionRooms = rooms.filter((r) => r.sectionId === sectionId);
      if (sectionRooms.length === 0) return state;

      const firstRoom = sectionRooms[0];
      const roomInstance = {
        ...firstRoom,
        enemies: firstRoom.enemies.map((e) => ({ ...e })),
      };

      return {
        currentSection: sectionId,
        room: roomInstance,
        rooms,
        roomInstances: new Map([[firstRoom.id, roomInstance]]),
        gameStatus: GameStatus.Exploring,
        combatOrder: firstRoom.enemies.length > 0
          ? [...state.party, ...firstRoom.enemies]
          : [],
        activityLog: [
          ...state.activityLog,
          `You begin exploring ${state.availableSections.find((s) => s.id === sectionId)?.name ?? "an unknown area"}...`,
        ],
      };
    }),

  completeSection: () =>
    set((state) => {
      if (state.currentSection === null) return state;
      if (state.beatenSections.includes(state.currentSection)) return state;

      const sectionName =
        state.availableSections.find((s) => s.id === state.currentSection)?.name ?? "the area";

      return {
        beatenSections: [...state.beatenSections, state.currentSection],
        activityLog: [
          ...state.activityLog,
          `You have completed ${sectionName}!`,
        ],
      };
    }),

  isSectionUnlocked: (sectionId) => {
    const state = get();
    if (sectionId === 1) return true;
    return state.beatenSections.includes(sectionId - 1);
  },
}));

export function calcDamage(defense: number, strength: number, dex: number, weaponDamage: number = 0): number {
  const hitChance = dex + Math.floor(Math.random() * 20) + 1;
  if (hitChance >= defense) {
    const baseDamage = strength + Math.floor(Math.random() * 6) + 1;
    const totalDamage = baseDamage + weaponDamage;
    return Math.max(1, totalDamage - defense);
  }
  return 0;
}

class ActivityLogBuilder {
  private messages: string[] = [];

  add(message: string): this {
    this.messages.push(message);
    return this;
  }

  addIf(condition: boolean, message: string): this {
    if (condition) {
      this.messages.push(message);
    }
    return this;
  }

  build(): string[] {
    return [...this.messages];
  }
}

export function isEnemy(f: CharacterData | Enemy | undefined): f is Enemy {
  return !!f && "health" in f && "id" in f;
}

export function safeNextIndex(currentIndex: number, length: number): number {
  if (!length || length <= 0) return 0;
  return (currentIndex + 1) % length;
}

function scheduleEnemyTurn(getState: () => any, delay = 500) {
  setTimeout(() => {
    const { gameStatus, isCurrentFighterEnemy, performEnemyTurn, isLevelingUp } =
      getState();
    if (
      gameStatus === GameStatus.Combat &&
      isCurrentFighterEnemy() &&
      !isLevelingUp
    ) {
      performEnemyTurn();
    }
  }, delay);
}
