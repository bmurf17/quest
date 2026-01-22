import React from "react";

import { CharacterData, tempRanger } from "../types/Character";
import CharacterSheet from "./CharacterSheet";

interface Props {
  party: CharacterData[];
}

export default function Party({ party }: Props) {
  const [selectedCharacter, setSelectedCharacter] =
    React.useState<CharacterData>(tempRanger);
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
            className={`rounded p-2 flex gap-2 cursor-pointer ${
              character.alive
                ? "bg-gray-900 hover:bg-slate-300"
                : "bg-gray-800 opacity-60 cursor-not-allowed"
            }`}
            onClick={() => handleCharacterClick(character)}
          >
            <div className="w-12 h-12 bg-gray-700 rounded">
              <img
                className="w-12 h-12"
                style={{
                  imageRendering: "pixelated",
                  filter: character.alive
                    ? "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))"
                    : "grayscale(100%) drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                }}
                src={character.img}
                alt={character.name}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div className="text-sm">{character.name}</div>
                {!character.alive && (
                  <div className="text-xs text-red-500 font-bold">DOWNED</div>
                )}
              </div>
              <div className="h-2 bg-gray-700 rounded mt-1">
                <div
                  className={`h-full rounded ${
                    character.alive ? "bg-green-500" : "bg-gray-600"
                  }`}
                  style={{
                    width: `${(character.hp / character.maxHp) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="h-2 bg-gray-700 rounded mt-1">
                <div
                  className={`h-full rounded ${
                    character.alive ? "bg-blue-500" : "bg-gray-600"
                  }`}
                  style={{
                    width: `${(character.mp / character.maxMp) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ),
      )}

      <CharacterSheet
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        characterData={selectedCharacter}
      />
    </>
  );
}
