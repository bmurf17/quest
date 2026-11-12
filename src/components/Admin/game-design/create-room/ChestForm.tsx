import { FieldGroup, StyledInput, StyledSelect } from "./primitives";
import type { CSSProperties } from "react";

export function ChestForm() {
  return (
    <>
      <div style={chestFormStyle}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldGroup id="itemId" label="Item ID">
            <StyledInput id="itemId" name="itemId" placeholder="e.g. item_health_potion" />
          </FieldGroup>
        </div>
        <FieldGroup id="quantity" label="Quantity">
          <StyledInput id="quantity" name="quantity" type="number" defaultValue={1} />
        </FieldGroup>
        <FieldGroup id="isLocked" label="Lock State">
          <StyledSelect id="isLocked" name="isLocked">
            <option value="false">Unlocked</option>
            <option value="true">Locked</option>
          </StyledSelect>
        </FieldGroup>
      </div>
    </>
  );
}

// Static style objects hoisted out of the render path.
const chestFormStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
