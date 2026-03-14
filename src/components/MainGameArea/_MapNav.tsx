import { useGameStore, GameState } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { GameStatus } from "@/types/GameStatus";
import { Room } from "@/types/Room";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

// ─── Mini-map constants ───────────────────────────────────────────────────────

const CELL = 12;          // px per room box
const GAP = 4;            // px gap between boxes
const STEP = CELL + GAP;  // grid step
const MAX_DEPTH = 4;      // traversal depth
const VIEW_RADIUS = 3;    // cells visible outward from player in each direction
const MAP_CELLS = VIEW_RADIUS * 2 + 1; // 7 cells across
const MAP_SIZE = MAP_CELLS * STEP - GAP; // fixed px size

const interactionColor: Record<string, string> = {
  NPC:    "#818CF8",
  chest:  "#F59E0B",
  camp:   "#34D399",
  Combat: "#F87171",
  none:   "#4B5563",
};

function getRoomColor(room: Room): string {
  if (room.interaction) return interactionColor[room.interaction.type] ?? interactionColor.none;
  if (room.enemies?.length > 0) return interactionColor.Combat;
  return interactionColor.none;
}

// ─── Direction helper ─────────────────────────────────────────────────────────

function dirToOffset(dir: any): { dx: number; dy: number } | null {
  if (dir === Directions.North || dir === "North" || dir === 0) return { dx:  0, dy: -1 };
  if (dir === Directions.West  || dir === "West"  || dir === 1) return { dx: -1, dy:  0 };
  if (dir === Directions.South || dir === "South" || dir === 2) return { dx:  0, dy:  1 };
  if (dir === Directions.East  || dir === "East"  || dir === 3) return { dx:  1, dy:  0 };
  return null;
}

// ─── Layout: grid coords relative to current room (always 0,0) ───────────────

interface RoomPos { room: Room; gx: number; gy: number }

function buildLayout(
  room: Room,
  gx: number,
  gy: number,
  visited: Map<string, { gx: number; gy: number }>,
  depth: number,
): RoomPos[] {
  if (depth > MAX_DEPTH || visited.has(room.name)) return [];
  visited.set(room.name, { gx, gy });
  const result: RoomPos[] = [{ room, gx, gy }];
  for (const [dir, neighbor] of (room.neighboringRooms ?? [])) {
    if (visited.has(neighbor.name)) continue;
    const off = dirToOffset(dir);
    if (!off) continue;
    result.push(...buildLayout(neighbor, gx + off.dx, gy + off.dy, visited, depth + 1));
  }
  return result;
}

// ─── MiniMap: fixed viewport, player always centered ─────────────────────────

function MiniMap({ currentRoom }: { currentRoom: Room }) {
  if (!currentRoom) return null;

  // Build layout with current room at grid origin (0, 0)
  const allRooms = buildLayout(currentRoom, 0, 0, new Map(), 0);
  if (allRooms.length === 0) return null;

  // Only render rooms within the viewport radius
  const visible = allRooms.filter(
    r => Math.abs(r.gx) <= VIEW_RADIUS && Math.abs(r.gy) <= VIEW_RADIUS
  );

  // Convert grid coords to pixel coords — player is always at center
  const toPixel = (g: number) => (g + VIEW_RADIUS) * STEP;

  return (
    <div
      style={{
        position: "relative",
        width: MAP_SIZE,
        height: MAP_SIZE,
        background: "rgba(13,11,7,0.85)",
        border: "1px solid rgba(180,140,80,0.3)",
        borderRadius: 6,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(180,140,80,0.2) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
      }} />

      {/* connector lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {visible.map(({ room, gx, gy }) =>
          (room.neighboringRooms ?? []).map(([dir, neighbor], i) => {
            const off = dirToOffset(dir);
            if (!off) return null;
            const ngx = gx + off.dx;
            const ngy = gy + off.dy;
            // Only draw line if neighbor is also in viewport
            if (Math.abs(ngx) > VIEW_RADIUS || Math.abs(ngy) > VIEW_RADIUS) return null;
            return (
              <line
                key={`${room.name}-${i}`}
                x1={toPixel(gx) + CELL / 2}
                y1={toPixel(gy) + CELL / 2}
                x2={toPixel(ngx) + CELL / 2}
                y2={toPixel(ngy) + CELL / 2}
                stroke="rgba(180,140,80,0.35)"
                strokeWidth={1}
              />
            );
          })
        )}
      </svg>

      {/* room boxes */}
      {visible.map(({ room, gx, gy }) => {
        const isCurrent = gx === 0 && gy === 0;
        const color = getRoomColor(room);
        return (
          <div
            key={room.name}
            style={{
              position: "absolute",
              left: toPixel(gx),
              top: toPixel(gy),
              width: CELL,
              height: CELL,
              borderRadius: 2,
              background: isCurrent ? color : `${color}55`,
              border: isCurrent ? `1px solid ${color}` : "1px solid rgba(180,140,80,0.2)",
              boxShadow: isCurrent ? `0 0 6px ${color}` : "none",
              transition: "all 0.2s",
            }}
          />
        );
      })}

      {/* center crosshair marker */}
      <div style={{
        position: "absolute",
        left: toPixel(0) - 1,
        top: toPixel(0) - 1,
        width: CELL + 2,
        height: CELL + 2,
        borderRadius: 3,
        border: "1px solid rgba(212,175,55,0.6)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── MapNav ───────────────────────────────────────────────────────────────────

export default function MapNav() {
  const state = useGameStore((state: GameState) => state);

  return (
    <>
      {state.gameStatus === GameStatus.Exploring ? (
        <div className="absolute bottom-4 left-4 text-white">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>

            {/* Mini map */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{
                fontSize: 8,
                color: "rgba(180,140,80,0.6)",
                fontFamily: "'Cinzel', Georgia, serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textAlign: "center",
              }}>
                Map
              </span>
              <MiniMap currentRoom={state.room} />
            </div>

            {/* D-pad */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => state.move(Directions.North)}
                className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
                disabled={!state.room.neighboringRooms.some(([dir]) => dir === Directions.North)}
              >
                <ChevronUp size={24} />
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => state.move(Directions.West)}
                  className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
                  disabled={!state.room.neighboringRooms.some(([dir]) => dir === Directions.West)}
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={() => state.move(Directions.East)}
                  className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
                  disabled={!state.room.neighboringRooms.some(([dir]) => dir === Directions.East)}
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <button
                onClick={() => state.move(Directions.South)}
                className="p-3 bg-gray-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 active:scale-95 disabled:hover:bg-gray-700 disabled:bg-gray-700"
                disabled={!state.room.neighboringRooms.some(([dir]) => dir === Directions.South)}
              >
                <ChevronDown size={24} />
              </button>
            </div>

          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}