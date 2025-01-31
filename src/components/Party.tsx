import React from "react";
import warrior from "../assets/Warrior.png";
import { Character } from "../types/Character";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  party: Character[];
}

export default function Party({ party }: Props) {
  const [selectedCharacter, setSelectedCharacter] =
    React.useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleCharacterClick = (character: Character) => {
    console.log("here");
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  return (
    <>
      {party.map((character: Character, i: React.Key | null | undefined) => (
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
      ))}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedCharacter && (
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedCharacter.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={warrior}
                  alt={selectedCharacter.name}
                  className="w-24 h-24 rounded bg-gray-700"
                />
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-400">HP</div>
                    <div className="h-2 bg-gray-700 rounded">
                      <div
                        className="h-full bg-green-500 rounded"
                        style={{
                          width: `${
                            (selectedCharacter.hp / selectedCharacter.maxHp) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm mt-1">
                      {selectedCharacter.hp} / {selectedCharacter.maxHp}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">MP</div>
                    <div className="h-2 bg-gray-700 rounded">
                      <div
                        className="h-full bg-blue-500 rounded"
                        style={{
                          width: `${
                            (selectedCharacter.mp / selectedCharacter.maxMp) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-sm mt-1">
                      {selectedCharacter.mp} / {selectedCharacter.maxMp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
