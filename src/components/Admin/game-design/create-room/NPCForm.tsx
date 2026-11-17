import { colors, fonts } from "@/theme";
import { DialogueOutcomeType } from "@/types/RoomInteractions";
import { FieldGroup, Label, StyledInput, StyledSelect } from "./primitives";
import type {
  ExistingNpcOption,
  NpcSource,
  QuickDialogueChoiceEntry,
  QuickDialogueLineEntry,
} from "./formTypes";
import type { CSSProperties } from "react";

const OUTCOME_OPTIONS = Object.values(DialogueOutcomeType).map((value) => ({
  value,
  label: value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
}));

export function NPCForm({
  source,
  onSourceChange,
  existingNpcs,
  selectedNpcId,
  onSelectNpc,
  quickLines,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  onAddChoice,
  onRemoveChoice,
  onUpdateChoice,
}: {
  source: NpcSource;
  onSourceChange: (source: NpcSource) => void;
  existingNpcs: ExistingNpcOption[];
  selectedNpcId: number | null;
  onSelectNpc: (npcId: number | null) => void;
  quickLines: QuickDialogueLineEntry[];
  onAddLine: () => void;
  onRemoveLine: (lineKey: number) => void;
  onUpdateLine: (lineKey: number, text: string) => void;
  onAddChoice: (lineKey: number) => void;
  onRemoveChoice: (lineKey: number, choiceKey: number) => void;
  onUpdateChoice: (
    lineKey: number,
    choiceKey: number,
    values: Partial<QuickDialogueChoiceEntry>,
  ) => void;
}) {
  const selectedNpc = existingNpcs.find((npc) => npc.id === selectedNpcId) ?? null;

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <Label htmlFor="npcSource">NPC source</Label>
        <div style={sourceToggleStyle} role="group" aria-label="NPC source">
          <button
            type="button"
            onClick={() => onSourceChange("new")}
            aria-pressed={source === "new"}
            style={{
              ...sourceButtonStyle,
              ...(source === "new" ? sourceButtonActiveStyle : {}),
            }}
          >
            Create new
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("existing")}
            aria-pressed={source === "existing"}
            style={{
              ...sourceButtonStyle,
              ...(source === "existing" ? sourceButtonActiveStyle : {}),
            }}
          >
            Use existing ({existingNpcs.length})
          </button>
        </div>
      </div>

      {source === "existing" ? (
        <>
          <FieldGroup id="existingNpc" label="Existing NPC">
            <StyledSelect
              id="existingNpc"
              value={selectedNpcId ?? ""}
              onChange={(event) =>
                onSelectNpc(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Choose an NPC…</option>
              {existingNpcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.name} · {npc.npcType}
                  {npc.treeName ? ` · ${npc.treeName}` : " · no dialogue tree"}
                </option>
              ))}
            </StyledSelect>
          </FieldGroup>

          {existingNpcs.length === 0 && (
            <p style={hintStyle}>
              No NPCs exist yet. Switch to “Create new” to build one without leaving this page.
            </p>
          )}

          {selectedNpc && (
            <div style={previewStyle}>
              <div style={previewNameStyle}>{selectedNpc.name}</div>
              <div style={previewMetaStyle}>
                {selectedNpc.hasTree
                  ? `Branches from “${selectedNpc.treeName ?? "Untitled dialogue"}”. Edit it later on the Dialogues page.`
                  : "This NPC has no dialogue tree yet. Its opening lines will be used in the room."}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <FieldGroup id="npcName" label="NPC Name">
            <StyledInput id="npcName" name="npcName" placeholder="e.g. Old Thornwick" />
          </FieldGroup>
          <FieldGroup id="discoveryMessage" label="Discovery Message">
            <StyledInput
              id="discoveryMessage"
              name="discoveryMessage"
              placeholder="Shown when player enters room…"
            />
          </FieldGroup>

          <div style={builderHeaderStyle}>
            <div>
              <div style={builderTitleStyle}>Dialogue</div>
              <div style={builderSubtitleStyle}>
                Lines play in order. Add choices for player decisions; the last line ends the
                conversation.
              </div>
            </div>
            <span style={stepBadgeStyle}>{quickLines.length} lines</span>
          </div>

          <div style={lineListStyle}>
            {quickLines.map((line, index) => (
              <div key={line.key} style={lineCardStyle}>
                <div style={lineHeaderStyle}>
                  <span style={lineNumberStyle}>Line {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.key)}
                    disabled={quickLines.length <= 1}
                    style={{
                      ...removeButtonStyle,
                      opacity: quickLines.length <= 1 ? 0.4 : 1,
                      cursor: quickLines.length <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>

                <textarea
                  value={line.text}
                  onChange={(event) => onUpdateLine(line.key, event.target.value)}
                  placeholder={index === 0 ? "What the NPC says first…" : "Next line…"}
                  aria-label={`Dialogue line ${index + 1}`}
                  rows={2}
                  style={textareaStyle}
                />

                <div style={choicesHeaderStyle}>
                  <span style={choicesLabelStyle}>Player choices</span>
                  <button
                    type="button"
                    onClick={() => onAddChoice(line.key)}
                    style={addChoiceButtonStyle}
                  >
                    + Choice
                  </button>
                </div>

                {line.choices.length === 0 && index < quickLines.length - 1 && (
                  <p style={autoContinueStyle}>Auto “Continue” choice — no player input here.</p>
                )}

                {line.choices.map((choice) => (
                  <div key={choice.key} style={choiceCardStyle}>
                    <div style={choiceTopStyle}>
                      <input
                        value={choice.text}
                        onChange={(event) =>
                          onUpdateChoice(line.key, choice.key, { text: event.target.value })
                        }
                        placeholder="What the player can say…"
                        aria-label={`Choice text for line ${index + 1}`}
                        style={choiceInputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveChoice(line.key, choice.key)}
                        style={removeSmallButtonStyle}
                      >
                        ×
                      </button>
                    </div>
                    <StyledSelect
                      value={choice.outcomeType ?? "none"}
                      aria-label={`Choice outcome for line ${index + 1}`}
                      onChange={(event) =>
                        onUpdateChoice(line.key, choice.key, { outcomeType: event.target.value })
                      }
                    >
                      {OUTCOME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value === DialogueOutcomeType.NONE ? "No outcome" : option.label}
                        </option>
                      ))}
                    </StyledSelect>
                    {choice.outcomeType && choice.outcomeType !== "none" && (
                      <input
                        value={choice.outcomeValue ?? ""}
                        onChange={(event) =>
                          onUpdateChoice(line.key, choice.key, {
                            outcomeValue: event.target.value,
                          })
                        }
                        placeholder="Item, quest, or message"
                        aria-label={`Outcome value for line ${index + 1}`}
                        style={choiceInputStyle}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button type="button" onClick={onAddLine} style={addLineButtonStyle}>
            + Add dialogue line
          </button>

          <p style={hintStyle}>
            Need branches, skill checks, or flags? Create the room, then refine the tree on the
            Dialogues page.
          </p>
        </>
      )}
    </>
  );
}

// Static style objects hoisted out of the render path.
const sourceToggleStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 4,
  padding: 4,
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 7,
};
const sourceButtonStyle: CSSProperties = {
  padding: "8px 10px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 5,
  color: colors.muted,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
};
const sourceButtonActiveStyle: CSSProperties = {
  background: "rgba(99,102,241,0.16)",
  borderColor: "rgba(99,102,241,0.5)",
  color: "#C7D2FE",
};
const hintStyle: CSSProperties = {
  margin: "4px 0 14px",
  fontSize: 11,
  lineHeight: 1.5,
  color: colors.muted,
  fontStyle: "italic",
};
const previewStyle: CSSProperties = {
  padding: "10px 12px",
  marginBottom: 14,
  background: "rgba(99,102,241,0.07)",
  border: "1px solid rgba(99,102,241,0.25)",
  borderRadius: 6,
};
const previewNameStyle: CSSProperties = {
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
  marginBottom: 3,
};
const previewMetaStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.5,
  color: colors.muted,
};
const builderHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};
const builderTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#818CF8",
  fontFamily: fonts.display,
};
const builderSubtitleStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 11,
  lineHeight: 1.5,
  color: colors.muted,
  maxWidth: 420,
};
const stepBadgeStyle: CSSProperties = {
  flexShrink: 0,
  padding: "2px 8px",
  background: "rgba(99,102,241,0.1)",
  border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: 20,
  color: "#A5B4FC",
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
const lineListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginBottom: 10,
};
const lineCardStyle: CSSProperties = {
  padding: "10px 12px 12px",
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 8,
};
const lineHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};
const lineNumberStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#818CF8",
  fontFamily: fonts.display,
};
const removeButtonStyle: CSSProperties = {
  padding: "2px 8px",
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
};
const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 13,
  lineHeight: 1.5,
  fontFamily: fonts.body,
  resize: "vertical",
  outline: "none",
};
const choicesHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 10,
  marginBottom: 6,
};
const choicesLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.muted,
  fontFamily: fonts.display,
};
const addChoiceButtonStyle: CSSProperties = {
  padding: "2px 8px",
  background: "rgba(99,102,241,0.1)",
  border: "1px dashed rgba(99,102,241,0.4)",
  borderRadius: 4,
  color: "#A5B4FC",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const autoContinueStyle: CSSProperties = {
  margin: 0,
  fontSize: 10,
  color: "#6B7280",
  fontStyle: "italic",
};
const choiceCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "8px",
  marginTop: 6,
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
};
const choiceTopStyle: CSSProperties = { display: "flex", gap: 6 };
const choiceInputStyle: CSSProperties = {
  flex: 1,
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 9px",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 5,
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
  outline: "none",
};
const removeSmallButtonStyle: CSSProperties = {
  padding: "0 9px",
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 5,
  color: "#FCA5A5",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
};
const addLineButtonStyle: CSSProperties = {
  width: "100%",
  padding: "8px 14px",
  background: "rgba(99,102,241,0.08)",
  border: "1px dashed rgba(99,102,241,0.4)",
  borderRadius: 6,
  color: "#A5B4FC",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
};
