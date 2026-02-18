import { useGameStore } from "@/state/GameState";
import { Camp, Chest, NPC, NPCType } from "@/types/RoomInteractions";
import { CharacterData } from "@/types/Character";
import { useState } from "react";
import Inventory from "./Inventory";
import Shop from "./Shop";
import { manaPotion } from "@/types/Item";
import { Spell } from "@/types/Spell";

export default function ActionMenu() {
  const attack = useGameStore((state) => state.attack);
  const speak = useGameStore((state) => state.speak);
  const rest = useGameStore((state) => state.rest);
  const updateChest = useGameStore((state) => state.updateChest);
  const takeFromChest = useGameStore((state) => state.takeFromChest);
  const castSpell = useGameStore((state) => state.castSpell);
  const setTargeting = useGameStore((state) => state.setTargeting);
  const setTargetingSpell = useGameStore((state) => state.setTargetingSpell);
  const index = useGameStore((state) => state.activeFighterIndex);
  const combatOrder = useGameStore((state) => state.combatOrder);
  const isFighterEnemy = useGameStore((state) => state.isCurrentFighterEnemy());
  const room = useGameStore((state) => state.room);
  const inventory = useGameStore((state) => state.inventory);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  const openInventory = () => {
    setIsInventoryModalOpen(true);
  };

  const openShop = () => {
    setIsShopModalOpen(true);
  };

  const handleAttackClick = () => {
    if (room.enemies.length === 1) {
      attack(room.enemies[0]);
    } else {
      setTargeting(true);
      setTargetingSpell(null); 
    }
  };

  const handleSpellClick = (spell: Spell) => {
    const currentCaster = combatOrder[index] as CharacterData;
    
    if (currentCaster.mp < spell.manaCost) {
      return;
    }

    if (spell.effect.type === 'damage') {
      if (spell.effect.target === 'single') {
        if (room.enemies.length === 1) {
          castSpell(spell, room.enemies[0]);
        } else {
          setTargeting(true);
          setTargetingSpell(spell);
        }
      } else if (spell.effect.target === 'all') {
        castSpell(spell);
      }
    } else if (spell.effect.type === 'heal') {
      if (spell.effect.target === 'single') {
        setTargeting(true);
        setTargetingSpell(spell);
      } else if (spell.effect.target === 'party') {
        castSpell(spell);
      }
    }
  };

  return (
    <>
      {room && room.enemies.length > 0 ? (
        <>
          {isFighterEnemy ? (
            <></>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(combatOrder[index] as CharacterData)?.items.map(
                (item, itemIndex) => {
                  return (
                    <div
                      key={item.action.name + itemIndex}
                      className="bg-gray-700 rounded h-18 hover:bg-gray-600 cursor-pointer w-full flex items-center justify-center"
                      onClick={handleAttackClick}
                    >
                      <img
                        src={item.img}
                        alt={item.action.name}
                        className="w-12x h-12"
                        style={{
                          imageRendering: "pixelated",
                        }}
                      />
                    </div>
                  );
                },
              )}
              {(combatOrder[index] as CharacterData)?.spells.map(
                (spell, spellIndex) => {
                  const currentCaster = combatOrder[index] as CharacterData;
                  const notEnoughMana = currentCaster.mp < spell.manaCost;
                  
                  return (
                    <div
                      key={spell.name + spellIndex}
                      className={`rounded h-18 w-full flex items-center justify-center relative ${
                        notEnoughMana 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                      }`}
                      onClick={() => !notEnoughMana && handleSpellClick(spell)}
                      title={`${spell.name} (${spell.manaCost} MP) - ${spell.description}`}
                    >
                      <img
                        src={spell.image}
                        alt={spell.name}
                        className="w-12x h-12"
                        style={{
                          imageRendering: "pixelated",
                        }}
                      />
                      <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                        {spell.manaCost}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </>
      ) : (
        <> </>
      )}
      {room && room.interaction?.type === "NPC" ? (
        <>
          <div
            className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center p-2 text-white text-center"
            onClick={() => {
              if (room && room.interaction?.type === "NPC") {
                speak(room.interaction.npc as NPC);
              }
            }}
          >
            {useGameStore.getState().dialogueIndex <
            room.interaction.npc.dialogue.length - 1
              ? "Continue Dialogue"
              : "Speak"}
          </div>

          {room.interaction.npc.NPCType === NPCType.MERCHANT && (
            <div
              className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center p-2 text-white"
              onClick={() => openShop()}
            >
              Shop
            </div>
          )}
        </>
      ) : null}
      {room && room.interaction?.type === "chest" ? (
        <>
          {!room.interaction.chest.isOpen ? (
            <div
              className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
              onClick={() => {
                if (room && room.interaction?.type === "chest") {
                  const chest = room?.interaction?.chest as Chest;
                  updateChest({ ...chest, isOpen: true });
                }
              }}
            >
              Open
            </div>
          ) : room.interaction.chest.quantity === 0 ? (
            <div
              className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
              onClick={() => {
                if (room && room.interaction?.type === "chest") {
                  const chest = room?.interaction?.chest as Chest;
                  updateChest({ ...chest, isOpen: false });
                }
              }}
            >
              Close
            </div>
          ) : (
            <>
              <div
                className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
                onClick={() => {
                  if (room && room.interaction?.type === "chest") {
                    const chest = room?.interaction?.chest as Chest;
                    updateChest({ ...chest, isOpen: false });
                  }
                }}
              >
                Close
              </div>
              <div
                className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
                onClick={() => {
                  if (room && room.interaction?.type === "chest") {
                    const chest = room?.interaction?.chest as Chest;
                    takeFromChest({ ...chest, quantity: 0 });
                  }
                }}
              >
                Take
              </div>
            </>
          )}
        </>
      ) : (
        <> </>
      )}
      {room && room.interaction?.type === "camp" ? (
        <div
          className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
          onClick={() => {
            if (room && room.interaction?.type === "camp") {
              rest(room?.interaction?.camp as Camp);
            }
          }}
        >
          Rest
        </div>
      ) : (
        <> </>
      )}
      <div
        className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
        onClick={openInventory}
      >
        Inventory
      </div>
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>

      <Inventory
        isOpen={isInventoryModalOpen}
        onOpenChange={setIsInventoryModalOpen}
        inventory={inventory}
      />

      <Shop
        isOpen={isShopModalOpen}
        onOpenChange={setIsShopModalOpen}
        inventory={[manaPotion]}
        ownersName={
          room && room.interaction?.type === "NPC"
            ? room.interaction.npc.name
            : "Shopkeeper"
        }
      />
    </>
  );
}