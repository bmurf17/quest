import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CharacterData, CharacterEquipment } from "@/types/Character";
import { formatDamageDice } from "@/lib/dice";
import { useGameStore } from "@/state/GameState";
import type { EquippableItem, EquipmentSlot } from "@/types/Item";
import { colors, fonts } from "@/theme";
import SkillTreeView from "./SkillTreeView";
import { getSkillTree } from "@/data/skillTrees";
import { StatBar } from "@/components/shared/StatBar";
import type { CSSProperties } from "react";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <span style={sectionHeaderStyle2}>
        {children}
      </span>
      <div style={sectionHeaderStyle3} />
    </div>
  );
}

function StatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  const isLow = color === "#22C55E" && pct <= 25;
  return (
    <div>
      <div style={statRowStyle}>
        <span style={{ fontSize: 11, color: isLow ? colors.danger : color, fontFamily: fonts.display, fontWeight: 700, letterSpacing: "0.08em" }}>
          {label}
        </span>
        <span style={statRowStyle2}>
          {value}<span style={{ color: colors.muted }}>/{max}</span>
        </span>
      </div>
      <StatBar
        value={value}
        max={max}
        color={isLow ? colors.danger : color}
        height={5}
        radius={3}
        trackColor="rgba(255,255,255,0.06)"
        border={false}
        transition="width 0.3s"
        lowThreshold={0}
      />
    </div>
  );
}

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  helmet: "Helmet",
  armor: "Armor",
  weapon: "Weapon",
  shield: "Shield",
  accessory: "Accessory",
  boots: "Boots",
};

function EquipSlot({
  slot,
  item,
  onUnequip,
}: {
  slot: EquipmentSlot;
  item: EquippableItem | null;
  onUnequip: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: 6,
        background: item
          ? "rgba(180,140,80,0.08)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${item ? colors.goldBorder : colors.subtleBorder}`,
        borderStyle: item ? "solid" : "dashed",
        borderRadius: 8,
        minHeight: 80,
        justifyContent: "center",
        cursor: item ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onClick={item ? onUnequip : undefined}
      title={item ? `Click to unequip ${item.name}` : undefined}
    >
      {item ? (
        <>
          <img
            src={item.img}
            alt={item.name}
            style={equipSlotStyle}
          />
          <span
            style={equipSlotStyle2}
          >
            {item.name}
          </span>
          {item.action && (
            <span style={{ fontSize: 8, color: colors.textMuted }}>
              {item.action.hitDC} · {formatDamageDice(item.action.damage)}
            </span>
          )}
          {!item.action && (
            <span style={{ fontSize: 8, color: colors.textMuted }}>
              {item.stats.attack != null && `ATK +${item.stats.attack}`}
              {item.stats.attack != null && item.stats.defense != null && " · "}
              {item.stats.defense != null && `DEF +${item.stats.defense}`}
            </span>
          )}
        </>
      ) : (
        <span
          style={equipSlotStyle3}
        >
          {SLOT_LABELS[slot]}
        </span>
      )}
    </div>
  );
}

