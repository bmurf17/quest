import { useGameStore } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { Room } from "@/types/Room";
import React, { useState, useRef, useEffect } from "react";
import { colors, fonts } from "../../../theme";

const MAX_DEPTH = 5;
const ROOM_DISTANCE = 160;
const CONTAINER_PADDING = 250;

const interactionConfig: Record<
  string,
  { color: string; bg: string; border: string; label: string; icon: string }
> = {
  NPC:    { color: "#818CF8", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.45)", label: "NPC", icon: "👤" },
  chest:  { color: "#F59E0B", bg: "rgba(217,119,6,0.15)",  border: "rgba(217,119,6,0.45)",  label: "Chest", icon: "📦" },
  camp:   { color: "#34D399", bg: "rgba(5,150,105,0.15)",  border: "rgba(5,150,105,0.45)",  label: "Camp", icon: "🔥" },
  Combat: { color: "#F87171", bg: "rgba(220,38,38,0.15)",  border: "rgba(220,38,38,0.45)",  label: "Combat", icon: "⚔️" },
  none:   { color: "#9CA3AF", bg: "rgba(255,255,255,0.04)", border: "rgba(180,140,80,0.2)", label: "Empty", icon: "◇" },
};

const getInteractionKey = (room: Room): string => {
  if (room.interaction) return room.interaction.type;
  if (room.enemies?.length > 0) return "Combat";
  return "none";
};

// ─── Direction helpers ────────────────────────────────────────────────────────

const getDirectionOffset = (direction: Directions, distance = ROOM_DISTANCE) => {
  switch (direction) {
    case Directions.North: return { x: 0, y: -distance };
    case Directions.South: return { x: 0, y: distance };
    case Directions.East:  return { x: distance, y: 0 };
    case Directions.West:  return { x: -distance, y: 0 };
    default:               return { x: 0, y: 0 };
  }
};

const directionLabel = (direction: Directions): string => {
  switch (direction) {
    case Directions.North: return "N";
    case Directions.South: return "S";
    case Directions.East:  return "E";
    case Directions.West:  return "W";
    default:               return "?";
  }
};

// ─── SVG connector lines ──────────────────────────────────────────────────────

interface ConnectorProps {
  x1: number; y1: number;
  x2: number; y2: number;
  direction: Directions;
}

const ROOM_W = 96;
const ROOM_H = 40;

const Connector = ({ x1, y1, x2, y2, direction }: ConnectorProps) => {
  // Offset from node centre to edge
  const isVertical = direction === Directions.North || direction === Directions.South;
  const sx = x1 + ROOM_W / 2 + (isVertical ? 0 : direction === Directions.East ? ROOM_W / 2 : -ROOM_W / 2);
  const sy = y1 + ROOM_H / 2 + (!isVertical ? 0 : direction === Directions.South ? ROOM_H / 2 : -ROOM_H / 2);
  const ex = x2 + ROOM_W / 2 + (isVertical ? 0 : direction === Directions.East ? -ROOM_W / 2 : ROOM_W / 2);
  const ey = y2 + ROOM_H / 2 + (!isVertical ? 0 : direction === Directions.South ? -ROOM_H / 2 : ROOM_H / 2);

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  return (
    <g>
  <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="rgba(180,140,80,0.15)" strokeWidth={1.5} />
  <circle cx={mx} cy={my} r={3} fill="rgba(180,140,80,0.3)" />
  <text
        x={mx + (isVertical ? 5 : 0)}
        y={my + (!isVertical ? -4 : 0)}
  fill="rgba(180,140,80,0.5)"
  fontSize={9}
  fontFamily={fonts.display}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {directionLabel(direction)}
      </text>
    </g>
  );
};

interface ConnectorLayerProps {
  room: Room;
  x: number;
  y: number;
  visitedRooms: Set<string>;
  depth?: number;
}

