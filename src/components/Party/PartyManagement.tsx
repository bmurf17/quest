import { useState } from "react";
import { CharacterData } from "@/types/Character";
import { useGameStore, GameState } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { CharacterProvider } from "../CharacterCreation/CharacterContext";
import { CreateCharacterView } from "./management/CreateCharacterView";
import { ManagePartyView } from "./management/ManagePartyView";

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
        <div
          style={{
            display: "flex",
            height: "100vh",
            background: "#111009",
            fontFamily: fonts.body,
            color: colors.text,
            overflow: "hidden",
          }}
        >
          <CreateCharacterView onCreate={handleCreate} />
        </div>
      </CharacterProvider>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#111009",
        fontFamily: fonts.body,
        color: colors.text,
        overflow: "hidden",
      }}
    >
      <ManagePartyView
        party={localParty}
        setParty={setLocalParty}
        updateParty={updateParty}
      />
    </div>
  );
}
