import { useGameStore } from "@/state/GameState";
import { NPC } from "@/types/RoomInteractions";

export default function Inventory() {
  const attack = useGameStore((state) => state.attack);
  const speak = useGameStore((state) => state.speak);
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
        <div className="bg-gray-900 rounded hover:bg-gray-600 cursor-pointer flex justify-center items-center"
          onClick={() =>
            {if(room && room.interaction?.type === "NPC") {
              speak(room?.interaction?.npc as NPC)}
            }}
          >
          Speak
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
