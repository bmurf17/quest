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
    /* Grid layout: 3 columns to match the 3x2 party layout in the inspo */
    <div className="grid grid-cols-3 gap-1 w-full max-w-4xl mx-auto p-1 bg-black/20">
      {party.map((character, i) => (
        <div
          key={i}
          className={`flex flex-col sm:flex-row border-2 border-gray-600 bg-[#1a1c23] cursor-pointer transition-all hover:border-white ${
            !character.alive && "opacity-40 grayscale"
          }`}
          onClick={() => handleCharacterClick(character)}
        >
          {/* Square Portrait Section */}
          <div className="w-full sm:w-24 aspect-square bg-gray-800 flex-shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-gray-600">
            <img
              className="w-full h-full object-cover"
              style={{ imageRendering: "pixelated" }}
              src={character.img}
              alt={character.name}
            />
          </div>

          {/* Stats Section: Stacked vertically next to portrait */}
          <div className="flex-1 flex flex-col justify-center p-2 gap-1 min-w-0">
            {/* HP */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-mono leading-none mb-0.5">
                <span className="text-gray-400">HP</span>
                <span className="text-white">{character.hp}</span>
              </div>
              <div className="h-2 bg-gray-900 border border-gray-700">
                <div
                  className="h-full bg-emerald-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                  style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-[9px] text-right text-gray-500 mt-0.5">{character.maxHp}</div>
            </div>

            {/* MP */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-mono leading-none mb-0.5">
                <span className="text-gray-400">MP</span>
                <span className="text-white">{character.mp}</span>
              </div>
              <div className="h-2 bg-gray-900 border border-gray-700">
                <div
                  className="h-full bg-blue-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                  style={{ width: `${(character.mp / character.maxMp) * 100}%` }}
                />
              </div>
              <div className="text-[9px] text-right text-gray-500 mt-0.5">{character.maxMp}</div>
            </div>
          </div>
        </div>
      ))}

      <CharacterSheet
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        characterData={selectedCharacter}
      />
    </div>
  );
}