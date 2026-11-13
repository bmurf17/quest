import type { CharacterData } from "@/types/Character";
import type { ActiveBuff } from "@/types/EnemyMove";
import type { Quest } from "@/types/RoomInteractions";
import { GameStatus } from "@/types/GameStatus";
import { DEFAULT_TAVERN_CONFIG } from "@/data/tavern";
import type { TavernConfig } from "@/types/Tavern";
import { generateTavernCandidates } from "@/state/utils/TavernUtils";
import type { GameState, GameSlice } from "./types";

export type PartySlice = Pick<
  GameState,
  | "party"
  | "setParty"
  | "isLevelingUp"
  | "levelingUpChars"
  | "currentLevelingCharIndex"
  | "setLevelingUpChars"
  | "applyLevelUp"
  | "nextLevelingChar"
  | "quests"
  | "acceptQuest"
  | "tavernCandidates"
  | "isTavernOpen"
  | "tavernConfig"
  | "hasRecruitedFromTavern"
  | "openTavern"
  | "closeTavern"
  | "addTavernCharacterToParty"
  | "setTavernConfig"
  | "enterTown"
  | "exitTown"
  | "restInTown"
  | "retryFromGameOver"
>;

export const createPartySlice: GameSlice<PartySlice> = (set, get) => ({
  party: [],
  isLevelingUp: false,
  levelingUpChars: [],
  currentLevelingCharIndex: -1,
  quests: [],
  tavernCandidates: [],
  isTavernOpen: false,
  hasRecruitedFromTavern: false,
  tavernConfig: { ...DEFAULT_TAVERN_CONFIG },

  setParty: (chars: CharacterData[]) => set({ party: chars }),

  setLevelingUpChars: (chars: CharacterData[]) =>
    set({
      levelingUpChars: chars,
      isLevelingUp: chars.length > 0,
      currentLevelingCharIndex: chars.length > 0 ? 0 : -1,
    }),

  applyLevelUp: (updatedChar: CharacterData) => {
    const state = get();
    set({
      party: state.party.map((char) => (char.name === updatedChar.name ? updatedChar : char)),
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
      set({ currentLevelingCharIndex: nextIndex });
    }
  },

  acceptQuest: (quest: Quest) =>
    set((state) => ({
      activityLog: [...state.activityLog, `You have accepted the quest: ${quest.name}`],
      quests: [...state.quests, { ...quest, accepted: true, completed: false }],
    })),

  openTavern: () =>
    set((state) => ({
      isTavernOpen: true,
      activityLog: [...state.activityLog, "You step into the tavern and look around..."],
    })),

  closeTavern: () =>
    set({
      isTavernOpen: false,
      tavernCandidates: [],
    }),

  addTavernCharacterToParty: (char: CharacterData) => {
    set((state) => {
      if (state.hasRecruitedFromTavern) {
        return {
          activityLog: [
            ...state.activityLog,
            "You've already recruited someone from the tavern this visit.",
          ],
        };
      }
      if (state.party.length >= 6) {
        return {
          activityLog: [...state.activityLog, "Your party is already full!"],
        };
      }
      const updatedCandidates = state.tavernCandidates.filter((c) => c.name !== char.name);
      return {
        party: [...state.party, char],
        hasRecruitedFromTavern: true,
        tavernCandidates: updatedCandidates,
        activityLog: [
          ...state.activityLog,
          `${char.name} the ${char.class} has joined your party!`,
        ],
        // Recruiting a companion ends the tavern visit; the overlay closes on its own.
        isTavernOpen: false,
      };
    });
  },

  setTavernConfig: (config: TavernConfig) => set({ tavernConfig: config }),

  enterTown: () => {
    set((state) => {
      const candidates = generateTavernCandidates(state.tavernConfig);
      const updates: Partial<GameState> = {
        gameStatus: GameStatus.InTown,
        isTavernOpen: true,
        hasRecruitedFromTavern: false,
        tavernCandidates: candidates,
      };

      if (state.currentSection !== null && !state.beatenSections.includes(state.currentSection)) {
        const sectionName =
          state.availableSections.find((s) => s.id === state.currentSection)?.name ?? "the area";
        updates.beatenSections = [...state.beatenSections, state.currentSection];
        updates.activityLog = [
          ...state.activityLog,
          `You return to town. ${sectionName} has been completed!`,
          "You spot some new faces at the tavern...",
        ];
      } else {
        updates.activityLog = [
          ...state.activityLog,
          "You return to town.",
          "You spot some new faces at the tavern...",
        ];
      }

      return updates;
    });
  },

  exitTown: () => set({ gameStatus: GameStatus.Exploring }),

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
        activityLog: [...state.activityLog, "You rest at the inn. Your party is fully restored!"],
      };
    }),

  retryFromGameOver: () =>
    set((state) => {
      const revivedParty = state.party.map((member) => ({
        ...member,
        hp: member.maxHp,
        mp: member.maxMp,
        alive: member.maxHp > 0,
      }));

      return {
        party: revivedParty,
        gameStatus: GameStatus.InTown,
        combatOrder: [],
        activeFighterIndex: 0,
        enemyCooldowns: new Map<number, Map<string, number>>(),
        activeBuffs: new Map<string, ActiveBuff[]>(),
        accumulatedExp: 0,
        isTargeting: false,
        targetingSpell: null,
        targetingConsumable: null,
        isLevelingUp: false,
        levelingUpChars: [],
        currentLevelingCharIndex: -1,
        activeDialogue: null,
        currentDialogueNodeId: null,
        activeCutscene: null,
        activityLog: [
          ...state.activityLog,
          "You awaken back in the village, battered but alive.",
        ],
      };
    }),
});
