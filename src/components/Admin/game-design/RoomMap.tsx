import { useGameStore } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import type { Room } from "@/types/Room";
import React, { useState, useRef, useEffect } from "react";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

const MAX_DEPTH = 5;
const ROOM_DISTANCE = 160;
const CONTAINER_PADDING = 250;

const interactionConfig: Record<
  string,
  { color: string; bg: string; border: string; label: string; icon: string }
> = {
  NPC:    { color: "#818CF8", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.45)", label: "NPC", icon: "👤" },
  chest:  { color: "#F59E0B", bg: "rgba(217,119,6,0.15)",  border: "rgba(217,119,6,0.45)",  label: "Chest", icon: "📦" },
  camp:   { color: colors.success, bg: "rgba(5,150,105,0.15)",  border: "rgba(5,150,105,0.45)",  label: "Camp", icon: "🔥" },
  Combat: { color: "#F87171", bg: "rgba(220,38,38,0.15)",  border: "rgba(220,38,38,0.45)",  label: "Combat", icon: "⚔️" },
  none:   { color: colors.muted, bg: "rgba(255,255,255,0.04)", border: colors.goldBorder, label: "Empty", icon: "◇" },
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
  <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={colors.goldBorder} strokeWidth={1.5} />
  <circle cx={mx} cy={my} r={3} fill={colors.goldBorder} />
  <text
        x={mx + (isVertical ? 5 : 0)}
        y={my + (!isVertical ? -4 : 0)}
  fill={colors.goldBorder}
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
      {room.neighboringRooms?.map(([direction, neighbor], i: number) => {
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
          <div style={roomNodeStyle}>
            START
          </div>
        )}
      </div>

      {depth < MAX_DEPTH &&
        room.neighboringRooms?.map(([direction, neighbor], i: number) => {
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
      <div style={rowStyle}>
        <span style={rowStyle2}>{label}</span>
        <span style={rowStyle3}>{value}</span>
      </div>
  );

  return (
    <div
      onClick={onClose}
      style={roomPopupStyle}
    >
      <div
          onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
          border: `1px solid ${cfg.border}`,
          borderRadius: 12,
          padding: 28,
          width: 340,
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
          <div style={roomPopupStyle2}>
            <div style={{ width: 2, height: 18, background: cfg.color, borderRadius: 1 }} />
            <h3 style={roomPopupStyle3}>
              {room.name}
            </h3>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, padding: "2px 10px", marginLeft: 10 }}>
            <span style={{ fontSize: 12, color: cfg.color, fontFamily: fonts.display, letterSpacing: "0.06em" }}>{cfg.label}</span>
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
              <div style={roomPopupStyle4}>
                  Enemies
                </div>
            )}
      <div style={roomPopupStyle5}>
      <div style={roomPopupStyle6}>{enemy.name}</div>
              <div style={roomPopupStyle7}>
                {[["HP", enemy.health], ["STR", enemy.strength], ["DEF", enemy.defense], ["DEX", enemy.dex]].map(([stat, val]) => (
                  <div key={stat as string} style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={roomPopupStyle8}>{stat}</span>
        <span style={{ fontSize: 13, color: colors.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {room.neighboringRooms?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={roomPopupStyle9}>Passages</div>
            <div style={roomPopupStyle10}>
              {room.neighboringRooms.map(([dir, neighbor], i) => (
                <div key={i} style={roomPopupStyle11}>
                  <span style={roomPopupStyle12}>
                    {Directions[dir as unknown as number]?.toUpperCase?.() ?? dir}
                  </span>
                  <span style={{ fontSize: 10, color: "#6B7280" }}>→</span>
                  <span style={roomPopupStyle13}>{neighbor.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={roomPopupStyle14}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(180,140,80,0.1)"; e.currentTarget.style.color = colors.gold; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.goldMuted; }}
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
    <div style={legendStyle}>
      <div style={legendStyle2}>Legend</div>
      {entries.map(([, cfg]) => (
        <div key={cfg.label} style={legendStyle3}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.bg, border: `1px solid ${cfg.border}` }} />
          <span style={{ fontSize: 11, color: cfg.color, fontFamily: "'Cinzel', Georgia, serif" }}>{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RoomMap() {
  const allRooms = useGameStore((state) => state.rooms);
  const availableSections = useGameStore((state) => state.availableSections);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  const rooms = selectedSectionId !== null
    ? allRooms.filter((r) => r.sectionId === selectedSectionId)
    : allRooms;

  const startRoom = rooms.length > 0 ? rooms[0] : null;
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
      <main style={roomMapStyle}>
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

      <main style={roomMapStyle2}>

        <div style={{ padding: "24px 28px 16px", flexShrink: 0 }}>
          <div style={roomMapStyle3}>
            <div style={roomMapStyle4} />
            <h1 style={roomMapStyle5}>
              Realm Map
            </h1>
            <div style={roomMapStyle6}>
              <div style={roomMapStyle7}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#B4965A" strokeWidth={1.5} width={14} height={14}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
                <span style={roomMapStyle8}>{rooms.length} rooms</span>
              </div>
              <select
                value={selectedSectionId ?? ""}
                onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : null)}
                style={roomMapStyle9}
              >
                <option value="">All Sections</option>
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={roomMapStyle10}>
            Drag to explore · Click any room to inspect
          </p>
        </div>

        <div style={roomMapStyle11}>
          <div style={roomMapStyle12} />
          <div style={roomMapStyle13} />

          <div
            ref={containerRef}
            style={roomMapStyle14}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div style={{ position: "relative", width: containerWidth, height: containerHeight }}>
              <svg style={roomMapStyle15}>
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

// Static style objects hoisted out of the render path.
const roomNodeStyle: CSSProperties = {
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
};
const rowStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid rgba(180,140,80,0.1)" };
  const rowStyle2: CSSProperties = { fontSize: 11, color: colors.muted, fontFamily: fonts.display, letterSpacing: "0.06em", textTransform: "uppercase" };
  const rowStyle3: CSSProperties = { fontSize: 14, color: colors.text, fontFamily: fonts.body };
  const roomPopupStyle: CSSProperties = {
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50,
          backdropFilter: "blur(3px)",
};
const roomPopupStyle2: CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 };
  const roomPopupStyle3: CSSProperties = { margin: 0, fontSize: 20, fontWeight: 700, color: colors.text, fontFamily: fonts.display, letterSpacing: "0.04em" };
  const roomPopupStyle4: CSSProperties = { fontSize: 11, color: colors.muted, fontFamily: fonts.display, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 };
  const roomPopupStyle5: CSSProperties = { background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "10px 12px" };
  const roomPopupStyle6: CSSProperties = { fontSize: 14, fontWeight: 600, color: colors.danger, marginBottom: 8, fontFamily: fonts.display };
  const roomPopupStyle7: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" };
  const roomPopupStyle8: CSSProperties = { fontSize: 11, color: colors.muted, fontFamily: fonts.display };
  const roomPopupStyle9: CSSProperties = { fontSize: 11, color: colors.muted, fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 };
  const roomPopupStyle10: CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
  const roomPopupStyle11: CSSProperties = { display: "flex", alignItems: "center", gap: 4, background: "rgba(180,140,80,0.08)", border: "1px solid rgba(180,140,80,0.2)", borderRadius: 4, padding: "3px 8px" };
  const roomPopupStyle12: CSSProperties = { fontSize: 10, color: colors.gold, fontFamily: "'Cinzel', Georgia, serif" };
  const roomPopupStyle13: CSSProperties = { fontSize: 11, color: colors.text, fontFamily: "'Crimson Text', Georgia, serif" };
  const roomPopupStyle14: CSSProperties = {
              marginTop: 24,
              width: "100%",
              padding: "10px",
              background: "transparent",
              border: `1px solid ${colors.goldBorder}`,
              borderRadius: 6,
              color: colors.goldMuted,
              fontSize: 13,
              fontFamily: fonts.display,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.15s",
};
const legendStyle: CSSProperties = {
  position: "absolute", bottom: 16, right: 16, zIndex: 10,
  background: "rgba(13,11,7,0.9)",
  border: "1px solid rgba(180,140,80,0.2)",
  borderRadius: 8, padding: "10px 14px",
  display: "flex", flexDirection: "column", gap: 5,
  backdropFilter: "blur(4px)",
};
const legendStyle2: CSSProperties = { fontSize: 9, color: colors.muted, fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 };
  const legendStyle3: CSSProperties = { display: "flex", alignItems: "center", gap: 7 };
  const roomMapStyle: CSSProperties = { minHeight: "100vh", background: "linear-gradient(160deg, #0d0b07, #1a1209)", display: "flex", alignItems: "center", justifyContent: "center" };
  const roomMapStyle2: CSSProperties = { minHeight: "100vh", background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)", display: "flex", flexDirection: "column" };
  const roomMapStyle3: CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 };
  const roomMapStyle4: CSSProperties = { width: 3, height: 28, background: `linear-gradient(to bottom, ${colors.gold}, transparent)`, borderRadius: 2 };
  const roomMapStyle5: CSSProperties = { margin: 0, fontSize: 26, fontWeight: 700, color: colors.text, fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.05em" };
  const roomMapStyle6: CSSProperties = { marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" };
  const roomMapStyle7: CSSProperties = { display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,80,0.15)", borderRadius: 20, padding: "4px 12px 4px 8px" };
  const roomMapStyle8: CSSProperties = { fontSize: 12, color: "#B4965A", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.08em" };
  const roomMapStyle9: CSSProperties = {
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(180,140,80,0.3)",
                    borderRadius: 6,
                    padding: "5px 28px 5px 10px",
                    color: colors.text,
                    fontSize: 12,
                    fontFamily: "'Cinzel', Georgia, serif",
                    letterSpacing: "0.04em",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    backgroundSize: 14,
};
const roomMapStyle10: CSSProperties = { margin: 0, paddingLeft: 15, color: "#6B7280", fontSize: 14, fontFamily: "'Crimson Text', Georgia, serif" };
  const roomMapStyle11: CSSProperties = { flex: 1, margin: "0 16px 16px", position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(180,140,80,0.15)" };
  const roomMapStyle12: CSSProperties = {
              position: "absolute", inset: 0, zIndex: 0,
              backgroundImage: "radial-gradient(circle, rgba(180,140,80,0.15) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
};
const roomMapStyle13: CSSProperties = { position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at center, transparent 40%, rgba(13,11,7,0.7) 100%)", pointerEvents: "none" };
const roomMapStyle14: CSSProperties = { position: "absolute", inset: 0, zIndex: 2, overflow: "auto", cursor: "grab", userSelect: "none" };
const roomMapStyle15: CSSProperties = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" };
