import { FieldGroup, Label, StyledInput } from "./primitives";

export function CampForm() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FieldGroup id="healAmount" label="Heal Amount">
          <StyledInput
            id="healAmount"
            name="healAmount"
            type="number"
            defaultValue={50}
          />
        </FieldGroup>
        <div>
          <Label htmlFor="restoresMana">Restores Mana</Label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(180,140,80,0.25)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              id="restoresMana"
              name="restoresMana"
              value="true"
              style={{
                width: 16,
                height: 16,
                accentColor: "#6366F1",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="restoresMana"
              style={{
                color: "#E8DCC8",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'Crimson Text', Georgia, serif",
              }}
            >
              Yes, restore mana on rest
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
