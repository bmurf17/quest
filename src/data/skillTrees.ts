import type { ClassSkillTree } from "@/types/SkillTree";

const warriorTree: ClassSkillTree = {
  className: "Warrior",
  nodes: [
    { id: "cleave", name: "Cleave", description: "Strike all adjacent foes", tier: 0, prerequisites: [] },
    { id: "shield_bash", name: "Shield Bash", description: "Stun an enemy with your shield", tier: 1, prerequisites: ["cleave"] },
    { id: "war_cry", name: "War Cry", description: "Boost ally damage", tier: 1, prerequisites: ["cleave"] },
    { id: "whirlwind", name: "Whirlwind", description: "Spin and strike all nearby enemies", tier: 2, prerequisites: ["shield_bash"] },
    { id: "taunt", name: "Taunt", description: "Force an enemy to target you", tier: 2, prerequisites: ["shield_bash", "war_cry"] },
    { id: "battle_fury", name: "Battle Fury", description: "Attack faster with each hit", tier: 2, prerequisites: ["war_cry"] },
    { id: "execute", name: "Execute", description: "Finish a wounded foe instantly", tier: 3, prerequisites: ["whirlwind", "taunt"] },
  ],
};

const rangerTree: ClassSkillTree = {
  className: "Ranger",
  nodes: [
    { id: "aimed_shot", name: "Aimed Shot", description: "Precise shot with bonus damage", tier: 0, prerequisites: [] },
    { id: "poison_arrow", name: "Poison Arrow", description: "Poison a target over time", tier: 1, prerequisites: ["aimed_shot"] },
    { id: "tracking", name: "Tracking", description: "Reveal hidden enemies", tier: 1, prerequisites: ["aimed_shot"] },
    { id: "volley", name: "Volley", description: "Fire a hail of arrows", tier: 2, prerequisites: ["poison_arrow"] },
    { id: "camouflage", name: "Camouflage", description: "Blend into the environment", tier: 2, prerequisites: ["tracking"] },
    { id: "eagle_eye", name: "Eagle Eye", description: "Criticals deal extra damage", tier: 2, prerequisites: ["poison_arrow", "tracking"] },
    { id: "headshot", name: "Headshot", description: "Devastating critical strike", tier: 3, prerequisites: ["volley", "eagle_eye"] },
  ],
};

const clericTree: ClassSkillTree = {
  className: "Cleric",
  nodes: [
    { id: "holy_light", name: "Holy Light", description: "Burn a foe with radiant energy", tier: 0, prerequisites: [] },
    { id: "divine_shield", name: "Divine Shield", description: "Protect an ally from harm", tier: 1, prerequisites: ["holy_light"] },
    { id: "heal", name: "Heal", description: "Restore HP to an ally", tier: 1, prerequisites: ["holy_light"] },
    { id: "smite", name: "Smite", description: "Powerful radiant strike", tier: 2, prerequisites: ["divine_shield"] },
    { id: "bless", name: "Bless", description: "Buff ally attack and defense", tier: 2, prerequisites: ["heal"] },
    { id: "purify", name: "Purify", description: "Remove debuffs from an ally", tier: 2, prerequisites: ["heal", "divine_shield"] },
    { id: "resurrection", name: "Resurrection", description: "Revive a fallen party member", tier: 3, prerequisites: ["bless", "purify"] },
  ],
};

const wizardTree: ClassSkillTree = {
  className: "Wizard",
  nodes: [
    { id: "magic_missile", name: "Magic Missile", description: "Homing bolts of arcane force", tier: 0, prerequisites: [] },
    { id: "fireball", name: "Fireball", description: "Explosive ball of flame", tier: 1, prerequisites: ["magic_missile"] },
    { id: "frost_armor", name: "Frost Armor", description: "Chill barrier that protects you", tier: 1, prerequisites: ["magic_missile"] },
    { id: "arcane_barrier", name: "Arcane Barrier", description: "Absorb incoming damage", tier: 2, prerequisites: ["frost_armor"] },
    { id: "ice_storm", name: "Ice Storm", description: "Hail of ice shards across all foes", tier: 2, prerequisites: ["fireball"] },
    { id: "teleport", name: "Teleport", description: "Instantly move across the battlefield", tier: 2, prerequisites: ["fireball", "frost_armor"] },
    { id: "meteor_storm", name: "Meteor Storm", description: "Devastating rain of meteors", tier: 3, prerequisites: ["ice_storm", "arcane_barrier"] },
  ],
};

