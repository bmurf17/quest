import { supabase } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { Room, startRoom } from "@/types/Room";
import { useState } from "react";

const directionToDbEnum = (direction: Directions): string => {
  const map: { [key in Directions]: string } = {
    [Directions.North]: "North",
    [Directions.South]: "South",
    [Directions.East]: "East",
    [Directions.West]: "West",
  };
  return map[direction];
};

const getOppositeDirection = (direction: Directions): Directions => {
  const opposites: { [key in Directions]: Directions } = {
    [Directions.North]: Directions.South,
    [Directions.South]: Directions.North,
    [Directions.East]: Directions.West,
    [Directions.West]: Directions.East,
  };
  return opposites[direction];
};

export default function ManageRooms() {
  const [interaction, setInteraction] = useState("NPC");
  const [neighboringRoom, setNeighboringRoom] = useState(startRoom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const rooms = useGameStore((state) => state.rooms);
  const addRoom = useGameStore((state) => state.addRoom);
  const updateRoom = useGameStore((state) => state.updateRoom);

  const directionOptions = Object.entries(Directions)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({ label: value, value: key }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(event.currentTarget);
      const roomName = formData.get("name")?.toString() || "";
      const direction = formData.get("direction");

      const { data: newRoomData, error: roomError } = await supabase
        .from("rooms")
        .insert({ name: roomName })
        .select()
        .single();

      if (roomError)
        throw new Error(`Failed to create room: ${roomError.message}`);

      const newRoomId = newRoomData.id;

      if (interaction === "NPC") {
        const npcName = formData.get("npcName")?.toString() || "";
        const dialogue = formData.get("dialogue")?.toString() || "";
        const discoveryMessage =
          formData.get("discoveryMessage")?.toString() || "";

        const { data: npcData, error: npcError } = await supabase
          .from("npcs")
          .insert({
            name: npcName,
            dialogue: [dialogue],
            discovery_message: discoveryMessage,
          })
          .select()
          .single();

        if (npcError)
          throw new Error(`Failed to create NPC: ${npcError.message}`);

        const { error: interactionError } = await supabase
          .from("room_interactions")
          .insert({
            room_id: newRoomId,
            interaction_type: "NPC",
            npc_id: npcData.id,
          });

        if (interactionError)
          throw new Error(`Failed to link NPC: ${interactionError.message}`);
      } else if (interaction === "Chest") {
        const itemId = formData.get("itemId")?.toString() || "";
        const quantity = parseInt(formData.get("quantity")?.toString() || "1");
        const isLocked = formData.get("isLocked") === "true";

        const { data: chestData, error: chestError } = await supabase
          .from("chests")
          .insert({
            item_id: itemId,
            quantity: quantity,
            is_locked: isLocked,
          })
          .select()
          .single();

        if (chestError)
          throw new Error(`Failed to create chest: ${chestError.message}`);

        const { error: interactionError } = await supabase
          .from("room_interactions")
          .insert({
            room_id: newRoomId,
            interaction_type: "chest",
            chest_id: chestData.id,
          });

        if (interactionError)
          throw new Error(`Failed to link chest: ${interactionError.message}`);
      } else if (interaction === "Camp") {
        const healAmount = parseInt(
          formData.get("healAmount")?.toString() || "50"
        );
        const restoresMana = formData.get("restoresMana") === "true";

        const { data: campData, error: campError } = await supabase
          .from("camps")
          .insert({
            heal_amount: healAmount,
            restores_mana: restoresMana,
          })
          .select()
          .single();

        if (campError)
          throw new Error(`Failed to create camp: ${campError.message}`);

        const { error: interactionError } = await supabase
          .from("room_interactions")
          .insert({
            room_id: newRoomId,
            interaction_type: "camp",
            camp_id: campData.id,
          });

        if (interactionError)
          throw new Error(`Failed to link camp: ${interactionError.message}`);
      }

      if (direction && neighboringRoom.id) {
        const directionEnum = +direction;
        const oppositeDirectionEnum = getOppositeDirection(directionEnum);

        const { error: neighborError1 } = await supabase
          .from("neighboring_rooms")
          .insert({
            room_id: neighboringRoom.id,
            neighbor_room_id: newRoomId,
            direction: directionToDbEnum(directionEnum),
          });

        if (neighborError1)
          throw new Error(`Failed to link rooms: ${neighborError1.message}`);

        const { error: neighborError2 } = await supabase
          .from("neighboring_rooms")
          .insert({
            room_id: newRoomId,
            neighbor_room_id: neighboringRoom.id,
            direction: directionToDbEnum(oppositeDirectionEnum),
          });

        if (neighborError2)
          throw new Error(
            `Failed to create reverse link: ${neighborError2.message}`
          );
      }

      const room: Room = {
        name: roomName,
        enemies: [],
        neighboringRooms: [],
        interaction:
          interaction === "NPC"
            ? {
                type: "NPC",
                npc: {
                  name: formData.get("npcName")?.toString() || "",
                  dialogue: [formData.get("dialogue")?.toString() || ""],
                  discoveryMessage:
                    formData.get("discoveryMessage")?.toString() || "",
                },
              }
            : null,
        id: newRoomId,
      };

      if (direction) {
        const directionEnum = +direction;
        const oppositeDirectionEnum = getOppositeDirection(directionEnum);

        neighboringRoom.neighboringRooms.push([directionEnum, room]);
        room.neighboringRooms.push([oppositeDirectionEnum, neighboringRoom]);

        updateRoom(neighboringRoom);
      }

      addRoom(room);
      //updateRoom(neighboringRoom);

      setSuccess(`Room "${roomName}" created successfully!`);
      //event.currentTarget.reset();
      //setInteraction("NPC");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error creating room:", err);
    } finally {
      setIsSubmitting(false);
    }
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
            {interaction === "Camp" ? (
              <>
                <div className="text-xl font-bold mb-2">Camp Form</div>

                <div className="flex flex-col gap-2 ">
                  <label htmlFor="healAmount" className="font-bold">
                    Heal Amount
                  </label>
                  <input
                    id="healAmount"
                    name="healAmount"
                    className="border-slate-950 border rounded-md p-2"
                    type="number"
                  />
                </div>

                <div className="flex gap-2 ">
                  <label htmlFor="restoresMana" className="font-bold">
                    Restore Mana
                  </label>
                  <input
                    type="checkbox"
                    id="restoresMana"
                    name="restoresMana"
                    className="w-6 h-6 rounded border-slate-950"
                  />
                </div>
              </>
            ) : (
              <></>
            )}
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
