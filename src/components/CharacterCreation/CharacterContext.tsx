import { createContext, useContext, useState, type ReactNode } from "react";

interface Character {
  name: string;
  origin: string;
  race: string;
  subrace: string;
  class: string;
  background: string;
  image: string;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    defense: number;
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
    name: "",
    origin: "",
    race: "",
    subrace: "",
    class: "",
    background: "",
    image: "",
    abilities: {
      strength: 8,
      dexterity: 8,
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
      defense: 8,
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
