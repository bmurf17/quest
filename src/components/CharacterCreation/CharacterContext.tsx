import { createContext, useContext, useState, type ReactNode } from "react";

interface Character {
  origin: string;
  race: string;
  subrace: string;
  class: string;
  background: string;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

interface CharacterContextType {
  character: Character;
  updateCharacter: (field: string, value: any) => void;
}

export const CharacterContext = createContext<CharacterContextType | undefined>(
  undefined
);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = useState<Character>({
    origin: "",
    race: "",
    subrace: "",
    class: "",
    background: "",
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
  });

  const updateCharacter = (field: string, value: any) => {
    setCharacter((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <CharacterContext.Provider value={{ character, updateCharacter }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
}
