import { getDialogueForNPC } from "@/queries/DialogueQueries";
import { CharacterData } from "@/types/Character";
import { Directions } from "@/types/Directions";
import { Enemy } from "@/types/Enemy";
import { GameStatus } from "@/types/GameStatus";
import { Consumable, healthPotion, Item } from "@/types/Item";
import { Room, Section, startRoom } from "@/types/Room";
import {
  Camp,
  Chest,
  DialogueNode,
  DialogueOutcome,
  DialogueOutcomeType,
  getDiscoveryMessage,
  NPC,
  NPCDisposition,
  Quest,
} from "@/types/RoomInteractions";
import { Spell } from "@/types/Spell";
import { create } from "zustand";
import type { SaveData } from "./saveLoad";
import { denormalizeNeighbors } from "./saveLoad";
import {
  finalizeAttackState,
  getWeaponDamage,
  handleCombatCompletion,
  isEnemy,
  safeNextIndex,
} from "./utils/CombatUtils";
import { handleSpell } from "./utils/SpellUtils";

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
  activeDialogue: DialogueNode | null;
  currentDialogueNodeId: string | null;
  conversationFlags: Record<string, Record<string, string>>;
  dialogueTrees: Map<number, DialogueNode>;
  startDialogue: (npc: NPC, node?: DialogueNode) => void;
  preloadDialogueTrees: (rooms: Room[]) => void;
  selectDialogueChoice: (choiceId: string) => void;
  checkSkillCondition: (skill: string, dc: number) => boolean;
  applyOutcome: (outcome: DialogueOutcome, npc: NPC) => void;
  setDisposition: (npc: NPC, disposition: NPCDisposition) => void;
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
  quests: Quest[];
  acceptQuest: (quest: Quest) => void;
  loadGame: (data: SaveData) => void;
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
  activeDialogue: null,
  currentDialogueNodeId: null,
  conversationFlags: {},
  dialogueTrees: new Map<number, DialogueNode>(),
  quests: [],

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
          activityLog: [
            ...state.activityLog,
            logMessage,
            "Your party has been defeated...",
          ],
          activeFighterIndex: 0,
          combatOrder: [],
          gameStatus: GameStatus.GameOver,
        };
      }

      const nextIndex = safeNextIndex(
        state.activeFighterIndex,
        combatOrder.length,
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
      const damage = calcDamage(
        enemy.defense,
        currentStr,
        currentDex,
        weaponDmg,
      );
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

        nextIndex = safeNextIndex(state.activeFighterIndex, combatOrder.length);

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
            state.quests,
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
            state.quests,
          ),
          isTargeting: false,
        };
      }
    });

    scheduleEnemyTurn(get);
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

  startDialogue: (npc: NPC, node?: DialogueNode | undefined) => {
    const tree = node || (npc.id ? get().dialogueTrees.get(npc.id) : null);
    if (!tree) {
      if (npc.id) {
        getDialogueForNPC(npc.id).then((fetchedTree) => {
          if (fetchedTree) {
            set((state) => {
              const updated = new Map(state.dialogueTrees);
              updated.set(npc.id!, fetchedTree);
              return {
                dialogueTrees: updated,
                activeDialogue: fetchedTree,
                currentDialogueNodeId: fetchedTree.id,
              };
            });
          }
        });
      }
      return;
    }
    set({
      activeDialogue: tree,
      currentDialogueNodeId: tree.id,
      dialogueIndex: 0,
      activityLog: [...get().activityLog, `${npc.name}: ${tree.text}`],
    });
  },

  preloadDialogueTrees: (rooms: Room[]) => {
    rooms.forEach((room) => {
      if (room.interaction?.type === "NPC" && room.interaction.npc.id) {
        const npcId = room.interaction.npc.id;
        const existing = get().dialogueTrees.get(npcId);
        if (!existing) {
          getDialogueForNPC(npcId).then((tree) => {
            if (tree) {
              set((state) => {
                const updated = new Map(state.dialogueTrees);
                updated.set(npcId, tree);
                return { dialogueTrees: updated };
              });
            }
          });
        }
      }
    });
  },

  selectDialogueChoice: (choiceId: string) => {
    const state = get();
    if (!state.activeDialogue) return;

    const choice = state.activeDialogue.choices?.find((c) => c.id === choiceId);
    if (!choice) return;

    const newActivityLog = [...state.activityLog, `You: ${choice.text}`];
    set({ activityLog: newActivityLog });

    if (choice.skillCondition) {
      const passed = state.checkSkillCondition(
        choice.skillCondition.skill,
        choice.skillCondition.dc,
      );
      const nextNodeId = passed
        ? choice.skillCondition.successNodeId
        : choice.skillCondition.failureNodeId;

      if (nextNodeId) {
        set({ currentDialogueNodeId: nextNodeId });
      }
    } else if (choice.nextNodeId) {
      set({ currentDialogueNodeId: choice.nextNodeId });
    }

    if (choice.outcome) {
      const roomNpc =
        state.room.interaction?.type === "NPC"
          ? state.room.interaction.npc
          : null;
      if (roomNpc) {
        state.applyOutcome(choice.outcome, roomNpc);
      }
    }
  },

  checkSkillCondition: (skill: string, dc: number): boolean => {
    const state = get();
    const party = state.party;

    for (const char of party) {
      const skillObj = char.skills?.find(
        (s) => s.name.toLowerCase() === skill.toLowerCase(),
      );
      if (skillObj) {
        const modifier = parseInt(skillObj.modifier);
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modifier;
        return total >= dc;
      }
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    return roll >= dc;
  },

  applyOutcome: (outcome: DialogueOutcome, npc: NPC) => {
    const state = get();
    const npcId = npc.id?.toString() || npc.name;

    switch (outcome.type) {
      case DialogueOutcomeType.NPC_HOSTILE:
        state.setDisposition(npc, NPCDisposition.HOSTILE);
        state.addToLog(`${npc.name} becomes hostile!`);
        break;
      case DialogueOutcomeType.NPC_FRIENDLY:
        state.setDisposition(npc, NPCDisposition.FRIENDLY);
        state.addToLog(`${npc.name} is now friendly toward you.`);
        set({
          room: { ...get().room },
          activeDialogue: null,
          currentDialogueNodeId: null,
        });
        break;
      case DialogueOutcomeType.NPC_LEAVE:
        set({
          room: { ...get().room, interaction: null },
          activeDialogue: null,
          currentDialogueNodeId: null,
        });
        state.addToLog(`${npc.name} storms off in anger!`);
        break;
      case DialogueOutcomeType.QUEST_START:
        if (outcome.value) {
          state.addToLog(`Quest started: ${outcome.value}`);
        }
        break;
      case DialogueOutcomeType.ITEM_GIVE:
        if (outcome.value) {
          state.addToLog(`Received: ${outcome.value}`);
        }
        break;
      case DialogueOutcomeType.END_CONVERSATION:
        set({
          activeDialogue: null,
          currentDialogueNodeId: null,
        });
        break;
    }

    if (outcome.flagKey && outcome.flagValue) {
      const flags = { ...state.conversationFlags };
      if (!flags[npcId]) flags[npcId] = {};
      flags[npcId][outcome.flagKey] = outcome.flagValue;
      set({ conversationFlags: flags });
    }
  },

  setDisposition: (npc: NPC, disposition: NPCDisposition) => {
    set((state) => {
      const updatedRoom = { ...state.room };
      if (
        updatedRoom.interaction?.type === "NPC" &&
        updatedRoom.interaction.npc.name === npc.name
      ) {
        updatedRoom.interaction = {
          type: "NPC",
          npc: { ...npc, disposition },
        };
      }
      return { room: updatedRoom };
    });
  },

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
        activeDialogue: null,
        currentDialogueNodeId: null,
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

  useConsumable: (item: Consumable, target?: CharacterData) => {
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

    scheduleEnemyTurn(get);
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
      let updatedEnemies = (
        state.roomInstances.get(state.room.id) || state.room
      ).enemies;
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
        default:
          {
            const result = handleSpell(
              spell,
              target,
              state,
              logBuilder,
              calcDamage,
            );
            if (result.earlyCompletion) {
              const completion = result.earlyCompletion.completion;

              nextIndex = completion.nextIndex;
              updatedParty = completion.updatedParty;
              gameStatus = completion.status;

              const currentRoomInstance =
                state.roomInstances.get(state.room.id) || state.room;
              const updatedRoom = {
                ...currentRoomInstance,
                enemies: result.updatedEnemies,
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
                combatOrder: result.combatOrder,
                activeFighterIndex: nextIndex,
                gameStatus: gameStatus,
                room: updatedRoom,
                roomInstances: newRoomInstances,
                accumulatedExp:
                  gameStatus === GameStatus.Exploring
                    ? 0
                    : result.newAccumulatedExp,
                isTargeting: false,
                targetingSpell: null,
                levelingUpChars: completion.levelingUpChars || [],
                isLevelingUp: (completion.levelingUpChars || []).length > 0,
                currentLevelingCharIndex:
                  (completion.levelingUpChars || []).length > 0 ? 0 : -1,
              };
            }

            updatedParty = result.updatedParty;
            updatedEnemies = result.updatedEnemies;
            combatOrder = result.combatOrder;
            nextIndex = result.nextIndex;
            newAccumulatedExp = result.newAccumulatedExp;
            gameStatus = result.gameStatus;
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

      if (
        state.currentSection !== null &&
        !state.beatenSections.includes(state.currentSection)
      ) {
        const sectionName =
          state.availableSections.find((s) => s.id === state.currentSection)
            ?.name ?? "the area";
        updates.beatenSections = [
          ...state.beatenSections,
          state.currentSection,
        ];
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
        roomInstances: new Map([[firstRoom.id, roomInstance]]),
        gameStatus: GameStatus.Exploring,
        combatOrder:
          firstRoom.enemies.length > 0
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
        state.availableSections.find((s) => s.id === state.currentSection)
          ?.name ?? "the area";

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

  acceptQuest: (quest: Quest) =>
    set((state) => {
      return {
        activityLog: [
          ...state.activityLog,
          `You have accepted the quest: ${quest.name}`,
        ],
        quests: [
          ...state.quests,
          { ...quest, accepted: true, completed: false },
        ],
      };
    }),

  loadGame: (data: SaveData) => {
    const state = get();

    const roomLookup = new Map<number, Room>();
    for (const room of state.rooms) {
      roomLookup.set(room.id, room);
    }

    const roomInstances = new Map<number, Room>();
    for (const [id, roomData] of data.roomInstances) {
      const room = denormalizeNeighbors(roomData, roomLookup);
      roomInstances.set(id, room);
      roomLookup.set(id, room);
    }

    for (const room of roomInstances.values()) {
      roomLookup.set(room.id, room);
    }

    const dialogueTrees = new Map<number, DialogueNode>();
    for (const [id, node] of data.dialogueTrees) {
      dialogueTrees.set(id, node);
    }

    const currentRoom = roomInstances.get(data.currentRoomId)
      || denormalizeNeighbors(
          { ...state.rooms.find((r) => r.id === data.currentRoomId), neighboringRooms: [] },
          roomLookup,
        );

    set({
      party: data.party,
      activityLog: data.activityLog,
      inventory: data.inventory,
      goldPieces: data.goldPieces,
      accumulatedExp: data.accumulatedExp,
      quests: data.quests,
      conversationFlags: data.conversationFlags,
      currentSection: data.currentSection,
      beatenSections: data.beatenSections,
      availableSections: data.availableSections,
      room: currentRoom,
      roomInstances,
      gameStatus: data.gameStatus,
      combatOrder: data.combatOrder,
      activeFighterIndex: data.activeFighterIndex,
      activeDialogue: data.activeDialogue,
      currentDialogueNodeId: data.currentDialogueNodeId,
      dialogueIndex: data.dialogueIndex,
      lastHitEnemyId: data.lastHitEnemyId,
      lastHitCounter: data.lastHitCounter,
      lastDefeatedEnemyId: data.lastDefeatedEnemyId,
      lastDefeatedCounter: data.lastDefeatedCounter,
      isTargeting: data.isTargeting,
      targetingSpell: data.targetingSpell,
      targetingConsumable: data.targetingConsumable,
      isLevelingUp: data.isLevelingUp,
      levelingUpChars: data.levelingUpChars,
      currentLevelingCharIndex: data.currentLevelingCharIndex,
      dialogueTrees,
    });
  },
}));

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

function scheduleEnemyTurn(getState: () => any, delay = 500) {
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
