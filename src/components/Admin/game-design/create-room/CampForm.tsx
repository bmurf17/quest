import { colors } from "@/theme";
import { FieldGroup, Label, StyledInput } from "./primitives";
import type { CSSProperties } from "react";

export function CampForm() {
  return (
    <>
      <div style={campFormStyle}>
        <FieldGroup id="healAmount" label="Heal Amount">
          <StyledInput id="healAmount" name="healAmount" type="number" defaultValue={50} />
        </FieldGroup>
        <div>
          <Label htmlFor="restoresMana">Restores Mana</Label>
          <div style={campFormStyle2}>
            <input
              type="checkbox"
              id="restoresMana"
              name="restoresMana"
              value="true"
              style={campFormStyle3}
            />
            <label htmlFor="restoresMana" style={campFormStyle4}>
              Yes, restore mana on rest
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const campFormStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const campFormStyle2: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 12px",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(180,140,80,0.25)",
  borderRadius: 6,
  cursor: "pointer",
};
const campFormStyle3: CSSProperties = {
  width: 16,
  height: 16,
  accentColor: "#6366F1",
  cursor: "pointer",
};
const campFormStyle4: CSSProperties = {
  color: colors.text,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "'Crimson Text', Georgia, serif",
};