export default function CharacterSheet({
  isOpen = false,
  onOpenChange,
  characterData,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  characterData: CharacterData;
}) {
  const [activeTab, setActiveTab] = useState<"stats" | "equipment" | "skills">("stats");
  const inventory = useGameStore((s) => s.inventory);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const equipItems = inventory.filter(
    (item): item is EquippableItem => item.type === "equipment",
  );

  const tabStyle = (tab: "stats" | "equipment" | "skills") =>
    ({
      background:
        activeTab === tab ? "rgba(180,140,80,0.15)" : "transparent",
      border: `1px solid ${
        activeTab === tab ? colors.goldBorder : "transparent"
      }`,
      color: activeTab === tab ? colors.goldMuted : colors.textMuted,
      borderRadius: 6,
      padding: "8px 18px",
      fontSize: 12,
      fontFamily: fonts.display,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      cursor: "pointer",
      transition: "all 0.15s",
    } as const);

  const equipment: CharacterEquipment = characterData.equipment ?? {
    helmet: null, armor: null, weapon: null, shield: null,
    accessory1: null, accessory2: null, boots: null,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        style={characterSheetStyle}
      >
        {/* fonts loaded globally in src/index.css */}

        {/* Header */}
          <DialogHeader style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${colors.goldBorder}` }}>
          <div style={characterSheetStyle2}>
            {/* Portrait */}
            <div style={characterSheetStyle3}>
              <img src={characterData.img} alt={characterData.name} style={characterSheetStyle4} />
            </div>

            <div style={{ flex: 1 }}>
              <DialogTitle style={characterSheetStyle5}>
                {characterData.name}
              </DialogTitle>
              <div style={{ display: "flex", gap: 6 }}>
                {[characterData.race, characterData.class, `Level ${characterData.level}`].map((tag) => (
                  <span key={tag} style={characterSheetStyle6}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab bar */}
        <div
          style={characterSheetStyle7}
        >
          <button onClick={() => setActiveTab("stats")} style={tabStyle("stats")}>
            Stats
          </button>
          <button onClick={() => setActiveTab("equipment")} style={tabStyle("equipment")}>
            Equipment
          </button>
          <button onClick={() => setActiveTab("skills")} style={tabStyle("skills")}>
            Skills
          </button>
        </div>

        <ScrollArea style={{ height: "65vh" }}>
          <div style={{ padding: "4px 24px 28px" }}>
            {activeTab === "stats" && (
              <>
                <SectionHeader>Vitals</SectionHeader>
                <div style={characterSheetStyle8}>
                  <StatRow label="HP" value={characterData.hp} max={characterData.maxHp} color={colors.success} />
                  <StatRow label="MP" value={characterData.mp} max={characterData.maxMp} color="#6366F1" />
                  <StatRow label="EXP" value={characterData.exp} max={characterData.nextLevelExp} color={colors.warning ?? '#F59E0B'} />
                </div>

                <SectionHeader>Ability Scores</SectionHeader>
                <div style={characterSheetStyle9}>
                  {Object.entries(characterData.abilities).map(([key, ability]) => (
                    <div key={key} style={characterSheetStyle10}>
                      <div style={characterSheetStyle11}>{key}</div>
                      <div style={characterSheetStyle12}>{ability.score}</div>
                      <div style={{ fontSize: 12, color: ability.modifier >= 0 ? colors.success : colors.danger, marginTop: 3 }}>
                        {ability.modifier >= 0 ? "+" : ""}{ability.modifier}
                      </div>
                    </div>
                  ))}
                </div>

                <SectionHeader>Saving Throws</SectionHeader>
                <div style={characterSheetStyle9}>
                  {Object.entries(characterData.savingThrows).map(([key, value]) => (
                    <div key={key} style={characterSheetStyle10}>
                      <div style={characterSheetStyle11}>{key}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: (value as unknown as number) >= 0 ? colors.success : colors.danger, fontFamily: fonts.display, lineHeight: 1 }}>
                        {(value as unknown as number) >= 0 ? "+" : ""}{value}
                      </div>
                    </div>
                  ))}
                </div>

                {characterData.skills?.length > 0 && (
                  <>
                    <SectionHeader>Skills</SectionHeader>
                    <div style={characterSheetStyle13}>
                      {characterData.skills.map((skill) => (
                        <div key={skill.name} style={characterSheetStyle14}>
                          <div>
                            <span style={characterSheetStyle15}>{skill.name}</span>
                            <span style={characterSheetStyle16}>({skill.ability})</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: (skill.modifier as unknown as number) >= 0 ? colors.success : colors.danger, fontFamily: fonts.display }}>
                            {(skill.modifier as unknown as number) >= 0 ? "+" : ""}{skill.modifier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "equipment" && (
              <>
                <SectionHeader>Equipment Slots</SectionHeader>
                {/* Paperdoll grid: helmet top-center, weapon|armor|shield middle row, acc1|boots|acc2 bottom */}
                <div
                  style={characterSheetStyle17}
                >
                  {/* Row 1: helmet centered */}
                  <div />
                  <EquipSlot
                    slot="helmet"
                    item={equipment.helmet}
                    onUnequip={() => unequipItem(characterData.name, "helmet")}
                  />
                  <div />

                  {/* Row 2: weapon, armor, shield */}
                  <EquipSlot
                    slot="weapon"
                    item={equipment.weapon}
                    onUnequip={() => unequipItem(characterData.name, "weapon")}
                  />
                  <EquipSlot
                    slot="armor"
                    item={equipment.armor}
                    onUnequip={() => unequipItem(characterData.name, "armor")}
                  />
                  <EquipSlot
                    slot="shield"
                    item={equipment.shield}
                    onUnequip={() => unequipItem(characterData.name, "shield")}
                  />

                  {/* Row 3: accessory1, boots, accessory2 */}
                  <EquipSlot
                    slot="accessory"
                    item={equipment.accessory1}
                    onUnequip={() => unequipItem(characterData.name, "accessory1")}
                  />
                  <EquipSlot
                    slot="boots"
                    item={equipment.boots}
                    onUnequip={() => unequipItem(characterData.name, "boots")}
                  />
                  <EquipSlot
                    slot="accessory"
                    item={equipment.accessory2}
                    onUnequip={() => unequipItem(characterData.name, "accessory2")}
                  />
                </div>

                <SectionHeader>Inventory Equipment</SectionHeader>
                {equipItems.length > 0 ? (
                  <div style={characterSheetStyle18}>
                    {equipItems.map((item) => {
                      const targetSlot = item.slot;
                      const alreadyEquippedToSlot =
                        (targetSlot === "accessory" &&
                          (equipment.accessory1?.name === item.name ||
                            equipment.accessory2?.name === item.name)) ||
                        equipment[targetSlot as keyof CharacterEquipment]?.name === item.name;
                      return (
                        <div
                          key={item.name}
                          style={characterSheetStyle19}
                        >
                          <div
                            style={characterSheetStyle20}
                          >
                            <img
                              src={item.img}
                              alt={item.name}
                              style={characterSheetStyle21}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={characterSheetStyle22}
                            >
                              {item.name}
                            </div>
                            <div
                              style={characterSheetStyle23}
                            >
                              {SLOT_LABELS[item.slot]}
                            </div>
                          </div>
                          <div
                            style={characterSheetStyle24}
                          >
                            {item.stats.attack != null && (
                              <div style={{ textAlign: "center" }}>
                                <div
                                  style={characterSheetStyle25}
                                >
                                  ATK
                                </div>
                                <div
                                  style={characterSheetStyle26}
                                >
                                  +{item.stats.attack}
                                </div>
                              </div>
                            )}
                            {item.stats.defense != null && (
                              <div style={{ textAlign: "center" }}>
                                <div
                                  style={characterSheetStyle25}
                                >
                                  DEF
                                </div>
                                <div
                                  style={characterSheetStyle27}
                                >
                                  +{item.stats.defense}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              equipItem(characterData.name, item.name)
                            }
                            disabled={alreadyEquippedToSlot}
                            style={{
                              fontSize: 10,
                              fontFamily: fonts.display,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              padding: "5px 12px",
                              background: alreadyEquippedToSlot
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(180,140,80,0.15)",
                              border: `1px solid ${
                                alreadyEquippedToSlot
                                  ? colors.subtleBorder
                                  : colors.goldBorder
                              }`,
                              borderRadius: 5,
                              color: alreadyEquippedToSlot
                                ? colors.muted
                                : colors.goldMuted,
                              cursor: alreadyEquippedToSlot
                                ? "not-allowed"
                                : "pointer",
                              transition: "background 0.15s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {alreadyEquippedToSlot ? "Equipped" : "Equip"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={characterSheetStyle28}
                  >
                    No equippable items in inventory.
                  </div>
                )}
              </>
            )}

            {activeTab === "skills" && (
              <SkillTreeView
                tree={getSkillTree(characterData.class) ?? { className: characterData.class, nodes: [] }}
                level={characterData.level}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Static style objects hoisted out of the render path.
const sectionHeaderStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, margin: "20px 0 12px" };
  const sectionHeaderStyle2: CSSProperties = { fontSize: 11, color: colors.goldMuted, fontFamily: fonts.display, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" };
  const sectionHeaderStyle3: CSSProperties = { flex: 1, height: 1, background: colors.goldBorder };
  const statRowStyle: CSSProperties = { display: "flex", justifyContent: "space-between", marginBottom: 4 };
  const statRowStyle2: CSSProperties = { fontSize: 12, color: colors.textMuted, fontFamily: fonts.body };
  const equipSlotStyle: CSSProperties = { width: 36, height: 36, imageRendering: "pixelated" };
  const equipSlotStyle2: CSSProperties = {
                fontSize: 9,
                color: colors.goldMuted,
                fontFamily: fonts.display,
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.2,
};
const equipSlotStyle3: CSSProperties = {
  fontSize: 9,
  color: colors.muted,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textAlign: "center",
};
const characterSheetStyle: CSSProperties = {
  maxWidth: 760,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 0,
  overflow: "hidden",
  fontFamily: fonts.body,
  color: colors.text,
};
const characterSheetStyle2: CSSProperties = { display: "flex", alignItems: "center", gap: 16 };
  const characterSheetStyle3: CSSProperties = { width: 64, height: 64, flexShrink: 0, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(180,140,80,0.2)", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" };
  const characterSheetStyle4: CSSProperties = { width: 56, height: 56, imageRendering: "pixelated", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))" };
  const characterSheetStyle5: CSSProperties = { margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: colors.text, fontFamily: fonts.display, letterSpacing: "0.04em" };
  const characterSheetStyle6: CSSProperties = { fontSize: 11, color: colors.goldMuted, background: "rgba(180,140,80,0.1)", border: `1px solid ${colors.goldBorder}`, borderRadius: 4, padding: "2px 9px", fontFamily: fonts.display, letterSpacing: "0.04em" };
  const characterSheetStyle7: CSSProperties = {
              display: "flex",
              gap: 4,
              padding: "12px 24px 0",
              borderBottom: `1px solid ${colors.goldBorder}`,
};
const characterSheetStyle8: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
  const characterSheetStyle9: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 };
  const characterSheetStyle10: CSSProperties = { background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.goldBorder}`, borderRadius: 7, padding: "10px 6px", textAlign: "center" };
  const characterSheetStyle11: CSSProperties = { fontSize: 9, color: colors.textMuted, fontFamily: fonts.display, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 };
  const characterSheetStyle12: CSSProperties = { fontSize: 22, fontWeight: 700, color: colors.text, fontFamily: fonts.display, lineHeight: 1 };
  const characterSheetStyle13: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 };
  const characterSheetStyle14: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: "rgba(255,255,255,0.02)", border: `1px solid ${colors.goldBorder}`, borderRadius: 5 };
  const characterSheetStyle15: CSSProperties = { fontSize: 13, color: colors.textMuted, fontFamily: fonts.display };
  const characterSheetStyle16: CSSProperties = { fontSize: 10, color: colors.muted, marginLeft: 6, fontFamily: fonts.body };
  const characterSheetStyle17: CSSProperties = {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      maxWidth: 420,
                      margin: "0 auto",
};
const characterSheetStyle18: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const characterSheetStyle19: CSSProperties = {
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "8px 12px",
                              background: "rgba(255,255,255,0.025)",
                              border: `1px solid ${colors.goldBorder}`,
                              borderRadius: 7,
};
const characterSheetStyle20: CSSProperties = {
  width: 40,
  height: 40,
  flexShrink: 0,
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const characterSheetStyle21: CSSProperties = {
  width: 30,
  height: 30,
  imageRendering: "pixelated",
};
const characterSheetStyle22: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  marginBottom: 2,
};
const characterSheetStyle23: CSSProperties = {
  fontSize: 10,
  color: colors.textMuted,
  textTransform: "capitalize",
};
const characterSheetStyle24: CSSProperties = {
  display: "flex",
  gap: 10,
  flexShrink: 0,
  alignItems: "center",
};
const characterSheetStyle25: CSSProperties = {
  fontSize: 8,
  color: colors.textMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
const characterSheetStyle26: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.success,
  fontFamily: fonts.display,
};
const characterSheetStyle27: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#6366F1",
  fontFamily: fonts.display,
};
const characterSheetStyle28: CSSProperties = {
  fontSize: 12,
  color: colors.textMuted,
  padding: "12px 0",
};
