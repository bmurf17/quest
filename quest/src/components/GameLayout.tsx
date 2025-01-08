import React from "react";
import { GameState, useGameStore } from "../state/GameState";
import battleBackground from "../assets/portrait.png";
import { Character } from "../types/Character";

export default function GameLayout() {
  const activityLog = useGameStore((state: GameState) => state.activityLog);
  const party = useGameStore((state: GameState) => state.party);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">250</span>
          <span className="text-yellow-400">0</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              className="w-8 h-8 bg-gray-700 rounded-full hover:bg-gray-600"
            >
              {/* Icon placeholders */}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative bg-cover bg-center bg-battle-background overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-gray-900/75 p-2 rounded">Red Mushrhum</div>
          </div>
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="h-64 bg-gray-800 border-t border-gray-700 grid grid-cols-12 gap-2 p-2">
        {/* Activity Log */}
        <div className="col-span-4 bg-gray-900 rounded p-2">
          {activityLog.map((log, i) => (
            <div key={i} className="text-sm">
              {log}
            </div>
          ))}
        </div>

        {/* Party Status */}
        <div className="col-span-4 flex flex-col gap-2">
          {party.map(
            (character: Character, i: React.Key | null | undefined) => (
              <div key={i} className="bg-gray-900 rounded p-2 flex gap-2">
                <div className="w-12 h-12 bg-gray-700 rounded">
                  <img src={battleBackground} />
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

        {/* Inventory/Actions */}
        <div className="col-span-4 grid grid-cols-4 gap-2">
          <div className="bg-gray-900 rounded"></div>
          <div className="bg-gray-900 rounded"></div>
          <div className="bg-gray-900 rounded"></div>
          <div className="bg-gray-900 rounded"></div>
        </div>
      </div>
    </div>
  );
}
