import { z } from "zod";
import type { SaveData } from "./saveLoad";

/**
 * Bump this whenever the persisted save shape changes and add a migration
 * from the previous version in `migrations` below.
 */
export const SAVE_VERSION = 2;

/** Raised when a stored/imported save cannot be migrated or validated. */
export class SaveDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveDataError";
  }
}

type RawSave = Record<string, unknown>;

/**
 * Migration functions are keyed by the version they upgrade *from*. Each one
 * returns the save at version `from + 1`. They run before schema validation so
 * legacy saves missing newer fields are repaired with defaults instead of
 * being rejected.
 */
const migrations: Record<number, (data: RawSave) => RawSave> = {
  // Pre-versioning saves (no `version` field) are treated as v0.
  0: (data) => ({
    ...data,
    version: 1,
    label: typeof data.label === "string" ? data.label : "Imported Save",
  }),
  // v1 saves predate enemy cooldowns/buffs and cutscene scene tracking.
  1: (data) => ({
    ...data,
    version: 2,
    enemyCooldowns: data.enemyCooldowns ?? [],
    activeBuffs: data.activeBuffs ?? [],
    cutsceneSceneIndex: data.cutsceneSceneIndex ?? 0,
  }),
};

function migrateSave(input: unknown): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new SaveDataError("Save file must be a JSON object");
  }

  let data = { ...(input as RawSave) };
  const rawVersion: unknown = data.version ?? 0;

  if (
    typeof rawVersion !== "number" ||
    !Number.isInteger(rawVersion) ||
    rawVersion < 0
  ) {
    throw new SaveDataError("Save file has an invalid version");
  }
  let version: number = rawVersion;

  if (version > SAVE_VERSION) {
    throw new SaveDataError(
      `Save version ${version} is newer than supported version ${SAVE_VERSION}`,
    );
  }

  while (version < SAVE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) {
      throw new SaveDataError(`No migration path from save version ${version}`);
    }
    data = migrate(data);
    const nextVersion = data.version;
    // Guard against a faulty migration that fails to advance the version.
    if (typeof nextVersion !== "number" || nextVersion <= version) {
      throw new SaveDataError(
        `Migration from save version ${version} did not advance the version`,
      );
    }
    version = nextVersion;
  }

  return data;
}

const finiteNumber = z.number().finite();
const direction = z.number().int().min(0).max(3);

const damageDiceSchema = z.looseObject({
  numDice: finiteNumber,
  dieSize: finiteNumber,
  bonus: finiteNumber,
});

const actionSchema = z.looseObject({
  name: z.string(),
  hitDC: z.string(),
  damage: damageDiceSchema,
  type: z.enum(["Ranged Weapon", "Melee Weapon"]),
});

const itemSchema = z.looseObject({
  name: z.string(),
  type: z.enum(["consumable", "equipment"]),
  value: finiteNumber.optional(),
  img: z.string().optional(),
  cost: finiteNumber.optional(),
  description: z.string().optional(),
  // Equipment-only fields (ignored for consumables).
  slot: z.string().optional(),
  stats: z.record(z.string(), finiteNumber).optional(),
  action: actionSchema.optional(),
  // Consumable-only fields.
  effect: z.string().optional(),
  hpChange: finiteNumber.optional(),
  manaChange: finiteNumber.optional(),
  target: z.string().optional(),
  stackSize: finiteNumber.optional(),
});

const abilitySchema = z.looseObject({
  score: finiteNumber,
  modifier: finiteNumber,
});

const abilitiesSchema = z.looseObject({
  str: abilitySchema,
  dex: abilitySchema,
  con: abilitySchema,
  int: abilitySchema,
  wis: abilitySchema,
  cha: abilitySchema,
  def: abilitySchema,
});

const skillSchema = z.looseObject({
  name: z.string(),
  ability: z.enum(["STR", "DEX", "CON", "INT", "WIS", "CHA"]),
  modifier: z.string(),
});

const spellEffectSchema = z.looseObject({
  type: z.enum(["damage", "heal", "buff", "debuff"]),
  amount: finiteNumber.optional(),
  target: z.string().optional(),
  stat: z.string().optional(),
  duration: finiteNumber.optional(),
});