const assassinTree: ClassSkillTree = {
  className: "Assassin",
  nodes: [
    { id: "backstab", name: "Backstab", description: "Strike from behind for bonus damage", tier: 0, prerequisites: [] },
    { id: "poison_blade", name: "Poison Blade", description: "Lethal poison that weakens foes", tier: 1, prerequisites: ["backstab"] },
    { id: "shadow_step", name: "Shadow Step", description: "Teleport behind a target", tier: 1, prerequisites: ["backstab"] },
    { id: "death_mark", name: "Death Mark", description: "Mark a target for extra damage", tier: 2, prerequisites: ["poison_blade"] },
    { id: "smoke_bomb", name: "Smoke Bomb", description: "Blind enemies and escape", tier: 2, prerequisites: ["shadow_step"] },
    { id: "evasion", name: "Evasion", description: "Dodge incoming attacks", tier: 2, prerequisites: ["shadow_step", "poison_blade"] },
    { id: "assassinate", name: "Assassinate", description: "Execute a marked target instantly", tier: 3, prerequisites: ["death_mark", "evasion"] },
  ],
};

const barbarianTree: ClassSkillTree = {
  className: "Barbarian",
  nodes: [
    { id: "mighty_blow", name: "Mighty Blow", description: "Heavy strike that knocks back", tier: 0, prerequisites: [] },
    { id: "rage", name: "Rage", description: "Enter a fury that boosts damage", tier: 1, prerequisites: ["mighty_blow"] },
    { id: "intimidate", name: "Intimidate", description: "Frighten an enemy", tier: 1, prerequisites: ["mighty_blow"] },
    { id: "cleaving_swing", name: "Cleaving Swing", description: "Hit multiple enemies at once", tier: 2, prerequisites: ["rage"] },
    { id: "war_stomp", name: "War Stomp", description: "Stun nearby enemies", tier: 2, prerequisites: ["intimidate"] },
    { id: "unstoppable", name: "Unstoppable", description: "Reduce incoming damage while enraged", tier: 2, prerequisites: ["rage", "intimidate"] },
    { id: "berserker", name: "Berserker", description: "Unleash relentless attacks", tier: 3, prerequisites: ["cleaving_swing", "unstoppable"] },
  ],
};

const bardTree: ClassSkillTree = {
  className: "Bard",
  nodes: [
    { id: "inspiring_word", name: "Inspiring Word", description: "Boost ally morale and stats", tier: 0, prerequisites: [] },
    { id: "healing_ballad", name: "Healing Ballad", description: "Restore HP over time", tier: 1, prerequisites: ["inspiring_word"] },
    { id: "mocking_melody", name: "Mocking Melody", description: "Taunt and distract enemies", tier: 1, prerequisites: ["inspiring_word"] },
    { id: "war_march", name: "War March", description: "Increase party speed", tier: 2, prerequisites: ["healing_ballad"] },
    { id: "lullaby", name: "Lullaby", description: "Put enemies to sleep", tier: 2, prerequisites: ["mocking_melody"] },
    { id: "tale_of_courage", name: "Tale of Courage", description: "Grant temporary invulnerability", tier: 2, prerequisites: ["healing_ballad", "mocking_melody"] },
    { id: "epic_solo", name: "Epic Solo", description: "Devastating performance finale", tier: 3, prerequisites: ["war_march", "tale_of_courage"] },
  ],
};

export const CLASS_SKILL_TREES: Record<string, ClassSkillTree> = {
  warrior: warriorTree,
  ranger: rangerTree,
  cleric: clericTree,
  wizard: wizardTree,
  assassin: assassinTree,
  barbarian: barbarianTree,
  bard: bardTree,
};

export function getSkillTree(className: string): ClassSkillTree | null {
  const key = className.toLowerCase();
  return CLASS_SKILL_TREES[key] ?? null;
}
