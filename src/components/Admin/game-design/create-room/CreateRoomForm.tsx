import { startRoom } from "@/data/fixtures/rooms";
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
import type { useCreateRoomForm } from "./useCreateRoomForm";
import type { CSSProperties } from "react";

type CreateRoomFormState = ReturnType<typeof useCreateRoomForm>;

export function CreateRoomForm({ form }: { form: CreateRoomFormState }) {
  const {
    interaction,
    setInteraction,
    enemies,
    setEnemies,
    setNeighboringRoom,
    selectedSectionId,
    setSelectedSectionId,
    isSubmitting,
    availableSections,
    enemyImgs,
    directionOptions,
    sectionRooms,
    handleSubmit,
  } = form;

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <Divider label="Room Identity" />

      <FieldGroup id="section" label="Section">
        <StyledSelect
          id="section"
          name="section"
          value={selectedSectionId ?? ""}
          onChange={(e) => {
            setSelectedSectionId(e.target.value ? Number(e.target.value) : null);
            setNeighboringRoom(startRoom);
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

      <div style={createRoomFormStyle}>
        <FieldGroup id="neighboringRooms" label="Connect to room">
          <StyledSelect
            id="neighboringRooms"
            name="neighboringRooms"
            onChange={(e) => {
              const selected = sectionRooms.find((r) => r.name === e.target.value);
              if (selected) setNeighboringRoom(selected);
            }}
          >
            {sectionRooms.map((room, i) => (
              <option key={`${room.name}-${i}`} value={room.name}>
                {room.name}
              </option>
            ))}
          </StyledSelect>
        </FieldGroup>

        <FieldGroup id="direction" label="Direction from that room">
          <StyledSelect id="direction" name="direction">
            {directionOptions.map((d, i) => (
              <option key={d.label + i} value={d.value}>
                {d.label}
              </option>
            ))}
          </StyledSelect>
        </FieldGroup>
      </div>

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
              <CombatForm enemyImgs={enemyImgs} enemies={enemies} onChange={setEnemies} />
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
const createRoomFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 0,
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
