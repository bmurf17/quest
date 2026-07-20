import { useState } from "react";
import { useGameStore } from "@/state/GameState";
import { CharacterData, formatDamageDice } from "@/types/Character";
import { EquippableItem } from "@/types/Item";
import { colors, fonts } from "@/theme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function StatBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      style={{
        height: 4,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

function TavernCharacterCard({
  character,
  onView,
}: {
  character: CharacterData;
  onView: (char: CharacterData) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 180,
        background: "rgba(0,0,0,0.6)",
        border: `1px solid ${colors.goldBorder}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        setShowTooltip(true);
        e.currentTarget.style.borderColor = colors.gold;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,175,55,0.15)";
      }}
      onMouseLeave={(e) => {
        setShowTooltip(false);
        e.currentTarget.style.borderColor = colors.goldBorder;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={() => onView(character)}
    >
      <div
        style={{
          width: 140,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
          background: "rgba(0,0,0,0.3)",
          borderRadius: 8,
        }}
      >
        <img
          src={character.img}
          alt={character.name}
          style={{
            width: 120,
            height: 120,
            imageRendering: "pixelated",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
          }}
        />
      </div>

      <div style={{ padding: "12px 14px", width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.text,
            fontFamily: fonts.display,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 4,
          }}
        >
          {character.name}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: colors.goldMuted,
              background: "rgba(180,140,80,0.1)",
              border: `1px solid ${colors.goldBorder}`,
              borderRadius: 4,
              padding: "2px 8px",
              fontFamily: fonts.display,
            }}
          >
            {character.class}
          </span>
          <span
            style={{
              fontSize: 10,
              color: colors.textMuted,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "2px 8px",
              fontFamily: fonts.display,
            }}
          >
            Lv{character.level}
          </span>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: colors.danger,
                fontFamily: fonts.display,
                fontWeight: 700,
              }}
            >
              HP
            </span>
            <span
              style={{
                fontSize: 9,
                color: colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              {character.hp}/{character.maxHp}
            </span>
          </div>
          <StatBar
            value={character.hp}
            max={character.maxHp}
            color={colors.danger}
          />
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "#6366F1",
                fontFamily: fonts.display,
                fontWeight: 700,
              }}
            >
              MP
            </span>
            <span
              style={{
                fontSize: 9,
                color: colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              {character.mp}/{character.maxMp}
            </span>
          </div>
          <StatBar value={character.mp} max={character.maxMp} color="#6366F1" />
        </div>
      </div>

      {showTooltip && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            background: "rgba(0,0,0,0.85)",
            border: `1px solid ${colors.goldBorder}`,
            borderRadius: 6,
            padding: "8px 10px",
            minWidth: 100,
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          {Object.entries(character.abilities).map(([key, ability]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: colors.textMuted,
                  fontFamily: fonts.display,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {key}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: colors.text,
                  fontFamily: fonts.body,
                }}
              >
                {ability.score}
                <span
                  style={{
                    color:
                      ability.modifier >= 0 ? colors.success : colors.danger,
                    marginLeft: 2,
                  }}
                >
                  {ability.modifier >= 0 ? "+" : ""}
                  {ability.modifier}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          width: "100%",
          padding: "8px 14px 14px",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "8px 0",
            background: `linear-gradient(135deg, ${colors.gold} 0%, #B4965A 100%)`,
            border: "none",
            borderRadius: 6,
            color: "#0d0b07",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: fonts.display,
            letterSpacing: "0.06em",
            textAlign: "center",
            cursor: "pointer",
            transition: "filter 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onView(character);
          }}
        >
          View Character
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "20px 0 12px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: colors.goldMuted,
          fontFamily: fonts.display,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
    </div>
  );
}

