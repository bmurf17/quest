import { useGameStore } from "@/state/GameState";
import { Camp, Chest, NPC, NPCType } from "@/types/RoomInteractions";
import { CharacterData } from "@/types/Character";
import { useState } from "react";
import Inventory from "./Inventory";
import Shop from "./Shop";
import { manaPotion } from "@/types/Item";

export default function ActionMenu() {
  const attack = useGameStore((state) => state.attack);
  const speak = useGameStore((state) => state.speak);
  const rest = useGameStore((state) => state.rest);
  const updateChest = useGameStore((state) => state.updateChest);
  const takeFromChest = useGameStore((state) => state.takeFromChest);
  const index = useGameStore((state) => state.activeFighterIndex);
  const combatOrder = useGameStore((state) => state.combatOrder);
  const isFighterEnemy = useGameStore((state) => state.isCurrentFighterEnemy());
  const room = useGameStore((state) => state.room);
  const inventory = useGameStore((state) => state.inventory);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const openInventory = () => {
    setIsInventoryModalOpen(true);
  };

  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  const openShop = () => {
    setIsShopModalOpen(true);
  };

  return (
    <>
      {room && room.enemies.length > 0 ? (
        <>
          {isFighterEnemy ? (
            <></>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(combatOrder[index] as CharacterData).items.map(
                (item, index) => {
                  return (
                    <div
                      key={item.action.name + index}
                      className="bg-gray-700 rounded h-18 hover:bg-gray-600 cursor-pointer w-full flex items-center justify-center"
                      onClick={() => attack(room.enemies[0])}
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
              <div className="bg-gray-900 rounded h-18 w-full"></div>
              <div className="bg-gray-900 rounded h-18 w-full"></div>
              <div className="bg-gray-900 rounded h-18 w-full"></div>
              <div className="bg-gray-900 rounded h-18 w-full"></div>
            </div>
          )}
        </>
      ) : (
        <> </>
      )}
      {room && room.interaction?.type === "NPC" ? (
        <>
          <div
            className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center p-2 text-white"
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
