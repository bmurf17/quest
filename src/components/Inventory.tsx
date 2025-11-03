import { useGameStore } from "@/state/GameState";
import { Camp, Chest, NPC } from "@/types/RoomInteractions";

export default function Inventory() {
  const attack = useGameStore((state) => state.attack);
  const speak = useGameStore((state) => state.speak);
  const rest = useGameStore((state) => state.rest)
  const updateChest = useGameStore((state) => state.updateChest);
  const room = useGameStore((state) => state.room);

  return (
    <>
      {room && room.enemies.length > 0 ? (
        <button
          className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
          onClick={() => attack(room.enemies[0])}
        >
          Attack
        </button>
      ) : (
        <> </>
      )}
      {room && room.interaction?.type === "NPC" ? (
        <div
          className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
          onClick={() => {
            if (room && room.interaction?.type === "NPC") {
              speak(room?.interaction?.npc as NPC);
            }
          }}
        >
          Speak
        </div>
      ) : (
        <> </>
      )}
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
                    updateChest({ ...chest, quantity: 0 });
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
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>
      <div className="bg-gray-900 rounded"></div>
    </>
  );
}