function CharacterDetailDialog({
  character,
  isOpen,
  onOpenChange,
  onAddToParty,
  alreadyInParty,
  hasRecruited,
}: {
  character: CharacterData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToParty: (char: CharacterData) => void;
  alreadyInParty: boolean;
  hasRecruited: boolean;
}) {
  const partyCount = useGameStore((s) => s.party.length);
  const partyFull = partyCount >= 6;
  const canAdd = !alreadyInParty && !partyFull && !hasRecruited;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 640,
          background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          fontFamily: fonts.body,
          color: colors.text,
        }}
      >
        <DialogHeader
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${colors.goldBorder}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(180,140,80,0.2)",
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={character.img}
                alt={character.name}
                style={{
                  width: 56,
                  height: 56,
                  imageRendering: "pixelated",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <DialogTitle
                style={{
                  margin: "0 0 8px",
                  fontSize: 22,
                  fontWeight: 700,
                  color: colors.text,
                  fontFamily: fonts.display,
                  letterSpacing: "0.04em",
                }}
              >
                {character.name}
              </DialogTitle>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  character.race,
                  character.class,
                  `Level ${character.level}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      color: colors.goldMuted,
                      background: "rgba(180,140,80,0.1)",
                      border: `1px solid ${colors.goldBorder}`,
                      borderRadius: 4,
                      padding: "2px 9px",
                      fontFamily: fonts.display,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea style={{ maxHeight: "60vh" }}>
          <div style={{ padding: "4px 24px 28px" }}>
            <SectionHeader>Ability Scores</SectionHeader>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 6,
              }}
            >
              {Object.entries(character.abilities).map(([key, ability]) => (
                <div
                  key={key}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${colors.goldBorder}`,
                    borderRadius: 7,
                    padding: "10px 6px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: colors.textMuted,
                      fontFamily: fonts.display,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 5,
                    }}
                  >
                    {key}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: colors.text,
                      fontFamily: fonts.display,
                      lineHeight: 1,
                    }}
                  >
                    {ability.score}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        ability.modifier >= 0 ? colors.success : colors.danger,
                      marginTop: 3,
                    }}
                  >
                    {ability.modifier >= 0 ? "+" : ""}
                    {ability.modifier}
                  </div>
                </div>
              ))}
            </div>

            {Object.values(character.equipment).filter((i): i is EquippableItem => i !== null).length > 0 && (
              <>
                <SectionHeader>Equipment</SectionHeader>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {Object.values(character.equipment).filter((i): i is EquippableItem => i !== null).map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.025)",
                        border: `1px solid ${colors.goldBorder}`,
                        borderRadius: 7,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          background: "rgba(0,0,0,0.4)",
                          border: `1px solid ${colors.goldBorder}`,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={item.img}
                          alt={item.name}
                          style={{
                            width: 34,
                            height: 34,
                            imageRendering: "pixelated",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: colors.text,
                            fontFamily: fonts.display,
                            marginBottom: 3,
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>
                          {item.action?.type}
                        </div>
                      </div>
                      {item.action && (
                        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                          {[
                            ["Hit", item.action.hitDC],
                            ["Dmg", formatDamageDice(item.action.damage)],
                          ].map(([label, val]) => (
                            <div
                              key={label as string}
                              style={{ textAlign: "center" }}
                            >
                              <div
                                style={{
                                  fontSize: 9,
                                  color: colors.textMuted,
                                  fontFamily: fonts.display,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  marginBottom: 2,
                                }}
                              >
                                {label}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: colors.goldMuted,
                                  fontFamily: fonts.display,
                                }}
                              >
                                {val as string}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${colors.goldBorder}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${colors.subtleBorder}`,
              borderRadius: 6,
              color: colors.textMuted,
              fontSize: 13,
              fontFamily: fonts.display,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              onAddToParty(character);
              onOpenChange(false);
            }}
            disabled={!canAdd}
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              cursor: canAdd ? "pointer" : "not-allowed",
              transition: "filter 0.15s, transform 0.1s",
              ...(canAdd
                ? {
                    background: `linear-gradient(135deg, ${colors.gold} 0%, #B4965A 100%)`,
                    color: "#0d0b07",
                    border: "none",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    color: "#4B5563",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }),
            }}
            onMouseEnter={(e) => {
              if (canAdd) e.currentTarget.style.filter = "brightness(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {hasRecruited
              ? "Already Recruited"
              : alreadyInParty
                ? "Already in Party"
                : partyFull
                  ? "Party Full"
                  : "⊕  Add to Party"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TavernOverlay() {
  const tavernCandidates = useGameStore((state) => state.tavernCandidates);
  const closeTavern = useGameStore((state) => state.closeTavern);
  const addTavernCharacterToParty = useGameStore(
    (state) => state.addTavernCharacterToParty,
  );
  const party = useGameStore((state) => state.party);
  const hasRecruitedFromTavern = useGameStore(
    (state) => state.hasRecruitedFromTavern,
  );
  const isTavernOpen = useGameStore((state) => state.isTavernOpen);

  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);

  const isInParty = (char: CharacterData) =>
    party.some((m) => m.name === char.name);

  return isTavernOpen ? (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: 20,
          background: "rgba(0,0,0,0.7)",
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          backdropFilter: "blur(4px)",
          minWidth: 640,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: colors.gold,
              fontFamily: fonts.display,
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            ═══ The Tavern ═══
          </div>
          <div
            style={{
              fontSize: 12,
              color: colors.textMuted,
              fontFamily: fonts.body,
            }}
          >
            {hasRecruitedFromTavern
              ? "Your new companion awaits — you can recruit again on your next visit."
              : "You spot a few familiar faces looking for adventure..."}
          </div>
        </div>

        {hasRecruitedFromTavern && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 6,
              fontSize: 12,
              color: colors.success,
              fontFamily: fonts.display,
              letterSpacing: "0.04em",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              width={14}
              height={14}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            Recruited for this visit
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {tavernCandidates.map((character, i) => (
            <TavernCharacterCard
              key={character.name + i}
              character={character}
              onView={setSelectedCharacter}
            />
          ))}
        </div>

        <button
          onClick={closeTavern}
          style={{
            padding: "10px 32px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${colors.subtleBorder}`,
            borderRadius: 6,
            color: colors.textMuted,
            fontSize: 12,
            fontFamily: fonts.display,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.06em",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = colors.goldBorder;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = colors.subtleBorder;
          }}
        >
          Leave Tavern
        </button>
      </div>

      {selectedCharacter && (
        <CharacterDetailDialog
          character={selectedCharacter}
          isOpen={!!selectedCharacter}
          onOpenChange={(open) => {
            if (!open) setSelectedCharacter(null);
          }}
          onAddToParty={(char) => {
            addTavernCharacterToParty(char);
          }}
          alreadyInParty={isInParty(selectedCharacter)}
          hasRecruited={hasRecruitedFromTavern}
        />
      )}
    </>
  ) : (
    <></>
  );
}
