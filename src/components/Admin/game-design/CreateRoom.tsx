import { useGameStore } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { Room, startRoom } from "@/types/Room";
import { NPC } from "@/types/RoomInteractions";
import { useState } from "react";

export default function ManageRooms() {
  const [interaction, setInteraction] = useState("NPC");
  const [neighboringRoom, setNeighboringRoom] = useState(startRoom);
  const rooms = useGameStore((state) => state.rooms);
  const addRoom = useGameStore((state) => state.addRoom);
  const updateRoom = useGameStore((state) => state.updateRoom);

  const directionOptions = Object.entries(Directions)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({ label: value, value: key }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const npc: NPC = {
      name: formData.get("npcName")?.toString() || "",
      dialogue: [formData.get("dialogue")?.toString() || ""],
    };

    const room: Room = {
      name: name?.toString() || "",
      enemies: [],
      neighboringRooms: [],
      interaction: null,
      id: 0
    };

    if (interaction === "NPC") {
      room.interaction = {
        type: "NPC",
        npc: npc,
      };
    }

    var direction = formData.get("direction");
    if (direction) {
      neighboringRoom.neighboringRooms.push([+direction, room]);

      if (+direction === Directions.East) {
        room.neighboringRooms.push([Directions.West, neighboringRoom]);
      }

      if (+direction === Directions.West) {
        room.neighboringRooms.push([Directions.East, neighboringRoom]);
      }

      if (+direction === Directions.South) {
        room.neighboringRooms.push([Directions.North, neighboringRoom]);
      }

      if (+direction === Directions.North) {
        room.neighboringRooms.push([Directions.South, neighboringRoom]);
      }
    }

    addRoom(room);
    updateRoom(neighboringRoom);

    event.currentTarget.reset();
    setInteraction("NPC");
  };

  return (
    <main className="container mx-auto p-4 pb-0 h-full">
      <h2 className="text-3xl font-bold m-4 mb-6">Manage Rooms</h2>
      <div className="bg-gray-200 m-4 p-4 h-max text-black rounded-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold mb-6">Room Creation</h2>

          <div className="flex flex-col gap-2 ">
            <label htmlFor="name" className="font-bold">
              Name
            </label>
            <input
              id="name"
              name="name"
              className="border-slate-950 border rounded-md p-2"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-2 w-1/2">
              <label htmlFor="interaction" className="font-bold">
                Neighboring Rooms
              </label>
              <select
                id="neighboringRooms"
                name="neighboringRooms"
                onChange={(e) => {
                  const selectedRoom = rooms.find(
                    (room) => room.name === e.target.value
                  );
                  if (selectedRoom) {
                    setNeighboringRoom(selectedRoom);
                  }
                }}
                className="border-slate-950 border rounded-md p-2"
              >
                {rooms.map((room, i) => {
                  return (
                    <option key={`${room.name}-${i}`} value={room.name}>
                      {room.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <label htmlFor="interaction" className="font-bold">
                Direction Rooms
              </label>
              <select
                id="direction"
                name="direction"
                className="border-slate-950 border rounded-md p-2"
              >
                {directionOptions.map((direction, i) => {
                  return (
                    <option
                      key={direction.label + "" + i}
                      value={direction.value}
                    >
                      {direction.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 ">
            <label htmlFor="interaction" className="font-bold">
              Interaction
            </label>
            <select
              id="interaction"
              name="interaction"
              value={interaction}
              onChange={(e) => setInteraction(e.target.value)}
              className="border-slate-950 border rounded-md p-2"
            >
              <option value="NPC">NPC</option>
              <option value="Chest">Chest</option>
              <option value="Camp">Camp</option>
              <option value="None">None</option>
            </select>
          </div>

          <>
            {interaction === "NPC" ? (
              <>
                <div className="text-xl font-bold mb-2">NPC Form</div>

                <div className="flex flex-col gap-2 ">
                  <label htmlFor="npcName" className="font-bold">
                    Name
                  </label>
                  <input
                    id="npcName"
                    name="npcName"
                    className="border-slate-950 border rounded-md p-2"
                  />
                </div>

                <div className="flex flex-col gap-2 ">
                  <label htmlFor="dialogue" className="font-bold">
                    Dialogue
                  </label>
                  <input
                    id="dialogue"
                    name="dialogue"
                    className="border-slate-950 border rounded-md p-2"
                  />
                </div>

                <div className="flex flex-col gap-2 ">
                  <label htmlFor="discoveryMessage" className="font-bold">
                    Discover Message
                  </label>
                  <input
                    id="discoveryMessage"
                    name="discoveryMessage"
                    className="border-slate-950 border rounded-md p-2"
                  />
                </div>
              </>
            ) : (
              <></>
            )}
            {interaction === "Chest" ? <>Chest Form</> : <></>}
            {interaction === "Camp" ? <>Camp Form</> : <></>}
          </>

          <button
            type="submit"
            className="bg-amber-500 rounded-md mx-auto p-4 text-white"
          >
            Add Room
          </button>
        </form>
      </div>
    </main>
  );
}