function ConnectorLayer({ room, x, y, visitedRooms, depth = 0 }: ConnectorLayerProps) {
  if (depth >= MAX_DEPTH) return null;
  const newVisited = new Set([...visitedRooms, room.name]);

  return (
    <>
      {room.neighboringRooms?.map(([direction, neighbor]: any, i: number) => {
        if (newVisited.has(neighbor.name)) return null;
        const offset = getDirectionOffset(direction);
        const nx = x + offset.x;
        const ny = y + offset.y;
        return (
          <React.Fragment key={`conn-${neighbor.name}-${i}`}>
            <Connector x1={x} y1={y} x2={nx} y2={ny} direction={direction} />
            <ConnectorLayer room={neighbor} x={nx} y={ny} visitedRooms={newVisited} depth={depth + 1} />
          </React.Fragment>
        );
      })}
    </>
  );
}

interface RoomNodeProps {
  room: Room;
  x: number;
  y: number;
  visitedRooms: Set<string>;
  depth?: number;
  onRoomClick: (room: Room) => void;
  isStart?: boolean;
}

const RoomNode = React.memo(({ room, x, y, visitedRooms, depth = 0, onRoomClick, isStart }: RoomNodeProps) => {
  const [hovered, setHovered] = useState(false);
  const key = getInteractionKey(room);
  const cfg = interactionConfig[key] ?? interactionConfig.none;
  const newVisited = new Set([...visitedRooms, room.name]);

  return (
    <>
      <div
        onClick={(e) => { e.stopPropagation(); onRoomClick(room); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
  style={{
          position: "absolute",
          left: x,
          top: y,
          width: ROOM_W,
          height: ROOM_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1,
          background: hovered ? cfg.bg : isStart ? "rgba(212,175,55,0.12)" : "rgba(13,11,7,0.85)",
          border: `1px solid ${isStart ? "rgba(212,175,55,0.6)" : cfg.border}`,
          borderRadius: 6,
          cursor: "pointer",
          transition: "all 0.15s",
          transform: hovered ? "scale(1.06)" : "scale(1)",
          boxShadow: hovered ? `0 0 12px ${cfg.color}44` : "none",
          zIndex: hovered ? 10 : 1,
        }}
      >
        <span style={{
          fontSize: 10,
          fontFamily: fonts.display,
          color: isStart ? colors.gold : cfg.color,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textAlign: "center",
          padding: "0 6px",
          lineHeight: 1.3,
          overflow: "hidden",
          maxWidth: "100%",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {room.name}
        </span>
        {key !== "none" && (
          <span style={{ fontSize: 9, color: cfg.color, opacity: 0.7, fontFamily: fonts.display, letterSpacing: "0.05em" }}>
            {cfg.label}
          </span>
        )}
        {isStart && (
          <div style={{
            position: "absolute",
            top: -8,
            left: "50%",
            transform: "translateX(-50%)",
            background: colors.gold,
            color: "#0d0b07",
            fontSize: 7,
            fontFamily: fonts.display,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "1px 6px",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}>
            START
          </div>
        )}
      </div>

      {depth < MAX_DEPTH &&
        room.neighboringRooms?.map(([direction, neighbor]: any, i: number) => {
          if (newVisited.has(neighbor.name)) return null;
          const offset = getDirectionOffset(direction);
          return (
            <RoomNode
              key={`${neighbor.name}-${i}`}
              room={neighbor}
              x={x + offset.x}
              y={y + offset.y}
              visitedRooms={newVisited}
              depth={depth + 1}
              onRoomClick={onRoomClick}
            />
          );
        })}
    </>
  );
});

const calculateBounds = (room: Room, visited = new Set<string>(), x = 0, y = 0, depth = 0): { minX: number; maxX: number; minY: number; maxY: number } => {
  if (depth >= MAX_DEPTH || visited.has(room.name)) return { minX: x, maxX: x, minY: y, maxY: y };
  const newVisited = new Set([...visited, room.name]);
  let bounds = { minX: x, maxX: x, minY: y, maxY: y };
  room.neighboringRooms?.forEach(([direction, neighbor]) => {
    if (!newVisited.has(neighbor.name)) {
      const offset = getDirectionOffset(direction);
      const child = calculateBounds(neighbor, newVisited, x + offset.x, y + offset.y, depth + 1);
      bounds = {
        minX: Math.min(bounds.minX, child.minX),
        maxX: Math.max(bounds.maxX, child.maxX),
        minY: Math.min(bounds.minY, child.minY),
        maxY: Math.max(bounds.maxY, child.maxY),
      };
    }
  });
  return bounds;
};

function RoomPopup({ room, onClose }: { room: Room; onClose: () => void }) {
  const key = getInteractionKey(room);
  const cfg = interactionConfig[key] ?? interactionConfig.none;

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid rgba(180,140,80,0.1)" }}>
        <span style={{ fontSize: 11, color: colors.muted, fontFamily: fonts.display, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 14, color: colors.text, fontFamily: fonts.body }}>{value}</span>
      </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
          border: `1px solid ${cfg.border}`,
          borderRadius: 12,
          padding: 28,
          width: 340,
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
          fontFamily: "'Crimson Text', Georgia, serif",
        }}
      >
        {["tl","tr","bl","br"].map(pos => (
          <div key={pos} style={{
            position: "absolute",
            ...(pos.includes("t") ? { top: 10 } : { bottom: 10 }),
            ...(pos.includes("l") ? { left: 10 } : { right: 10 }),
            width: 14, height: 14,
            borderTop: pos.includes("t") ? `1px solid rgba(212,175,55,0.35)` : "none",
            borderBottom: pos.includes("b") ? `1px solid rgba(212,175,55,0.35)` : "none",
            borderLeft: pos.includes("l") ? `1px solid rgba(212,175,55,0.35)` : "none",
            borderRight: pos.includes("r") ? `1px solid rgba(212,175,55,0.35)` : "none",
          }} />
        ))}

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 2, height: 18, background: cfg.color, borderRadius: 1 }} />
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#E8DCC8", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.04em" }}>
              {room.name}
            </h3>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, padding: "2px 10px", marginLeft: 10 }}>
            <span style={{ fontSize: 12, color: cfg.color, fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.06em" }}>{cfg.label}</span>
          </div>
        </div>

        {room.interaction?.type === "NPC" && (
          <>
            <Row label="NPC" value={room.interaction.npc.name} />
            <Row label="Discovers" value={room.interaction.npc.discoveryMessage || "—"} />
            <Row label="Says" value={room.interaction.npc.dialogue?.join(", ") || "—"} />
          </>
        )}

        {room.interaction?.type === "chest" && (
          <>
            <Row label="Item" value={room.interaction.chest.itemId} />
            <Row label="Quantity" value={room.interaction.chest.quantity} />
            <Row label="Locked" value={room.interaction.chest.isLocked ? "Yes" : "No"} />
          </>
        )}

        {room.interaction?.type === "camp" && (
          <>
            <Row label="Heals" value={`${room.interaction.camp.healAmount} HP`} />
            <Row label="Mana" value={room.interaction.camp.restoresMana ? "Restored" : "No"} />
          </>
        )}

        {room.enemies?.length > 0 && room.enemies.map((enemy, i) => (
          <div key={enemy.name + i} style={{ marginTop: i > 0 ? 12 : 0 }}>
            {i === 0 && (
              <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Enemies
              </div>
            )}
            <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#FCA5A5", marginBottom: 8, fontFamily: "'Cinzel', Georgia, serif" }}>{enemy.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {[["HP", enemy.health], ["STR", enemy.strength], ["DEF", enemy.defense], ["DEX", enemy.dex]].map(([stat, val]) => (
                  <div key={stat as string} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Cinzel', Georgia, serif" }}>{stat}</span>
                    <span style={{ fontSize: 13, color: "#E8DCC8" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {room.neighboringRooms?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Passages</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {room.neighboringRooms.map(([dir, neighbor], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(180,140,80,0.08)", border: "1px solid rgba(180,140,80,0.2)", borderRadius: 4, padding: "3px 8px" }}>
                  <span style={{ fontSize: 10, color: "#D4AF37", fontFamily: "'Cinzel', Georgia, serif" }}>
                    {Directions[dir as unknown as number]?.toUpperCase?.() ?? dir}
                  </span>
                  <span style={{ fontSize: 10, color: "#6B7280" }}>→</span>
                  <span style={{ fontSize: 11, color: "#E8DCC8", fontFamily: "'Crimson Text', Georgia, serif" }}>{neighbor.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "10px",
            background: "transparent",
            border: "1px solid rgba(180,140,80,0.3)",
            borderRadius: 6,
            color: "#B4965A",
            fontSize: 13,
            fontFamily: "'Cinzel', Georgia, serif",
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(180,140,80,0.1)"; e.currentTarget.style.color = "#D4AF37"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#B4965A"; }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Legend() {
  const entries = Object.entries(interactionConfig);
  return (
    <div style={{
      position: "absolute", bottom: 16, right: 16, zIndex: 10,
      background: "rgba(13,11,7,0.9)",
      border: "1px solid rgba(180,140,80,0.2)",
      borderRadius: 8, padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 5,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{ fontSize: 9, color: "#9CA3AF", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Legend</div>
      {entries.map(([, cfg]) => (
        <div key={cfg.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.bg, border: `1px solid ${cfg.border}` }} />
          <span style={{ fontSize: 11, color: cfg.color, fontFamily: "'Cinzel', Georgia, serif" }}>{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RoomMap() {
  const rooms = useGameStore((state) => state.rooms);
  const startRoom = rooms.find((x) => x.name === "Start Room");
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const bounds = startRoom ? calculateBounds(startRoom) : null;
  const padding = CONTAINER_PADDING;
  const verticalPadding = 100;
  const containerWidth = bounds ? bounds.maxX - bounds.minX + padding * 2 + ROOM_W : 0;
  const containerHeight = bounds ? bounds.maxY - bounds.minY + verticalPadding * 2 + ROOM_H : 0;
  const offsetX = bounds ? -bounds.minX + padding : 0;
  const offsetY = bounds ? -bounds.minY + verticalPadding : 0;

  useEffect(() => {
    if (containerRef.current) {
      const c = containerRef.current;
      c.scrollTo({ left: (c.scrollWidth - c.clientWidth) / 2, top: (c.scrollHeight - c.clientHeight) / 2, behavior: "smooth" });
    }
  }, [containerWidth, containerHeight]);

  if (!startRoom) {
    return (
      <main style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0d0b07, #1a1209)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6B7280", fontFamily: "'Cinzel', Georgia, serif" }}>No start room found. Create one in World Builder.</p>
      </main>
    );
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    containerRef.current.scrollLeft -= e.clientX - dragStartRef.current.x;
    containerRef.current.scrollTop -= e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (containerRef.current) containerRef.current.style.cursor = "grab";
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap'); * { box-sizing: border-box; }`}</style>

      <main style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "24px 28px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 3, height: 28, background: "linear-gradient(to bottom, #D4AF37, transparent)", borderRadius: 2 }} />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#E8DCC8", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.05em" }}>
              Realm Map
            </h1>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: "4px 12px 4px 8px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth={1.5} width={14} height={14}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
              <span style={{ fontSize: 12, color: "#B4965A", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.08em" }}>{rooms.length} rooms</span>
            </div>
          </div>
          <p style={{ margin: 0, paddingLeft: 15, color: "#6B7280", fontSize: 14, fontFamily: "'Crimson Text', Georgia, serif" }}>
            Drag to explore · Click any room to inspect
          </p>
        </div>

        <div style={{ flex: 1, margin: "0 16px 16px", position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(180,140,80,0.15)" }}>
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle, rgba(180,140,80,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at center, transparent 40%, rgba(13,11,7,0.7) 100%)", pointerEvents: "none" }} />

          <div
            ref={containerRef}
            style={{ position: "absolute", inset: 0, zIndex: 2, overflow: "auto", cursor: "grab", userSelect: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div style={{ position: "relative", width: containerWidth, height: containerHeight }}>
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
                <g transform={`translate(${offsetX}, ${offsetY})`}>
                  <ConnectorLayer room={startRoom} x={0} y={0} visitedRooms={new Set()} />
                </g>
              </svg>

              <div style={{ position: "absolute", top: 0, left: 0, transform: `translate(${offsetX}px, ${offsetY}px)` }}>
                <RoomNode
                  room={startRoom}
                  x={0} y={0}
                  visitedRooms={new Set()}
                  depth={0}
                  onRoomClick={setSelectedRoom}
                  isStart
                />
              </div>
            </div>
          </div>

          <Legend />
        </div>
      </main>

      {selectedRoom && <RoomPopup room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
    </>
  );
}