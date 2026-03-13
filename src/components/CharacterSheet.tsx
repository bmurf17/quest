import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CharacterData } from "@/types/Character";
import { colors, fonts } from "../theme";

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const isLow = color === "#22C55E" && pct <= 25;
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: isLow ? colors.danger : color, borderRadius: 3, transition: "width 0.3s" }} />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 12px" }}>
      <span style={{ fontSize: 11, color: colors.goldMuted, fontFamily: fonts.display, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.goldBorder }} />
    </div>
  );
}

function StatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  const isLow = color === "#22C55E" && pct <= 25;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: isLow ? colors.danger : color, fontFamily: fonts.display, fontWeight: 700, letterSpacing: "0.08em" }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: fonts.body }}>
          {value}<span style={{ color: colors.muted }}>/{max}</span>
        </span>
      </div>
      <StatBar value={value} max={max} color={color} />
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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: 760,
          background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          fontFamily: fonts.body,
          color: colors.text,
        }}
      >
        {/* fonts loaded globally in src/index.css */}

        {/* Header */}
          <DialogHeader style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${colors.goldBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Portrait */}
            <div style={{ width: 64, height: 64, flexShrink: 0, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(180,140,80,0.2)", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={characterData.img} alt={characterData.name} style={{ width: 56, height: 56, imageRendering: "pixelated", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))" }} />
            </div>

            <div style={{ flex: 1 }}>
              <DialogTitle style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: colors.text, fontFamily: fonts.display, letterSpacing: "0.04em" }}>
                {characterData.name}
              </DialogTitle>
              <div style={{ display: "flex", gap: 6 }}>
                {[characterData.race, characterData.class, `Level ${characterData.level}`].map((tag) => (
                  <span key={tag} style={{ fontSize: 11, color: colors.goldMuted, background: "rgba(180,140,80,0.1)", border: `1px solid ${colors.goldBorder}`, borderRadius: 4, padding: "2px 9px", fontFamily: fonts.display, letterSpacing: "0.04em" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea style={{ height: "75vh" }}>
          <div style={{ padding: "4px 24px 28px" }}>

            <SectionHeader>Vitals</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <StatRow label="HP" value={characterData.hp} max={characterData.maxHp} color={colors.success} />
              <StatRow label="MP" value={characterData.mp} max={characterData.maxMp} color="#6366F1" />
              <StatRow label="EXP" value={characterData.exp} max={characterData.nextLevelExp} color={colors.warning ?? '#F59E0B'} />
            </div>

            <SectionHeader>Ability Scores</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Object.entries(characterData.abilities).map(([key, ability]) => (
                <div key={key} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.goldBorder}`, borderRadius: 7, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: colors.textMuted, fontFamily: fonts.display, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{key}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, fontFamily: fonts.display, lineHeight: 1 }}>{ability.score}</div>
                  <div style={{ fontSize: 12, color: ability.modifier >= 0 ? colors.success : colors.danger, marginTop: 3 }}>
                    {ability.modifier >= 0 ? "+" : ""}{ability.modifier}
                  </div>
                </div>
              ))}
            </div>

            <SectionHeader>Saving Throws</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Object.entries(characterData.savingThrows).map(([key, value]) => (
                <div key={key} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.goldBorder}`, borderRadius: 7, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: colors.textMuted, fontFamily: fonts.display, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{key}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: (value as unknown as number) >= 0 ? colors.success : colors.danger, fontFamily: fonts.display, lineHeight: 1 }}>
                    {(value as unknown as number) >= 0 ? "+" : ""}{value}
                  </div>
                </div>
              ))}
            </div>

            {characterData.skills?.length > 0 && (
              <>
                <SectionHeader>Skills</SectionHeader>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {characterData.skills.map((skill) => (
                    <div key={skill.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: "rgba(255,255,255,0.02)", border: `1px solid ${colors.goldBorder}`, borderRadius: 5 }}>
                      <div>
                        <span style={{ fontSize: 13, color: colors.textMuted, fontFamily: fonts.display }}>{skill.name}</span>
                        <span style={{ fontSize: 10, color: colors.muted, marginLeft: 6, fontFamily: fonts.body }}>({skill.ability})</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: (skill.modifier as unknown as number) >= 0 ? colors.success : colors.danger, fontFamily: fonts.display }}>
                        {(skill.modifier as unknown as number) >= 0 ? "+" : ""}{skill.modifier}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {characterData.items?.length > 0 && (
              <>
                <SectionHeader>Equipment</SectionHeader>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {characterData.items.map((item) => (
                    <div key={item.action.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: `1px solid ${colors.goldBorder}`, borderRadius: 7 }}>
                          <div style={{ width: 44, height: 44, flexShrink: 0, background: "rgba(0,0,0,0.4)", border: `1px solid ${colors.goldBorder}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={item.img} alt={item.action.name} style={{ width: 34, height: 34, imageRendering: "pixelated" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, fontFamily: fonts.display, marginBottom: 3 }}>{item.action.name}</div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>{item.action.type}</div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                        {[["Hit", item.action.hitDC], ["Dmg", item.action.damage]].map(([label, val]) => (
                          <div key={label as string} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 9, color: colors.textMuted, fontFamily: fonts.display, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: colors.goldMuted, fontFamily: fonts.display }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}