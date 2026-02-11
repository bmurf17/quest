import { useState } from "react";
import { CharacterData, tempRanger } from "../types/Character";
import CharacterSheet from "./CharacterSheet";
import { useGameStore } from "@/state/GameState";

interface Props {
  party: CharacterData[];
}

export default function Party({ party }: Props) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData>(tempRanger);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isTargeting = useGameStore((state) => state.isTargeting);
  const targetingSpell = useGameStore((state) => state.targetingSpell);
  const castSpell = useGameStore((state) => state.castSpell);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);

  const handleCharacterClick = (character: CharacterData) => {
    if (isTargeting && targetingSpell && targetingSpell.effect.type === 'heal' && targetingSpell.effect.target === 'single') {
      if (!character.alive || character.hp <= 0) {
        return; 
      }
      
      castSpell(targetingSpell, character);
      setTargeting(false);
      setTargetingSpell(null);
    } else {
      setSelectedCharacter(character);
      setIsModalOpen(true);
    }
  };

  const isTargetingHeal = isTargeting && targetingSpell && targetingSpell.effect.type === 'heal' && targetingSpell.effect.target === 'single';

  return (
    <>
      {isTargetingHeal && (
        <div className="text-center  text-green-400 text-sm font-bold bg-black bg-opacity-70 rounded-lg px-4 py-2">
          💚 Select a party member to heal
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 w-full max-w-4xl mx-auto p-1 bg-black/20">
        {party.map((character, i) => (
          <div
            key={i}
            className={`flex flex-col sm:flex-row border-2 bg-[#1a1c23] transition-all ${
              !character.alive 
                ? "opacity-40 grayscale border-gray-600" 
                : isTargetingHeal
                ? "border-green-500 cursor-pointer hover:border-green-300 hover:brightness-125"
                : "border-gray-600 cursor-pointer hover:border-white"
            }`}
            onClick={() => handleCharacterClick(character)}
            style={{
              filter: isTargetingHeal && character.alive
                ? "drop-shadow(0 0 8px rgba(34,197,94,0.5))"
                : undefined
            }}
          >
            <div className="w-full sm:w-24 aspect-square bg-gray-800 flex-shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-gray-600">
              <img
                className="w-full h-full object-cover"
                style={{ imageRendering: "pixelated" }}
                src={character.img}
                alt={character.name}
              />
            </div>

            <div className="flex-1 flex flex-col justify-center p-2 gap-1 min-w-0">
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
    </>
  );
}