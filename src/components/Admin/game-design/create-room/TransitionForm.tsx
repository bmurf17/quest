import { FieldGroup, StyledInput, StyledSelect } from "./primitives";

export function TransitionForm() {
  return (
    <>
      <FieldGroup id="destination" label="Destination">
        <StyledSelect id="destination" name="destination">
          <option value="next_dungeon">Next Dungeon</option>
          <option value="sanctuary">Sanctuary</option>
        </StyledSelect>
      </FieldGroup>
      <FieldGroup id="discoveryMessage" label="Discovery Message">
        <StyledInput
          id="discoveryMessage"
          name="discoveryMessage"
          placeholder="e.g. A dark archway hums with energy…"
        />
      </FieldGroup>
    </>
  );
}
