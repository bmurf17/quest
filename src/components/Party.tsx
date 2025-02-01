import React from "react";
import warrior from "../assets/Warrior.png";
import { CharacterData, tempChar } from "../types/Character";
import CharacterSheet from "./CharacterSheet";

interface Props {
  party: CharacterData[];
}

export default function Party({ party }: Props) {
  const [selectedCharacter, setSelectedCharacter] =
    React.useState<CharacterData>(tempChar);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleCharacterClick = (character: CharacterData) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  return (
    <>
      {party.map(
        (character: CharacterData, i: React.Key | null | undefined) => (
          <div
            key={i}
            className="bg-gray-900 rounded p-2 flex gap-2 hover:bg-slate-300 cursor-pointer"
            onClick={() => handleCharacterClick(character)}
          >
            <div className="w-12 h-12 bg-gray-700 rounded">
              <img className="w-12 h-12" src={warrior} alt={character.name} />
            </div>
            <div className="flex-1">
              <div className="text-sm">{character.name}</div>
              <div className="h-2 bg-gray-700 rounded mt-1">
                <div
                  className="h-full bg-green-500 rounded"
                  style={{
                    width: `${(character.hp / character.maxHp) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="h-2 bg-gray-700 rounded mt-1">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{
                    width: `${(character.mp / character.maxMp) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )
      )}

      <CharacterSheet
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        characterData={selectedCharacter}
      />
    </>
  );
}
