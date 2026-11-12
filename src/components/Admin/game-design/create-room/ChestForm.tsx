import { FieldGroup, StyledInput, StyledSelect } from "./primitives";

export function ChestForm() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldGroup id="itemId" label="Item ID">
            <StyledInput
              id="itemId"
              name="itemId"
              placeholder="e.g. item_health_potion"
            />
          </FieldGroup>
        </div>
        <FieldGroup id="quantity" label="Quantity">
          <StyledInput
            id="quantity"
            name="quantity"
            type="number"
            defaultValue={1}
          />
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
