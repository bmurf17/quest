import { useGameStore } from "@/state/GameState";
import { Camp, Chest, NPC, NPCType } from "@/types/RoomInteractions";
import { CharacterData, formatDamageDice } from "@/types/Character";
import { useState } from "react";
import { colors as themeColors, fonts } from "../theme";
import Inventory from "./Inventory";
import Shop from "./Shop";
import { manaPotion } from "@/types/Item";
import { Spell } from "@/types/Spell";
import { partyHasAnimalHandling } from "@/state/utils/DialogueUtils";

interface ActionBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "success" | "muted";
  children: React.ReactNode;
  fullWidth?: boolean;
  title?: string;
}

function ActionBtn({ onClick, disabled, variant = "default", children, fullWidth, title }: ActionBtnProps) {
  const colors = {
    default: { bg: "rgba(255,255,255,0.04)", hover: "rgba(180,140,80,0.12)", border: themeColors.goldBorder, text: themeColors.goldMuted },
    danger:  { bg: "rgba(220,38,38,0.07)",   hover: "rgba(220,38,38,0.14)",   border: "rgba(220,38,38,0.25)",   text: "#FCA5A5" },
    success: { bg: "rgba(5,150,105,0.07)",    hover: "rgba(5,150,105,0.14)",   border: "rgba(52,211,153,0.25)",  text: "#6EE7B7" },
    muted:   { bg: "rgba(0,0,0,0.2)",         hover: "rgba(0,0,0,0.2)",        border: themeColors.subtleBorder, text: "#4B5563" },
  };
  const c = disabled ? colors.muted : colors[variant];

  return (
    <div
      title={title}
      onClick={!disabled ? onClick : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 12px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        color: c.text,
        fontSize: 12,
  fontFamily: fonts.display,
        fontWeight: 600,
        letterSpacing: "0.05em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s, border-color 0.15s",
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.5 : 1,
        userSelect: "none",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = c.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = c.bg; }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
  <span style={{ fontSize: 9, color: themeColors.goldMuted, fontFamily: fonts.display, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {children}
      </span>
  <div style={{ flex: 1, height: 1, background: themeColors.goldBorder }} />
    </div>
  );
}

interface AbilitySlotProps {
  img: string;
  alt: string;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}

function AbilitySlot({ img, alt, badge, badgeColor = "#6366F1", disabled, onClick, title }: AbilitySlotProps) {
  return (
    <div
      title={title}
      onClick={!disabled ? onClick : undefined}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "1",
          background: disabled ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.04)",
  border: `1px solid ${disabled ? themeColors.subtleBorder : themeColors.goldBorder}`,
        borderRadius: 7,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "rgba(180,140,80,0.1)";
          e.currentTarget.style.borderColor = themeColors.gold;
          e.currentTarget.style.transform = "scale(1.04)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = disabled ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.04)";
  e.currentTarget.style.borderColor = disabled ? themeColors.subtleBorder : themeColors.goldBorder;
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <img
        src={img}
        alt={alt}
        style={{ width: "60%", height: "60%", imageRendering: "pixelated", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
      />
          {badge !== undefined && (
            <div style={{
              position: "absolute",
              bottom: 3, right: 3,
              background: badgeColor,
              color: "#fff",
              fontSize: 9,
              fontFamily: fonts.body,
              padding: "1px 4px",
              borderRadius: 3,
              lineHeight: 1.4,
            }}>
              {badge}
            </div>
          )}
    </div>
  );
}

export default function ActionMenu() {
  const attack = useGameStore((state) => state.attack);
  const speak = useGameStore((state) => state.speak);
  const rest = useGameStore((state) => state.rest);
  const updateChest = useGameStore((state) => state.updateChest);
  const takeFromChest = useGameStore((state) => state.takeFromChest);
  const castSpell = useGameStore((state) => state.castSpell);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);
  const party = useGameStore((state) => state.party);
  const index = useGameStore((state) => state.activeFighterIndex);
  const combatOrder = useGameStore((state) => state.combatOrder);
  const isFighterEnemy = useGameStore((state) => state.isCurrentFighterEnemy());
  const room = useGameStore((state) => state.room);
  const inventory = useGameStore((state) => state.inventory);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  const handleAttackClick = () => {
    if (room.enemies.length === 1) {
      attack(room.enemies[0]);
    } else {
      setTargeting(true);
      setTargetingSpell(null);
    }
  };

  const handleSpellClick = (spell: Spell) => {
    const currentCaster = combatOrder[index] as CharacterData;
    if (currentCaster.mp < spell.manaCost) return;

    if (spell.effect.type === "damage") {
      if (spell.effect.target === "single") {
        room.enemies.length === 1 ? castSpell(spell, room.enemies[0]) : (setTargeting(true), setTargetingSpell(spell));
      } else if (spell.effect.target === "all") {
        castSpell(spell);
      }
    } else if (spell.effect.type === "heal") {
      if (spell.effect.target === "single") {
        setTargeting(true);
        setTargetingSpell(spell);
      } else if (spell.effect.target === "party") {
        castSpell(spell);
      }
    }
  };

  const currentFighter = combatOrder[index] as CharacterData;
  const inCombat = room && room.enemies.length > 0;
  const npc = room?.interaction?.type === "NPC" ? (room.interaction as { type: "NPC"; npc: NPC }).npc : null;
  const chest = room?.interaction?.type === "chest" ? room.interaction.chest as Chest : null;
  const camp = room?.interaction?.type === "camp" ? room.interaction.camp as Camp : null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", fontFamily: "'Lato', sans-serif" }}>

        {inCombat && !isFighterEnemy && currentFighter && (
          <div>
            {currentFighter.items?.length > 0 && (
              <>
                <SectionLabel>Weapons</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 4, marginLeft: 4 }}>
                  {currentFighter.items.map((item, idx) => (
                    <AbilitySlot
                      key={item.action.name + idx}
                      img={item.img}
                      alt={item.action.name}
                      title={`${item.action.name} — Hit: ${item.action.hitDC} · Dmg: ${formatDamageDice(item.action.damage)}`}
                      onClick={handleAttackClick}
                    />
                  ))}
                </div>
              </>
            )}

            {currentFighter.spells?.length > 0 && (
              <>
                <SectionLabel>Skills</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginLeft: 4  }}>
                  {currentFighter.spells.map((spell, idx) => {
                    const notEnoughMana = currentFighter.mp < spell.manaCost;
                    return (
                      <AbilitySlot
                        key={spell.name + idx}
                        img={spell.image}
                        alt={spell.name}
                        badge={spell.manaCost}
                        badgeColor={notEnoughMana ? "#374151" : "#4F46E5"}
                        disabled={notEnoughMana}
                        title={`${spell.name} (${spell.manaCost} MP) — ${spell.description}`}
                        onClick={() => handleSpellClick(spell)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {npc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SectionLabel>Dialogue</SectionLabel>
              {npc.NPCType === NPCType.ANIMAL && !partyHasAnimalHandling(party) ? (
                <ActionBtn disabled variant="muted" fullWidth>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Requires Animal Handling
                </ActionBtn>
              ) : (
                <ActionBtn onClick={() => speak(npc)} fullWidth>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                  {useGameStore.getState().dialogueIndex < npc.dialogue.length - 1 ? "Continue Dialogue" : "Speak"}
                </ActionBtn>
              )}
              {npc.NPCType === NPCType.MERCHANT && (
                <ActionBtn onClick={() => setIsShopModalOpen(true)} variant="success" fullWidth>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Open Shop
                </ActionBtn>
              )}
            </div>
        )}

        {chest && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SectionLabel>Chest</SectionLabel>
            {!chest.isOpen ? (
              <ActionBtn
                variant="success"
                onClick={() => updateChest({ ...chest, isOpen: true })}
                fullWidth
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                Open Chest
              </ActionBtn>
            ) : chest.quantity === 0 ? (
              <ActionBtn
                variant="muted"
                onClick={() => updateChest({ ...chest, isOpen: false })}
                fullWidth
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                Close (Empty)
              </ActionBtn>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <ActionBtn onClick={() => updateChest({ ...chest, isOpen: false })}>
                  Close
                </ActionBtn>
                <ActionBtn variant="success" onClick={() => takeFromChest({ ...chest, quantity: 0 })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Take All
                </ActionBtn>
              </div>
            )}
          </div>
        )}

        {camp && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SectionLabel>Camp</SectionLabel>
            <ActionBtn
              variant="success"
              onClick={() => rest(camp)}
              fullWidth
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
              Rest &amp; Recover
            </ActionBtn>
          </div>
        )}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 1, background: "rgba(180,140,80,0.1)" }} />
          <ActionBtn onClick={() => setIsInventoryModalOpen(true)} fullWidth>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.75 7.5h16.5M8.625 4.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            Inventory
          </ActionBtn>
        </div>

      </div>

      <Inventory
        isOpen={isInventoryModalOpen}
        onOpenChange={setIsInventoryModalOpen}
        inventory={inventory}
      />
      <Shop
        isOpen={isShopModalOpen}
        onOpenChange={setIsShopModalOpen}
        inventory={[manaPotion]}
        ownersName={npc?.name ?? "Shopkeeper"}
      />
    </>
  );
}