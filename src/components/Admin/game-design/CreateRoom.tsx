import { supabase } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { Room, startRoom } from "@/types/Room";
import { useState } from "react";
import mushroom from "/images/Mushroom.png";
import blord from "/images/Blord.png";
import { NPCType } from "@/types/RoomInteractions";

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

const icons = {
  NPC: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={18}
      height={18}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  ),
  Chest: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={18}
      height={18}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  ),
  Camp: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={18}
      height={18}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
      />
    </svg>
  ),
  Combat: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={18}
      height={18}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
      />
    </svg>
  ),
  None: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={18}
      height={18}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  ),
  compass: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={16}
      height={16}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 0 1 3 12c0-1.348.294-2.628.816-3.774"
      />
    </svg>
  ),
  door: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={16}
      height={16}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      width={16}
      height={16}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  ),
  alert: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      width={16}
      height={16}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  ),
};


const Label = ({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#9CA3AF",
      marginBottom: 6,
      fontFamily: "'Cinzel', Georgia, serif",
    }}
  >
    {children}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(180,140,80,0.25)",
  borderRadius: 6,
  padding: "9px 12px",
  color: "#E8DCC8",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Crimson Text', Georgia, serif",
  transition: "border-color 0.2s",
};

const FieldGroup = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 16 }}>
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    style={{ ...inputStyle, ...props.style }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "rgba(180,140,80,0.25)";
    }}
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    style={{
      ...inputStyle,
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      backgroundSize: 16,
      paddingRight: 36,
      cursor: "pointer",
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "rgba(180,140,80,0.25)";
    }}
  />
);

const Divider = ({ label }: { label: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "20px 0 16px",
    }}
  >
    <div
      style={{
        flex: 1,
        height: 1,
        background:
          "linear-gradient(to right, transparent, rgba(180,140,80,0.3))",
      }}
    />
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#B4965A",
        fontFamily: "'Cinzel', Georgia, serif",
      }}
    >
      {label}
    </span>
    <div
      style={{
        flex: 1,
        height: 1,
        background:
          "linear-gradient(to left, transparent, rgba(180,140,80,0.3))",
      }}
    />
  </div>
);


const INTERACTION_TYPES = ["NPC", "Chest", "Camp", "Combat", "None"] as const;
type InteractionType = (typeof INTERACTION_TYPES)[number];

const interactionColors: Record<InteractionType, string> = {
  NPC: "#6366F1",
  Chest: "#D97706",
  Camp: "#059669",
  Combat: "#DC2626",
  None: "#6B7280",
};

function InteractionTabs({
  value,
  onChange,
}: {
  value: InteractionType;
  onChange: (v: InteractionType) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {INTERACTION_TYPES.map((type) => {
        const active = value === type;
        const color = interactionColors[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 6,
              border: active
                ? `1px solid ${color}`
                : "1px solid rgba(255,255,255,0.08)",
              background: active ? `${color}22` : "rgba(0,0,0,0.2)",
              color: active ? color : "#9CA3AF",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'Cinzel', Georgia, serif",
              letterSpacing: "0.03em",
            }}
          >
            <span style={{ color: active ? color : "#6B7280" }}>
              {icons[type]}
            </span>
            {type}
          </button>
        );
      })}
    </div>
  );
}

// ─── Interaction sub-forms ────────────────────────────────────────────────────

function NPCForm() {
  return (
    <>
      <FieldGroup id="npcName" label="NPC Name">
        <StyledInput
          id="npcName"
          name="npcName"
          placeholder="e.g. Old Thornwick"
        />
      </FieldGroup>
      <FieldGroup id="dialogue" label="Opening Dialogue">
        <StyledInput
          id="dialogue"
          name="dialogue"
          placeholder="What the NPC says first…"
        />
      </FieldGroup>
      <FieldGroup id="discoveryMessage" label="Discovery Message">
        <StyledInput
          id="discoveryMessage"
          name="discoveryMessage"
          placeholder="Shown when player enters room…"
        />
      </FieldGroup>
    </>
  );
}

