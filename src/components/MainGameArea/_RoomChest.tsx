import { GameState, useGameStore } from "@/state/GameState";
import closedChest from "../../assets/Closed-Chest.png";
import openChest from "../../assets/Open-Chest.png";


export default function RoomChest() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  console.log(currentRoom.interaction)
  return (
    <>
      {currentRoom && currentRoom.interaction?.type === "chest" ? (
        <div>
          {!currentRoom.interaction.chest.isOpen ? 
          (<img
            src={closedChest}
            alt="closed-chest"
            className="mx-auto"
            style={{
              width: "128px",
              height: "128px",
              imageRendering: "pixelated",
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
            }}
          />) : (<img
            src={openChest}
            alt="closed-chest"
            className="mx-auto"
            style={{
              width: "128px",
              height: "128px",
              imageRendering: "pixelated",
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
            }}
          />)}
          
          <div className="mt-4 text-white text-lg font-bold bg-black bg-opacity-50 rounded-lg px-4 py-2 inline-block">
            You find a chest!
          </div>
        </div>
      ) : (
        <> </>
      )}
    </>
  );
}
