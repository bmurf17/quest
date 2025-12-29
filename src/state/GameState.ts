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
  enterCombat: () => void;
  isCurrentFighterEnemy: () => boolean;
  performEnemyTurn: () => void;
  useConsumable: (item: Consumable) => void;
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
  inventory: [healthPotion],

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
    console.log("TEST");
    const state = get();
    const currentEnemy = state.combatOrder[state.activeFighterIndex] as Enemy;

    if (!currentEnemy) return;

    // Pick a random living party member to attack
    const livingMembers = state.party.filter((member) => member.hp > 0);
    if (livingMembers.length === 0) return;

    const target =
      livingMembers[Math.floor(Math.random() * livingMembers.length)];

    set((state) => {
      const updatedParty = state.party.map((member) => {
        if (member.name === target.name) {
          return { ...member, hp: Math.max(0, member.hp - 2) };
        }
        return member;
      });

      const logMessage = `${currentEnemy.name} attacked ${
        target.name
      } for 2 damage! ${target.name}'s HP: ${Math.max(0, target.hp - 2)}`;

      const nextIndex =
        (state.activeFighterIndex + 1) % state.combatOrder.length;

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, logMessage],
        activeFighterIndex: nextIndex,
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
      console.log(currentAttacker);
      const attackerName = currentAttacker?.name || "Unknown";
      const currentDex =
        "abilities" in currentAttacker
          ? currentAttacker.abilities.dex.score
          : currentAttacker.dex;
      const currentStrength =
        "abilities" in currentAttacker
          ? currentAttacker.abilities.str.score
          : currentAttacker.strength;

      var nextIndex = (state.activeFighterIndex + 1) % state.combatOrder.length;
      const damage = calcDamage(enemy.defense, currentDex, currentStrength);

      const newHealth = enemy.health - damage;
      let updatedEnemies;
      let logMessage;
      let status = GameStatus.Combat;
      const currentRoomInstance =
        state.roomInstances.get(state.room) || state.room;

      if (newHealth <= 0) {
        updatedEnemies = currentRoomInstance.enemies.filter(
          (e) => e.id !== enemy.id
        );
        nextIndex = 0;
        logMessage = `${attackerName} defeated ${enemy.name}!`;
        status =
          updatedEnemies.length === 0
            ? GameStatus.Exploring
            : GameStatus.Combat;
      } else {
        updatedEnemies = currentRoomInstance.enemies.map((e) => {
          if (e.id === enemy.id) {
            return {
              ...e,
              health: newHealth,
            };
          }
          return e;
        });
        logMessage = `${attackerName} attacked ${enemy.name} for ${damage} damage! Enemy health: ${newHealth}`;
      }

      const updatedRoom = {
        ...currentRoomInstance,
        enemies: updatedEnemies,
      };

      const originalTemplate = [...state.roomInstances.entries()].find(
        ([template, instance]) =>
          instance === currentRoomInstance || template === state.room
      )?.[0];

      const newRoomInstances = new Map(state.roomInstances);
      if (originalTemplate) {
        newRoomInstances.set(originalTemplate, updatedRoom);
      }

      const newActivityLog = [...state.activityLog, logMessage];

      return {
        room: updatedRoom,
        roomInstances: newRoomInstances,
        gameStatus: status,
        activityLog: newActivityLog,
        activeFighterIndex: nextIndex,
      };
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
      const logBuilder = new ActivityLogBuilder().add(
        `${npc.name} says: ${npc.dialogue}`
      );

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
      };
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
        `$Your party rests and heals ${camp.healAmount} hp`
      );

      return {
        party: updatedParty,
        activityLog: [...state.activityLog, ...logBuilder.build()],
      };
    }),

  move: (direction: Directions) =>
    set((state) => {
      const targetRoomTemplate = state.room.neighboringRooms.find(
        ([mapDirection]) => mapDirection === direction
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

      // Build activity log messages
      const logBuilder = new ActivityLogBuilder()
        .add(`Your party has moved ${Directions[direction]}`)
        .addIf(
          status === GameStatus.Exploring && !!roomInstance.interaction,
          roomInstance.interaction
            ? getDiscoveryMessage(roomInstance.interaction)
            : ""
        )
        .addIf(
          roomInstance.enemies.length > 0,
          `You encounter ${roomInstance.enemies.length} ${
            roomInstance.enemies.length === 1 ? "enemy" : "enemies"
          }!`
        );

      const newRoomInstances = new Map(state.roomInstances);
      newRoomInstances.set(targetRoomTemplate, roomInstance);

      return {
        activityLog: [...state.activityLog, ...logBuilder.build()],
        room: roomInstance,
        roomInstances: newRoomInstances,
        gameStatus: status,
        combatOrder: combatOrder,
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
        `You have opened the chest!`
      );
      const updatedRoom: Room = {
        ...currentRoomInstance,
        interaction: { type: "chest", chest: chest },
      };

      const originalTemplate = [...state.roomInstances.entries()].find(
        ([template, instance]) =>
          instance === currentRoomInstance || template === state.room
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