function CombatForm({ enemyImgs }: { enemyImgs: string[] }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldGroup id="enemyName" label="Enemy Name">
            <StyledInput
              id="enemyName"
              name="enemyName"
              placeholder="e.g. Goblin Scout"
            />
          </FieldGroup>
        </div>
        <FieldGroup id="health" label="Health">
          <StyledInput
            id="health"
            name="health"
            type="number"
            defaultValue={100}
          />
        </FieldGroup>
        <FieldGroup id="enemyImg" label="Enemy Sprite">
          <StyledSelect id="enemyImg" name="enemyImg">
            {enemyImgs.map((img, i) => (
              <option key={i} value={img}>
                {img.split("/").pop()?.replace(".png", "") ?? img}
              </option>
            ))}
          </StyledSelect>
        </FieldGroup>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
      >
        <FieldGroup id="strength" label="Strength">
          <StyledInput
            id="strength"
            name="strength"
            type="number"
            defaultValue={10}
          />
        </FieldGroup>
        <FieldGroup id="dex" label="Dexterity">
          <StyledInput id="dex" name="dex" type="number" defaultValue={10} />
        </FieldGroup>
        <FieldGroup id="defense" label="Defense">
          <StyledInput
            id="defense"
            name="defense"
            type="number"
            defaultValue={10}
          />
        </FieldGroup>
      </div>
    </>
  );
}

function ChestForm() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldGroup id="itemId" label="Item ID">
            <StyledInput
              id="itemId"
              name="itemId"
              placeholder="e.g. item_health_potion"
            />
          </FieldGroup>
        </div>
        <FieldGroup id="quantity" label="Quantity">
          <StyledInput
            id="quantity"
            name="quantity"
            type="number"
            defaultValue={1}
          />
        </FieldGroup>
        <FieldGroup id="isLocked" label="Lock State">
          <StyledSelect id="isLocked" name="isLocked">
            <option value="false">Unlocked</option>
            <option value="true">Locked</option>
          </StyledSelect>
        </FieldGroup>
      </div>
    </>
  );
}

