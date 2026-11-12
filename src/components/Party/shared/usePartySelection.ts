import { useState } from "react";
import type { CharacterData } from "@/types/Character";
import { useGameStore } from "@/state/GameState";

const MAX_PARTY_SIZE = 6;

export function usePartySelection(availableCharacters: CharacterData[]) {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(
    availableCharacters[0] || null,
  );
  const [party, setParty] = useState<CharacterData[]>(useGameStore((state) => state.party));
  const updateParty = useGameStore((state) => state.setParty);

  const isInParty = selectedCharacter
    ? party.some((m) => m.class === selectedCharacter.class)
    : false;
  const isPartyFull = party.length >= MAX_PARTY_SIZE;

  const handleAddToParty = () => {
    if (selectedCharacter && !isPartyFull && !isInParty) {
      const next = [...party, selectedCharacter];
      setParty(next);
      updateParty(next);
    }
  };

  const handleRemove = (index: number) => {
    const next = party.filter((_, i) => i !== index);
    setParty(next);
    updateParty(next);
  };

  return {
    selectedCharacter,
    setSelectedCharacter,
    party,
    isInParty,
    isPartyFull,
    handleAddToParty,
    handleRemove,
  };
}
