"use client";

import { useState } from "react";
import { CharacterData } from "../../types/Character";
import { useGameStore, GameState } from "@/state/GameState";
import { Link } from "react-router-dom";

interface PartyPickerProps {
  availableCharacters: CharacterData[];
}

export function PartySelection({ availableCharacters }: PartyPickerProps) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(availableCharacters[0] || null);
  const [party, setParty] = useState<CharacterData[]>(
    useGameStore((state: GameState) => state.party)
  );
  const updateParty = useGameStore((state: GameState) => state.setParty);

  const MAX_PARTY_SIZE = 3;

  const handleClassSelect = (character: CharacterData) => {
    setSelectedCharacter(character);
  };

  const handleAddToParty = () => {
    if (selectedCharacter && party.length < MAX_PARTY_SIZE) {
      const isDuplicate = party.some(
        (member) => member.class === selectedCharacter.class
      );

      if (!isDuplicate) {
        setParty([...party, selectedCharacter]);
      }
      updateParty([...party, selectedCharacter]);
    }
  };

  const handleRemoveFromParty = (index: number) => {
    setParty(party.filter((_, i) => i !== index));
    updateParty(party);
  };

  return (
    <div className="flex gap-4 h-screen p-4 bg-gray-100">
      <div className="w-64 flex flex-col gap-2 overflow-y-auto">
        <h2 className="text-xl font-bold    text-gray-800 mb-2">
          Choose Class
        </h2>
        {availableCharacters.map(
          (character: CharacterData, i: React.Key | null | undefined) => (
            <div
              key={i}
              onClick={() => {
                handleClassSelect(character);
              }}
              className="bg-gray-900 rounded p-2 flex gap-2 hover:bg-slate-300 cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-700 rounded">
                <img
                  style={{
                    width: "48px",
                    height: "48px",
                    imageRendering: "pixelated",
                    filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                  }}
                  src={character.img}
                  alt={character.name}
                />
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedCharacter ? (
          <div className="h-full">
            <div>
              <div className="flex flex-col gap-6 bg-gray-900 p-4 rounded-md">
                <div>
                  {" "}
                  <div className="text-blue-100 text-sm">
                    {selectedCharacter.race} • {selectedCharacter.class} • Level{" "}
                    {selectedCharacter.level}
                  </div>
                </div>
                <div className="flex justify-center">
                  <img
                    src={selectedCharacter.img || "/placeholder.svg"}
                    alt={selectedCharacter.name}
                    style={{
                      width: "128px",
                      height: "128px",
                      imageRendering: "pixelated",
                      filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600 font-semibold">
                      Health Points
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {selectedCharacter.hp} / {selectedCharacter.maxHp}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-semibold">
                      Mana Points
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {selectedCharacter.mp} / {selectedCharacter.maxMp}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-50 mb-3">
                    Ability Scores
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(selectedCharacter.abilities).map(
                      ([key, ability]) => (
                        <div
                          key={key}
                          className="bg-gray-50 p-3 rounded-lg text-center"
                        >
                          <div className="text-xs text-gray-600 uppercase font-semibold">
                            {key}
                          </div>
                          <div className="text-xl font-bold text-gray-800">
                            {ability.score}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ability.modifier >= 0 ? "+" : ""}
                            {ability.modifier}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-50 mb-3">Equipment</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedCharacter.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-3 rounded-lg flex items-center gap-3"
                      >
                        <img
                          src={item.img || "/placeholder.svg"}
                          alt={item.action.name}
                          style={{
                            width: "48px",
                            height: "48px",
                            imageRendering: "pixelated",
                            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-800">
                            {item.action.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.action.type}
                          </div>
                          <div className="text-xs text-gray-600">
                            Hit: {item.action.hitDC} • Dmg: {item.action.damage}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddToParty}
                  disabled={
                    party.length >= MAX_PARTY_SIZE ||
                    party.some(
                      (member) => member.class === selectedCharacter.class
                    )
                  }
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    party.length >= MAX_PARTY_SIZE ||
                    party.some(
                      (member) => member.class === selectedCharacter.class
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                  }`}
                >
                  {party.length >= MAX_PARTY_SIZE
                    ? "Party Full"
                    : party.some(
                        (member) => member.class === selectedCharacter.class
                      )
                    ? "Already in Party"
                    : "Add to Party"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a class to preview</p>
          </div>
        )}
      </div>

      <div className="w-80 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Your Party ({party.length}/{MAX_PARTY_SIZE})
          </h2>
        </div>

        {party.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">No party members yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Select a class and add them to your party
            </p>
          </div>
        ) : (
          <div>
            {party.map((member, index) => (
              <div key={index} className="relative bg-slate-300 rounded">
                <div className="bg-gray-900 p-2 flex gap-2">
                  <div className="text-white text-lg">{member.name}</div>
                  <div className="text-purple-100 text-xs flex items-center">
                    {member.class} • Lvl {member.level}
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex gap-3">
                    <img
                      src={member.img || "/placeholder.svg"}
                      alt={member.name}
                      style={{
                        width: "80px",
                        height: "480x",
                        imageRendering: "pixelated",
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">
                        HP: {member.hp}/{member.maxHp}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        MP: {member.mp}/{member.maxMp}
                      </div>
                      <button
                        onClick={() => handleRemoveFromParty(index)}
                        className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Link to="/game">
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  party.length >= MAX_PARTY_SIZE ||
                  "bg-green-600 text-white hover:bg-green-700 shadow-md mt-4"
                }`}
              >
                {"Start your adventure"}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