const spellSchema = z.looseObject({
  name: z.string(),
  manaCost: finiteNumber,
  image: z.string().optional(),
  effect: spellEffectSchema,
  description: z.string().optional(),
});

const equipmentSchema = z.looseObject({
  helmet: itemSchema.nullable().optional(),
  armor: itemSchema.nullable().optional(),
  weapon: itemSchema.nullable().optional(),
  shield: itemSchema.nullable().optional(),
  accessory1: itemSchema.nullable().optional(),
  accessory2: itemSchema.nullable().optional(),
  boots: itemSchema.nullable().optional(),
});

const characterSchema = z.looseObject({
  name: z.string(),
  type: z.literal("character"),
  race: z.string().optional(),
  img: z.string().optional(),
  class: z.string().optional(),
  level: finiteNumber,
  hp: finiteNumber,
  maxHp: finiteNumber,
  mp: finiteNumber.optional(),
  maxMp: finiteNumber.optional(),
  abilities: abilitiesSchema.optional(),
  skills: z.array(skillSchema).optional(),
  equipment: equipmentSchema.optional(),
  savingThrows: z.record(z.string(), z.string()).optional(),
  spells: z.array(spellSchema).optional(),
  alive: z.boolean().optional(),
  exp: finiteNumber.optional(),
  nextLevelExp: finiteNumber.optional(),
});

const enemyMoveEffectSchema = z.looseObject({
  type: z.enum(["damage", "heal", "buff", "debuff", "spawn"]),
  target: z.string().optional(),
  stat: z.string().optional(),
  amount: finiteNumber.optional(),
  duration: finiteNumber.optional(),
  spawnIndex: finiteNumber.optional(),
  count: finiteNumber.optional(),
  damageDice: damageDiceSchema.optional(),
  healDice: damageDiceSchema.optional(),
});

const enemyMoveSchema = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  cooldown: finiteNumber.optional(),
  weight: finiteNumber.optional(),
  effect: enemyMoveEffectSchema,
  phase: finiteNumber.optional(),
});

const enemySchema: z.ZodType = z.lazy(() =>
  z.looseObject({
    id: finiteNumber,
    name: z.string(),
    health: finiteNumber,
    maxHealth: finiteNumber.optional(),
    strength: finiteNumber.optional(),
    dex: finiteNumber.optional(),
    defense: finiteNumber.optional(),
    img: z.string().optional(),
    expGain: finiteNumber.optional(),
    type: z.enum(["enemy", "boss"]).optional(),
    moves: z.array(enemyMoveSchema).optional(),
    phase: finiteNumber.optional(),
    phaseThresholds: z.array(finiteNumber).optional(),
    spawnOnDefeat: z.array(finiteNumber).optional(),
    spawns: z.array(enemySchema).optional(),
  }),
);

const dialogueOutcomeSchema = z.looseObject({
  type: z.enum([
    "none",
    "quest_start",
    "item_give",
    "npc_join",
    "npc_hostile",
    "npc_friendly",
    "npc_leave",
    "end_conversation",
  ]),
  value: z.string().optional(),
  flagKey: z.string().optional(),
  flagValue: z.string().optional(),
});

const skillConditionSchema = z.looseObject({
  skill: z.string(),
  dc: finiteNumber,
  successNodeId: z.string().optional(),
  failureNodeId: z.string().optional(),
});

const dialogueChoiceSchema = z.looseObject({
  id: z.string(),
  text: z.string(),
  nextNodeId: z.string().nullable(),
  skillCondition: skillConditionSchema.optional(),
  outcome: dialogueOutcomeSchema.optional(),
});

const dialogueNodeSchema = z.looseObject({
  id: z.string(),
  text: z.string(),
  speaker: z.string().optional(),
  choices: z.array(dialogueChoiceSchema).optional(),
  outcome: dialogueOutcomeSchema.optional(),
  isEndpoint: z.boolean(),
});

