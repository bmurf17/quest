import { useState } from "react";
import type { CharacterData } from "@/types/Character";
import type { GameState } from "@/state/GameState";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { CharacterProvider } from "@/components/CharacterCreation/CharacterContext";
import { CreateCharacterView } from "./management/CreateCharacterView";
import { ManagePartyView } from "./management/ManagePartyView";
import type { CSSProperties } from "react";

export function PartyManagement() {
  const party = useGameStore((state: GameState) => state.party);
  const setParty = useGameStore((state: GameState) => state.setParty);
  const [localParty, setLocalParty] = useState<CharacterData[]>(party);

  const updateParty = (chars: CharacterData[]) => {
    setLocalParty(chars);
    setParty(chars);
  };

  const handleCreate = (char: CharacterData) => {
    updateParty([char]);
  };

  if (localParty.length === 0) {
    return (
      <CharacterProvider>
        <div style={partyManagementStyle}>
          <CreateCharacterView onCreate={handleCreate} />
        </div>
      </CharacterProvider>
    );
  }

  return (
    <div style={partyManagementStyle2}>
      <ManagePartyView party={localParty} setParty={setLocalParty} updateParty={updateParty} />
    </div>
  );
}

// Static style objects hoisted out of the render path.
const partyManagementStyle: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#111009",
  fontFamily: fonts.body,
  color: colors.text,
  overflow: "hidden",
};
const partyManagementStyle2: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#111009",
  fontFamily: fonts.body,
  color: colors.text,
  overflow: "hidden",
};
