import { colors, fonts } from "@/theme";
import { icons } from "./icons";
import { Divider, FieldGroup, Label, StyledInput, StyledSelect } from "./primitives";
import { InteractionTabs } from "./InteractionTabs";
import { interactionColors } from "./interactionTypes";
import { NPCForm } from "./NPCForm";
import { CombatForm } from "./CombatForm";
import { ChestForm } from "./ChestForm";
import { CampForm } from "./CampForm";
import { TransitionForm } from "./TransitionForm";
import { defaultEnemy } from "./formTypes";
import type { Directions } from "@/types/Directions";
import type { useCreateRoomForm } from "./useCreateRoomForm";
import type { CSSProperties } from "react";

type CreateRoomFormState = ReturnType<typeof useCreateRoomForm>;

export function CreateRoomForm({ form }: { form: CreateRoomFormState }) {
  const {
    interaction,
    setInteraction,
    enemies,
    setEnemies,
    libraryEnemies,
    exits,
    addExit,
    removeExit,
    updateExit,
    handleSectionChange,
    selectedSectionId,
    isSubmitting,
    availableSections,
    enemyImgs,
    directionOptions,
    sectionRooms,
    handleSubmit,
  } = form;

  const usedDirections = new Set(exits.map((exit) => exit.direction));

  const directionsFor = (exit: CreateRoomFormState["exits"][number]) => {
    const target = sectionRooms.find((room) => room.id === exit.roomId);
    const targetDirections = new Set(
      target?.neighboringRooms.map(([direction]) => direction) ?? [],
    );
    return directionOptions.filter(
      ({ value }) =>
        value === exit.direction || (!usedDirections.has(value) && !targetDirections.has(value)),
    );
  };

  const handleTargetChange = (exit: CreateRoomFormState["exits"][number], roomId: number) => {
    const target = sectionRooms.find((room) => room.id === roomId);
    const targetDirections = new Set(
      target?.neighboringRooms.map(([direction]) => direction) ?? [],
    );
    const directionStillValid =
      !targetDirections.has(exit.direction) &&
      exits.filter((entry) => entry.direction === exit.direction).length <= 1;
    if (directionStillValid) {
      updateExit(exit.key, { roomId });
      return;
    }
    const nextDirection =
      directionOptions.find(
        ({ value }) => !targetDirections.has(value) && !usedDirections.has(value),
      )?.value ?? exit.direction;
    updateExit(exit.key, { roomId, direction: nextDirection });
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <Divider label="Room Identity" />

      <FieldGroup id="section" label="Section">
        <StyledSelect
          id="section"
          name="section"
          value={selectedSectionId ?? ""}
          onChange={(e) => {
            handleSectionChange(e.target.value ? Number(e.target.value) : null);
          }}
        >
          {availableSections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </StyledSelect>
      </FieldGroup>

      <FieldGroup id="name" label="Room Name">
        <StyledInput id="name" name="name" placeholder="e.g. The Whispering Crypt" required />
      </FieldGroup>

      <Divider label="Connections" />

      <p style={connectionsHintStyle}>
        Add one or more doorways. Each new exit is mirrored on the destination room.
      </p>

      <div style={exitListStyle}>
        {exits.map((exit, index) => (
          <div key={exit.key} style={exitRowStyle}>
            <FieldGroup id={`neighborRoom-${exit.key}`} label={`Exit ${index + 1}: room`}>
              <StyledSelect
                id={`neighborRoom-${exit.key}`}
                value={exit.roomId ?? ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    updateExit(exit.key, { roomId: null });
                    return;
                  }
                  handleTargetChange(exit, Number(e.target.value));
                }}
              >
                <option value="">Choose a room…</option>
                {sectionRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </StyledSelect>
            </FieldGroup>

            <FieldGroup id={`direction-${exit.key}`} label="Direction from that room">
              <StyledSelect
                id={`direction-${exit.key}`}
                value={exit.direction}
                onChange={(e) =>
                  updateExit(exit.key, { direction: Number(e.target.value) as Directions })
                }
              >
                {directionsFor(exit).map((direction) => (
                  <option key={direction.value} value={direction.value}>
                    {direction.label}
                  </option>
                ))}
              </StyledSelect>
            </FieldGroup>

            <button
              type="button"
              onClick={() => removeExit(exit.key)}
              disabled={exits.length <= 1}
              style={{
                ...removeExitButtonStyle,
                opacity: exits.length <= 1 ? 0.4 : 1,
                cursor: exits.length <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addExit}
        disabled={sectionRooms.length === 0}
        style={{
          ...addExitButtonStyle,
          opacity: sectionRooms.length === 0 ? 0.5 : 1,
          cursor: sectionRooms.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        + Add another exit
      </button>

      {sectionRooms.length === 0 && (
        <p style={connectionsHintStyle}>There are no rooms in this section to connect to yet.</p>
      )}

      <Divider label="Room Interaction" />

      <div style={{ marginBottom: 20 }}>
        <Label htmlFor="interaction">Type</Label>
        <InteractionTabs
          value={interaction}
          onChange={(v) => {
            setInteraction(v);
            if (v === "Combat" && enemies.length === 0) {
              setEnemies([defaultEnemy(enemyImgs)]);
            }
          }}
        />
      </div>

      {interaction !== "None" && (
        <div
          style={{
            background: "rgba(0,0,0,0.25)",
            border: `1px solid ${interactionColors[interaction]}33`,
            borderRadius: 8,
            padding: "20px 20px 4px",
            marginBottom: 8,
          }}
        >
          {/* Keep every interaction form mounted so typed values survive tab
              switches; disabled fieldsets are excluded from FormData. */}
          <fieldset disabled={interaction !== "NPC"} style={formFieldsetStyle}>
            <div style={{ display: interaction === "NPC" ? "block" : "none" }}>
              <NPCForm />
            </div>
          </fieldset>
          <fieldset disabled={interaction !== "Combat"} style={formFieldsetStyle}>
            <div style={{ display: interaction === "Combat" ? "block" : "none" }}>
              <CombatForm
                enemyImgs={enemyImgs}
                enemies={enemies}
                libraryEnemies={libraryEnemies}
                onChange={setEnemies}
              />
            </div>
          </fieldset>
          <fieldset disabled={interaction !== "Chest"} style={formFieldsetStyle}>
            <div style={{ display: interaction === "Chest" ? "block" : "none" }}>
              <ChestForm />
            </div>
          </fieldset>
          <fieldset disabled={interaction !== "Camp"} style={formFieldsetStyle}>
            <div style={{ display: interaction === "Camp" ? "block" : "none" }}>
              <CampForm />
            </div>
          </fieldset>
          <fieldset disabled={interaction !== "Transition"} style={formFieldsetStyle}>
            <div style={{ display: interaction === "Transition" ? "block" : "none" }}>
              <TransitionForm />
            </div>
          </fieldset>
        </div>
      )}

      <div style={createRoomFormStyle2}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 28px",
            background: isSubmitting
              ? "rgba(180,140,80,0.2)"
              : `linear-gradient(135deg, ${colors.gold} 0%, ${colors.gold} 50%, ${colors.gold} 100%)`,
            border: "none",
            borderRadius: 6,
            color: isSubmitting ? colors.muted : "#0d0b07",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: fonts.display,
            letterSpacing: "0.08em",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "opacity 0.2s, transform 0.1s",
            opacity: isSubmitting ? 0.6 : 1,
          }}
          onMouseDown={(e) => {
            if (!isSubmitting) e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <span style={{ color: isSubmitting ? colors.muted : "#0d0b07" }}>{icons.door}</span>
          {isSubmitting ? "Forging…" : "Forge Room"}
        </button>
      </div>
    </form>
  );
}

// Static style objects hoisted out of the render path.
const connectionsHintStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 12,
  lineHeight: 1.5,
  color: colors.muted,
};
const exitListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginBottom: 12,
};
const exitRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(140px, 0.7fr) auto",
  alignItems: "start",
  gap: 12,
  padding: "12px 12px 0",
  background: "rgba(0,0,0,0.2)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 8,
};
const removeExitButtonStyle: CSSProperties = {
  marginTop: 24,
  padding: "8px 12px",
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 6,
  color: "#FCA5A5",
  fontSize: 11,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const addExitButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "rgba(212,175,55,0.08)",
  border: `1px dashed ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 11,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
const createRoomFormStyle2: CSSProperties = {
  marginTop: 28,
  display: "flex",
  justifyContent: "flex-end",
};
const formFieldsetStyle: CSSProperties = {
  border: 0,
  margin: 0,
  padding: 0,
  minWidth: 0,
};