const roomInteractionSchema: z.ZodType = z.lazy(() =>
  z.looseObject({
    type: z.enum(["NPC", "chest", "camp", "transition", "cutscene"]),
    npc: z
      .looseObject({
        name: z.string(),
        dialogue: z.array(z.string()).optional(),
        quest: z.lazy(() => questSchema).optional(),
      })
      .optional(),
    chest: z
      .looseObject({
        id: finiteNumber,
        item: itemSchema.nullable().optional(),
      })
      .optional(),
    camp: z.record(z.string(), z.unknown()).optional(),
    transition: z.record(z.string(), z.unknown()).optional(),
    cutscene: z.record(z.string(), z.unknown()).optional(),
  }),
);

const questSchema: z.ZodType = z.lazy(() =>
  z.looseObject({
    id: finiteNumber,
    name: z.string(),
    description: z.string().optional(),
    npcName: z.string().optional(),
    type: z.looseObject({
      type: z.enum(["fetch", "defeat", "explore"]),
      item: itemSchema.optional(),
      enemy: z.lazy(() => enemySchema).optional(),
    }),
    objectives: z.array(z.string()),
    rewards: z.array(itemSchema),
    accepted: z.boolean(),
    completed: z.boolean(),
  }),
);

const serializedRoomSchema: z.ZodType = z.lazy(() =>
  z.looseObject({
    id: finiteNumber,
    name: z.string(),
    sectionId: finiteNumber,
    enemies: z.array(enemySchema),
    neighboringRooms: z.array(z.tuple([direction, finiteNumber])),
    interaction: roomInteractionSchema.nullable(),
  }),
);

const activeBuffSchema = z.looseObject({
  stat: z.string(),
  amount: finiteNumber,
  remainingTurns: finiteNumber,
  source: z.string(),
});

const saveSchema = z.looseObject({
  version: z.literal(SAVE_VERSION),
  timestamp: finiteNumber,
  label: z.string(),
  party: z.array(characterSchema),
  activityLog: z.array(z.string()),
  inventory: z.array(itemSchema),
  goldPieces: finiteNumber,
  accumulatedExp: finiteNumber,
  quests: z.array(questSchema),
  conversationFlags: z.record(z.string(), z.record(z.string(), z.string())),
  currentSection: finiteNumber.nullable(),
  beatenSections: z.array(finiteNumber),
  availableSections: z.array(
    z.looseObject({ id: finiteNumber, name: z.string() }),
  ),
  currentRoomId: finiteNumber,
  roomInstances: z.array(z.tuple([finiteNumber, serializedRoomSchema])),
  gameStatus: z.number().int().min(0).max(3),
  combatOrder: z.array(z.union([characterSchema, enemySchema])),
  activeFighterIndex: z.number().int(),
  activeDialogue: dialogueNodeSchema.nullable(),
  currentDialogueNodeId: z.string().nullable(),
  dialogueIndex: z.number().int().nonnegative(),
  lastHitEnemyId: z.string().nullable(),
  lastHitCounter: finiteNumber,
  lastDefeatedEnemyId: z.string().nullable(),
  lastDefeatedCounter: finiteNumber,
  isTargeting: z.boolean(),
  targetingSpell: spellSchema.nullable(),
  targetingConsumable: itemSchema.nullable(),
  isLevelingUp: z.boolean(),
  levelingUpChars: z.array(characterSchema),
  currentLevelingCharIndex: z.number().int(),
  dialogueTrees: z.array(z.tuple([finiteNumber, dialogueNodeSchema])),
  activeCutsceneId: z.string().nullable(),
  cutsceneSceneIndex: z.number().int().nonnegative(),
  enemyCooldowns: z.array(
    z.tuple([finiteNumber, z.array(z.tuple([z.string(), finiteNumber]))]),
  ),
  activeBuffs: z.array(z.tuple([z.string(), z.array(activeBuffSchema)])),
});

/**
 * Validate an untrusted parsed save object, migrating older versions first.
 * Throws a {@link SaveDataError} with a human-readable reason on failure.
 */
export function parseSaveData(input: unknown): SaveData {
  const migrated = migrateSave(input);
  const result = saveSchema.safeParse(migrated);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    throw new SaveDataError(`Invalid save data at ${path}: ${issue.message}`);
  }
  return result.data as unknown as SaveData;
}
