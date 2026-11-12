import { describe, expect, it } from "vitest";
import { parseSaveData, SaveDataError, SAVE_VERSION } from "../saveSchema";

function minimalSave(): Record<string, unknown> {
  return {
    version: SAVE_VERSION,
    timestamp: 123,
    label: "Slot 1",
    party: [],
    activityLog: [],
    inventory: [],
    goldPieces: 5,
    accumulatedExp: 0,
    quests: [],
    conversationFlags: {},
    currentSection: null,
    beatenSections: [],
    availableSections: [],
    currentRoomId: 1,
    roomInstances: [
      [
        1,
        {
          id: 1,
          name: "Start Room",
          sectionId: 0,
          enemies: [],
          neighboringRooms: [],
          interaction: null,
        },
      ],
    ],
    gameStatus: 0,
    combatOrder: [],
    activeFighterIndex: 0,
    activeDialogue: null,
    currentDialogueNodeId: null,
    dialogueIndex: 0,
    lastHitEnemyId: null,
    lastHitCounter: 0,
    lastDefeatedEnemyId: null,
    lastDefeatedCounter: 0,
    isTargeting: false,
    targetingSpell: null,
    targetingConsumable: null,
    isLevelingUp: false,
    levelingUpChars: [],
    currentLevelingCharIndex: -1,
    dialogueTrees: [],
    activeCutsceneId: null,
    cutsceneSceneIndex: 0,
    enemyCooldowns: [],
    activeBuffs: [],
  };
}

describe("save schema", () => {
  it("accepts a valid current-version save", () => {
    const parsed = parseSaveData(minimalSave());
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.label).toBe("Slot 1");
    expect(parsed.currentRoomId).toBe(1);
  });

  it("migrates pre-versioning saves to the current version", () => {
    const save = minimalSave();
    delete save.version;
    delete save.enemyCooldowns;
    delete save.activeBuffs;
    delete save.cutsceneSceneIndex;
    save.label = undefined;

    const parsed = parseSaveData(save);
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.label).toBe("Imported Save");
    expect(parsed.enemyCooldowns).toEqual([]);
    expect(parsed.activeBuffs).toEqual([]);
    expect(parsed.cutsceneSceneIndex).toBe(0);
  });

  it("repairs v1 saves that predate cooldowns, buffs, and cutscene scenes", () => {
    const save = minimalSave();
    save.version = 1;
    delete save.enemyCooldowns;
    delete save.activeBuffs;
    delete save.cutsceneSceneIndex;

    const parsed = parseSaveData(save);
    expect(parsed.version).toBe(SAVE_VERSION);
    expect(parsed.enemyCooldowns).toEqual([]);
    expect(parsed.activeBuffs).toEqual([]);
    expect(parsed.cutsceneSceneIndex).toBe(0);
  });

  it("rejects saves from a newer, unsupported version", () => {
    const save = minimalSave();
    save.version = SAVE_VERSION + 1;
    expect(() => parseSaveData(save)).toThrow(SaveDataError);
    expect(() => parseSaveData(save)).toThrow(/newer than supported/);
  });

  it("rejects non-object input", () => {
    expect(() => parseSaveData(null)).toThrow(/must be a JSON object/);
    expect(() => parseSaveData("nope")).toThrow(/must be a JSON object/);
    expect(() => parseSaveData([])).toThrow(/must be a JSON object/);
  });

  it("rejects structurally invalid saves with a field path", () => {
    const save = minimalSave();
    save.party = "not an array";
    expect(() => parseSaveData(save)).toThrow(/party/);
  });

  it("defers neighbor referential integrity to load time", () => {
    const save = minimalSave();
    save.roomInstances = [
      [
        1,
        {
          id: 1,
          name: "Start Room",
          sectionId: 0,
          enemies: [],
          neighboringRooms: [[0, 999]],
          interaction: null,
        },
      ],
    ];
    // The schema only checks that neighbor IDs are numbers; referential
    // integrity is enforced when the save is actually loaded.
    expect(parseSaveData(save)).toBeTruthy();
  });
});