function CampForm() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FieldGroup id="healAmount" label="Heal Amount">
          <StyledInput
            id="healAmount"
            name="healAmount"
            type="number"
            defaultValue={50}
          />
        </FieldGroup>
        <div>
          <Label htmlFor="restoresMana">Restores Mana</Label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(180,140,80,0.25)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              id="restoresMana"
              name="restoresMana"
              value="true"
              style={{
                width: 16,
                height: 16,
                accentColor: "#6366F1",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="restoresMana"
              style={{
                color: "#E8DCC8",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'Crimson Text', Georgia, serif",
              }}
            >
              Yes, restore mana on rest
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Toast notification ────────────────────────────────────────────────────────

function Toast({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isSuccess = type === "success";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: isSuccess ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.15)",
        border: `1px solid ${isSuccess ? "rgba(5,150,105,0.5)" : "rgba(220,38,38,0.5)"}`,
        borderRadius: 8,
        padding: "12px 16px",
        color: isSuccess ? "#6EE7B7" : "#FCA5A5",
        fontSize: 14,
        backdropFilter: "blur(8px)",
        maxWidth: 360,
      }}
    >
      <span style={{ marginTop: 1 }}>
        {isSuccess ? icons.check : icons.alert}
      </span>
      <div
        style={{
          flex: 1,
          fontFamily: "'Crimson Text', Georgia, serif",
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          fontSize: 18,
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function ManageRooms() {
  const [interaction, setInteraction] = useState<InteractionType>("NPC");
  const [neighboringRoom, setNeighboringRoom] = useState(startRoom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const rooms = useGameStore((state) => state.rooms);
  const addRoom = useGameStore((state) => state.addRoom);
  const updateRoom = useGameStore((state) => state.updateRoom);

  const enemyImgs = [mushroom, blord];

  const directionOptions = Object.entries(Directions)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({ label: value as string, value: key }));

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

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

      if (interaction === "Combat") {
        const enemyName = formData.get("enemyName")?.toString() || "";
        const health = parseInt(formData.get("health")?.toString() || "100");
        const strength = parseInt(formData.get("strength")?.toString() || "10");
        const dex = parseInt(formData.get("dex")?.toString() || "10");
        const defense = parseInt(formData.get("defense")?.toString() || "10");
        const img = formData.get("enemyImg")?.toString() || "";

        const { data: enemyData, error: enemyError } = await supabase
          .from("enemies")
          .insert({ name: enemyName, health, strength, dex, defense, img })
          .select()
          .single();

        if (enemyError)
          throw new Error(`Failed to create enemy: ${enemyError.message}`);

        const { error: roomEnemyError } = await supabase
          .from("room_enemies")
          .insert({ room_id: newRoomId, enemy_id: enemyData.id });

        if (roomEnemyError)
          throw new Error(
            `Failed to link enemy to room: ${roomEnemyError.message}`,
          );
      } else if (interaction === "NPC") {
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
          .insert({ item_id: itemId, quantity, is_locked: isLocked })
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
          formData.get("healAmount")?.toString() || "50",
        );
        const restoresMana = formData.get("restoresMana") === "true";

        const { data: campData, error: campError } = await supabase
          .from("camps")
          .insert({ heal_amount: healAmount, restores_mana: restoresMana })
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
            `Failed to create reverse link: ${neighborError2.message}`,
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
                  NPCType: NPCType.GENERIC,
                  img: "",
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
      showToast("success", `"${roomName}" has been etched into the map.`);
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      console.error("Error creating room:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        select option { background: #1a1209; color: #E8DCC8; }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
          padding: "32px 24px 64px",
          fontFamily: "'Crimson Text', Georgia, serif",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto 32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 3,
                height: 28,
                background: "linear-gradient(to bottom, #D4AF37, transparent)",
                borderRadius: 2,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: "#E8DCC8",
                fontFamily: "'Cinzel', Georgia, serif",
                letterSpacing: "0.05em",
              }}
            >
              World Builder
            </h1>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 6,
                alignItems: "center",
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 20,
                padding: "4px 12px 4px 8px",
              }}
            >
              <span style={{ color: "#D4AF37" }}>{icons.compass}</span>
              <span
                style={{
                  fontSize: 12,
                  color: "#B4965A",
                  fontFamily: "'Cinzel', Georgia, serif",
                  letterSpacing: "0.08em",
                }}
              >
                {rooms.length} rooms
              </span>
            </div>
          </div>
          <p
            style={{
              margin: 0,
              color: "#6B7280",
              fontSize: 15,
              paddingLeft: 15,
            }}
          >
            Forge new chambers for adventurers to discover
          </p>
        </div>

        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(180,140,80,0.2)",
            borderRadius: 12,
            padding: 32,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              width: 20,
              height: 20,
              borderTop: "1px solid rgba(212,175,55,0.4)",
              borderLeft: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "2px 0 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 20,
              height: 20,
              borderTop: "1px solid rgba(212,175,55,0.4)",
              borderRight: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "0 2px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              width: 20,
              height: 20,
              borderBottom: "1px solid rgba(212,175,55,0.4)",
              borderLeft: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "0 0 0 2px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              width: 20,
              height: 20,
              borderBottom: "1px solid rgba(212,175,55,0.4)",
              borderRight: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "0 0 2px 0",
            }}
          />

          <form onSubmit={handleSubmit}>
            <Divider label="Room Identity" />

            <FieldGroup id="name" label="Room Name">
              <StyledInput
                id="name"
                name="name"
                placeholder="e.g. The Whispering Crypt"
                required
              />
            </FieldGroup>

            <Divider label="Connections" />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 0,
              }}
            >
              <FieldGroup id="neighboringRooms" label="Connect to room">
                <StyledSelect
                  id="neighboringRooms"
                  name="neighboringRooms"
                  onChange={(e) => {
                    const selected = rooms.find(
                      (r) => r.name === e.target.value,
                    );
                    if (selected) setNeighboringRoom(selected);
                  }}
                >
                  {rooms.map((room, i) => (
                    <option key={`${room.name}-${i}`} value={room.name}>
                      {room.name}
                    </option>
                  ))}
                </StyledSelect>
              </FieldGroup>

              <FieldGroup id="direction" label="Direction from that room">
                <StyledSelect id="direction" name="direction">
                  {directionOptions.map((d, i) => (
                    <option key={d.label + i} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </StyledSelect>
              </FieldGroup>
            </div>

            <Divider label="Room Interaction" />

            <div style={{ marginBottom: 20 }}>
              <Label htmlFor="interaction">Type</Label>
              <InteractionTabs value={interaction} onChange={setInteraction} />
            </div>

            {interaction !== "None" && (
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: `1px solid ${interactionColors[interaction]}33`,
                  borderRadius: 8,
                  padding: "20px 20px 4px",
                  marginBottom: 8,
                }}
              >
                {interaction === "NPC" && <NPCForm />}
                {interaction === "Combat" && (
                  <CombatForm enemyImgs={enemyImgs} />
                )}
                {interaction === "Chest" && <ChestForm />}
                {interaction === "Camp" && <CampForm />}
              </div>
            )}

            <div
              style={{
                marginTop: 28,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 28px",
                  background: isSubmitting
                    ? "rgba(180,140,80,0.2)"
                    : "linear-gradient(135deg, #B4965A 0%, #D4AF37 50%, #B4965A 100%)",
                  border: "none",
                  borderRadius: 6,
                  color: isSubmitting ? "#9CA3AF" : "#0d0b07",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Cinzel', Georgia, serif",
                  letterSpacing: "0.08em",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s, transform 0.1s",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onMouseDown={(e) => {
                  if (!isSubmitting)
                    e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span style={{ color: isSubmitting ? "#9CA3AF" : "#0d0b07" }}>
                  {icons.door}
                </span>
                {isSubmitting ? "Forging…" : "Forge Room"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
