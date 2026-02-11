import { CharacterData } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { Consumable, healthPotion, Item } from "@/types/Item";
import { Room, startRoom } from "@/types/Room";
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

export interface GameState {
  party: CharacterData[];
  activityLog: string[];
  room: Room;
  roomInstances: Map<Room, Room>;
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
  useConsumable: (item: Consumable) => void;
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
}

export const useGameStore = create<GameState>((set, get) => ({
  party: [],
  activityLog: ["You start your adventure."],
  room: startRoom,
  gameStatus: GameStatus.Exploring,
  roomInstances: new Map<Room, Room>([
    [
      startRoom,
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
    return (
      currentFighter && "health" in currentFighter && "id" in currentFighter
    );
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
      var damage = calcDamage(
        target.abilities.def.score,
        currentEnemy.dex,
        currentEnemy.strength,
      );
      var newHealth = Math.max(0, target.hp - damage);
      var combatOrder = state.combatOrder;

      const updatedParty = state.party.map((member) => {
        if (member.name === target.name) {
          return { ...member, hp: newHealth, alive: newHealth > 0 };
        }
        return member;
      });

      var logMessage = `${currentEnemy.name} attacked ${
        target.name
      } for ${damage} damage! ${target.name}'s HP: ${newHealth}`;

      if (newHealth <= 0) {
        logMessage += ` \n ${target.name} has been defeated!`;

        combatOrder = combatOrder.filter((x) => {
          const shouldKeep = x.name !== target.name;
          return shouldKeep;
        });
      }

      const nextIndex =
        (state.activeFighterIndex + 1) % state.combatOrder.length;

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, logMessage],
        activeFighterIndex: nextIndex,
        combatOrder: combatOrder,
      };
    });

    setTimeout(() => {
      const { isCurrentFighterEnemy, performEnemyTurn } = get();
      if (isCurrentFighterEnemy()) {
        performEnemyTurn();
      }
    }, 500);
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

      const damage = calcDamage(enemy.defense, currentStr, currentDex);
      const newHealth = enemy.health - damage;
      const hitEnemyId = enemy.id;
      const hitCount = state.lastHitCounter + 1;

      let nextIndex = (state.activeFighterIndex + 1) % state.combatOrder.length;
      let combatOrder = state.combatOrder;
      let updatedEnemies: Enemy[];
      let logMessage: string;

      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;

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
      const { gameStatus, isCurrentFighterEnemy, performEnemyTurn } = get();
      if (gameStatus === GameStatus.Combat && isCurrentFighterEnemy()) {
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

  rest: (camp: Camp) =>
    set((state) => {
      const updatedParty = state.party.map((member) => {
        return {
          ...member,
          hp: Math.min(member.maxHp, member.hp + camp.healAmount),
        };
      });

      const logBuilder = new ActivityLogBuilder().add(
        `$Your party rests and heals ${camp.healAmount} hp`,
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

      let roomInstance = state.roomInstances.get(targetRoomTemplate);
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
      newRoomInstances.set(targetRoomTemplate, roomInstance);

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
      room: rooms[0],
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
        state.roomInstances.get(state.room) || state.room;
      const logBuilder = new ActivityLogBuilder().add(
        `You have opened the chest!`,
      );
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: chest },
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

  useConsumable: (item: Consumable) =>
    set((state) => {
      const logBuilder = new ActivityLogBuilder().add(`${item.effect}`);

      const updatedParty = state.party.map((member) => {
        return {
          ...member,
          hp: Math.min(member.maxHp, member.hp + item.hpChange),
        };
      });

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, ...logBuilder.build()],
      };
    }),

  takeFromChest: (chest: Chest) =>
    set((state) => {
      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;
      const logBuilder = new ActivityLogBuilder().add(
        `You take from the chest!`,
      );
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: { ...chest } },
      };

      const originalTemplate = [...state.roomInstances.entries()].find(
        ([template, instance]) =>
          instance === currentRoomInstance || template === state.room,
      )?.[0];

      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplate) {
        newRoomInstances.set(originalTemplate, updatedRoom);
      }

      const inventory = state.inventory;

      if (chest.item) {
        inventory.push(chest.item);
      }

      console.log(inventory);
      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: updatedRoom,
        roomInstances: newRoomInstances,
        inventory: inventory,
      };
    }),

  buyItem(item) {
    set((state) => {
      const inventory = state.inventory;

      if(item.cost > state.goldPieces) {
        return {
          activityLog: [
            ...state.activityLog,
            `Not enough gold to buy ${item.name}!`,
          ],
        };
      }

      inventory.push(item);
      return {
        inventory: inventory,
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
      let updatedEnemies = (state.roomInstances.get(state.room) || state.room)
        .enemies;
      let combatOrder = state.combatOrder;
      let nextIndex = (state.activeFighterIndex + 1) % state.combatOrder.length;
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
            "health" in target
          ) {
            const enemy = target as Enemy;
            const newHealth = Math.max(0, enemy.health - spell.effect.amount);

            if (newHealth <= 0) {
              updatedEnemies = updatedEnemies.filter((e) => e.id !== enemy.id);
              combatOrder = combatOrder.filter((x) => x.name !== enemy.name);
              newAccumulatedExp += enemy.expGain ?? 10;

              logBuilder.add(
                `${enemy.name} takes ${spell.effect.amount} damage and is defeated!`,
              );

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
                state.roomInstances.get(state.room) || state.room;
              const updatedRoom = {
                ...currentRoomInstance,
                enemies: updatedEnemies,
              };
              const newRoomInstances = new Map(state.roomInstances);
              newRoomInstances.set(state.room, updatedRoom);

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
              };
            } else {
              updatedEnemies = updatedEnemies.map((e) =>
                e.id === enemy.id ? { ...e, health: newHealth } : e,
              );
              logBuilder.add(
                `${enemy.name} takes ${spell.effect.amount} damage!`,
              );
            }
          } else if (spell.effect.target === "all") {
            const defeatedEnemies: string[] = [];
            updatedEnemies = updatedEnemies
              .map((enemy) => {
                const newHealth = Math.max(
                  0,
                  enemy.health - spell.effect.amount,
                );
                if (newHealth <= 0) {
                  defeatedEnemies.push(enemy.name);
                  newAccumulatedExp += enemy.expGain ?? 10;
                }
                return { ...enemy, health: newHealth };
              })
              .filter((e) => e.health > 0);

            combatOrder = combatOrder.filter(
              (x) => !defeatedEnemies.includes(x.name),
            );

            if (defeatedEnemies.length > 0) {
              logBuilder.add(`${defeatedEnemies.join(", ")} defeated!`);
            }
            logBuilder.add(`All enemies take ${spell.effect.amount} damage!`);
          }
          break;

        case "heal":
          if (spell.effect.target === "single" && target && "hp" in target) {
            const character = target as CharacterData;

            if (!character.alive || character.hp <= 0) {
              logBuilder.add(
                `${character.name} cannot be healed - they are unconscious!`,
              );
              break;
            }

            updatedParty = updatedParty.map((member) => {
              if (member.name === character.name) {
                const healAmount = Math.min(
                  spell.effect.amount,
                  member.maxHp - member.hp,
                );
                const newHp = Math.min(
                  member.maxHp,
                  member.hp + spell.effect.amount,
                );
                if (healAmount > 0) {
                  logBuilder.add(`${member.name} recovers ${healAmount} HP!`);
                } else {
                  logBuilder.add(`${member.name} is already at full health!`);
                }
                return { ...member, hp: newHp };
              }
              return member;
            });
          } else if (spell.effect.target === "party") {
            let anyHealed = false;
            updatedParty = updatedParty.map((member) => {
              if (member.alive && member.hp > 0 && member.hp < member.maxHp) {
                const newHp = Math.min(
                  member.maxHp,
                  member.hp + spell.effect.amount,
                );
                anyHealed = true;
                return { ...member, hp: newHp };
              }
              return member;
            });
            if (anyHealed) {
              logBuilder.add(`The party recovers ${spell.effect.amount} HP!`);
            } else {
              logBuilder.add(`Everyone is already at full health!`);
            }
          }
          break;
      }

      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;
      const updatedRoom = { ...currentRoomInstance, enemies: updatedEnemies };
      const newRoomInstances = new Map(state.roomInstances);
      newRoomInstances.set(state.room, updatedRoom);

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
}));

function calcDamage(defense: number, strength: number, dex: number): number {
  const hitChance = dex + Math.floor(Math.random() * 20) + 1;
  if (hitChance >= defense) {
    const damage = strength + Math.floor(Math.random() * 6) + 1;
    return Math.max(1, damage - defense);
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
