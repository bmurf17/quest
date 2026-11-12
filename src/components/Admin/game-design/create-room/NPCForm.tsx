import { FieldGroup, StyledInput } from "./primitives";

export function NPCForm() {
  return (
    <>
      <FieldGroup id="npcName" label="NPC Name">
        <StyledInput id="npcName" name="npcName" placeholder="e.g. Old Thornwick" />
      </FieldGroup>
      <FieldGroup id="dialogue" label="Opening Dialogue">
        <StyledInput id="dialogue" name="dialogue" placeholder="What the NPC says first…" />
      </FieldGroup>
      <FieldGroup id="discoveryMessage" label="Discovery Message">
        <StyledInput
          id="discoveryMessage"
          name="discoveryMessage"
          placeholder="Shown when player enters room…"
        />
      </FieldGroup>
    </>
  );
}
