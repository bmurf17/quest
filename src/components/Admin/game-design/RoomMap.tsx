import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Compass, Layers, LocateFixed, Minus, Plus, RotateCcw, Search } from "lucide-react";
import { colors, fonts } from "@/theme";
import { useGameStore } from "@/state/GameState";
import { getAllRooms, getSections } from "@/queries/RoomQueries";
import {
  clearRoomPositions,
  createRoomWithExits,
  updateRoomPosition,
} from "@/queries/AdminQueries";
import { supabase } from "@/lib/supabase";
import { computeRealmLayout, findNearestFreeCell, type LayoutEdge } from "@/lib/roomLayout";
import { DIRECTION_OPTIONS } from "@/lib/directions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RoomInspector } from "./RoomInspector";
import { Toast } from "./create-room/Toast";
import { Directions } from "@/types/Directions";
import type { Room, Section } from "@/types/Room";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

const CELL_W = 190;
const CELL_H = 118;
const NODE_W = 132;
const NODE_H = 54;
const ORIGIN_X = 90;
const ORIGIN_Y = 78;
const SECTION_HEADER = 34;
const SECTION_GAP = 52;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.2;

type ToastState = { type: "success" | "error"; message: string } | null;

const interactionConfig: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  NPC: {
    color: "#818CF8",
    bg: "rgba(99,102,241,0.15)",
    border: "rgba(99,102,241,0.45)",
    label: "NPC",
  },
  chest: {
    color: "#F59E0B",
    bg: "rgba(217,119,6,0.15)",
    border: "rgba(217,119,6,0.45)",
    label: "Chest",
  },
  camp: {
    color: colors.success,
    bg: "rgba(5,150,105,0.15)",
    border: "rgba(5,150,105,0.45)",
    label: "Camp",
  },
  Combat: {
    color: "#F87171",
    bg: "rgba(220,38,38,0.15)",
    border: "rgba(220,38,38,0.45)",
    label: "Combat",
  },
  none: {
    color: colors.muted,
    bg: "rgba(255,255,255,0.04)",
    border: colors.goldBorder,
    label: "Empty",
  },
};

const getInteractionKey = (room: Room): string => {
  if (room.interaction) return room.interaction.type;
  if (room.enemies?.length > 0) return "Combat";
  return "none";
};

const directionShort = (direction: Directions) =>
  DIRECTION_OPTIONS.find(({ value }) => value === direction)?.label.slice(0, 1) ?? "?";

const directionLabel = (direction: Directions) =>
  DIRECTION_OPTIONS.find(({ value }) => value === direction)?.label ?? "Unknown";

const DIRECTION_OFFSETS: Record<Directions, [number, number]> = {
  [Directions.North]: [0, -1],
  [Directions.South]: [0, 1],
  [Directions.East]: [1, 0],
  [Directions.West]: [-1, 0],
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

interface RenderNode {
  room: Room;
  left: number;
  top: number;
  /** Grid coordinates used by the layout, or null for unplaced rooms. */
  gridX: number | null;
  gridY: number | null;
  isStart: boolean;
  sectionId: number | null;
  originX: number;
  originY: number;
  minX: number;
  minY: number;
  unplaced: boolean;
}

interface RenderEdge {
  key: string;
  path: string;
  labels: { x: number; y: number; direction: Directions }[];
}

interface SectionRender {
  key: string;
  name: string;
  headerTop: number;
  nodes: RenderNode[];
  edges: RenderEdge[];
}

interface ViewModel {
  sections: SectionRender[];
  width: number;
  height: number;
}

function buildViewModel(
  layouts: ReturnType<typeof computeRealmLayout>,
  dragOverrides: Map<number, { left: number; top: number }>,
): ViewModel {
  const sections: SectionRender[] = [];
  let cursorY = ORIGIN_Y;
  let maxWidth = 900;

  for (const layout of layouts) {
    // Unplaced rooms (no path from the section start) are intentionally hidden.
    if (layout.nodes.length === 0) continue;

    const minX = layout.bounds.minX;
    const minY = layout.bounds.minY;
    const gridWidth = (layout.bounds.maxX - layout.bounds.minX) * CELL_W + NODE_W;
    const gridHeight = (layout.bounds.maxY - layout.bounds.minY) * CELL_H + NODE_H;
    const originX = ORIGIN_X;
    const originY = cursorY + SECTION_HEADER;
    const headerTop = cursorY - 8;

    const nodes: RenderNode[] = layout.nodes.map((node) => {
      const baseLeft = originX + (node.x - minX) * CELL_W;
      const baseTop = originY + (node.y - minY) * CELL_H;
      const override = dragOverrides.get(node.room.id);
      return {
        room: node.room,
        left: override?.left ?? baseLeft,
        top: override?.top ?? baseTop,
        gridX: node.x,
        gridY: node.y,
        isStart: node.isStart,
        sectionId: layout.sectionId,
        originX,
        originY,
        minX,
        minY,
        unplaced: false,
      };
    });

    const nodeById = new Map(nodes.map((node) => [node.room.id, node]));
    const edges: RenderEdge[] = layout.edges.map((edge) => toRenderEdge(edge, nodeById));

    maxWidth = Math.max(maxWidth, originX + gridWidth + ORIGIN_X);

    sections.push({
      key: `${layout.sectionId ?? "none"}`,
      name: layout.sectionName,
      headerTop,
      nodes,
      edges,
    });

    cursorY += SECTION_HEADER + gridHeight + SECTION_GAP;
  }

  return { sections, width: maxWidth, height: Math.max(cursorY, 480) };
}

function toRenderEdge(edge: LayoutEdge, nodeById: Map<number, RenderNode>): RenderEdge {
  const a = nodeById.get(edge.aId);
  const b = nodeById.get(edge.bId);
  if (!a || !b) return { key: edge.key, path: "", labels: [] };

  const x1 = a.left + NODE_W / 2;
  const y1 = a.top + NODE_H / 2;
  const x2 = b.left + NODE_W / 2;
  const y2 = b.top + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  let path = `M ${x1} ${y1} L ${x2} ${y2}`;
  let curveX = 0;
  let curveY = 0;
  if (edge.parallelCount > 1) {
    const offset = (edge.parallelIndex - (edge.parallelCount - 1) / 2) * 34;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    curveX = (-dy / length) * offset;
    curveY = (dx / length) * offset;
    path = `M ${x1} ${y1} Q ${mx + curveX} ${my + curveY} ${x2} ${y2}`;
  }

  const labels = edge.labels.map((label) => {
    const fromA = label.fromId === edge.aId;
    const t = fromA ? 0.22 : 0.78;
    const lx = x1 + (x2 - x1) * t + curveX * 0.6;
    const ly = y1 + (y2 - y1) * t + curveY * 0.6;
    return { x: lx, y: ly, direction: label.direction };
  });

  return { key: edge.key, path, labels };
}

interface GhostSlot {
  key: string;
  sectionKey: string;
  direction: Directions;
  gridX: number;
  gridY: number;
  left: number;
  top: number;
}

/**
 * Empty compass slots around the selected room. Each ghost knows the exact
 * grid cell a new room will occupy, so placement is predictable before the
 * room exists. Directions that already have a doorway are skipped.
 */
function buildGhostSlots(
  viewModel: ViewModel,
  selectedRoom: Room | null,
): GhostSlot[] {
  if (!selectedRoom) return [];

  const selectedNode = viewModel.sections
    .flatMap((section) => section.nodes)
    .find((node) => node.room.id === selectedRoom.id && !node.unplaced);

  if (
    !selectedNode ||
    selectedNode.gridX === null ||
    selectedNode.gridY === null
  ) {
    return [];
  }

  const section = viewModel.sections.find((candidate) =>
    candidate.nodes.some((node) => node.room.id === selectedRoom.id),
  );
  if (!section) return [];

  const occupied = new Map<string, number>();
  for (const node of section.nodes) {
    if (node.gridX === null || node.gridY === null) continue;
    occupied.set(`${node.gridX},${node.gridY}`, node.room.id);
  }

  const usedDirections = new Set(selectedRoom.neighboringRooms.map(([direction]) => direction));
  const seenCells = new Set<string>();
  const slots: GhostSlot[] = [];

  for (const { value: direction } of DIRECTION_OPTIONS) {
    if (usedDirections.has(direction)) continue;

    const [dx, dy] = DIRECTION_OFFSETS[direction];
    const [gridX, gridY] = findNearestFreeCell(
      selectedNode.gridX + dx,
      selectedNode.gridY + dy,
      occupied,
    );
    const cellKey = `${gridX},${gridY}`;
    if (seenCells.has(cellKey)) continue;
    seenCells.add(cellKey);

    slots.push({
      key: `${section.key}-${direction}`,
      sectionKey: section.key,
      direction,
      gridX,
      gridY,
      left: selectedNode.originX + (gridX - selectedNode.minX) * CELL_W,
      top: selectedNode.originY + (gridY - selectedNode.minY) * CELL_H,
    });
  }

  return slots;
}

export default function RoomMap() {
  const rooms = useGameStore((state) => state.rooms);
  const sections = useGameStore((state) => state.availableSections);
  const setRooms = useGameStore((state) => state.setRooms);
  const loadSections = useGameStore((state) => state.loadSections);

  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState<ToastState>(null);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const selectedSectionId = useMemo(() => {
    const value = Number(searchParams.get("section"));
    if (!Number.isFinite(value) || value <= 0) return null;
    return sections.some((section) => section.id === value) ? value : null;
  }, [searchParams, sections]);

  const selectedRoomId = useMemo(() => {
    const value = Number(searchParams.get("room"));
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const layouts = useMemo(
    () => computeRealmLayout(rooms, sections, selectedSectionId),
    [rooms, sections, selectedSectionId],
  );

  const [dragOverrides, setDragOverrides] = useState<Map<number, { left: number; top: number }>>(
    new Map(),
  );
  const viewModel = useMemo(() => buildViewModel(layouts, dragOverrides), [layouts, dragOverrides]);
  const ghostSlots = useMemo(
    () => buildGhostSlots(viewModel, selectedRoom),
    [viewModel, selectedRoom],
  );
  const [ghostTarget, setGhostTarget] = useState<GhostSlot | null>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panDragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const nodeDragRef = useRef<{
    roomId: number;
    startX: number;
    startY: number;
    left: number;
    top: number;
    currentLeft: number;
    currentTop: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const refresh = useCallback(async () => {
    const [nextRooms, nextSections] = await Promise.all([getAllRooms(), getSections()]);
    setRooms(nextRooms);
    loadSections(nextSections);
    setDragOverrides(new Map());
  }, [setRooms, loadSections]);

  const selectRoom = useCallback(
    (roomId: number | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (roomId === null) next.delete("room");
          else next.set("room", String(roomId));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const selectSection = useCallback(
    (sectionId: number | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (sectionId === null) next.delete("section");
          else next.set("section", String(sectionId));
          next.delete("room");
          return next;
        },
        { replace: true },
      );
      setDragOverrides(new Map());
    },
    [setSearchParams],
  );

  // Remove stale selection if the room disappeared (deleted or filtered out).
  useEffect(() => {
    if (selectedRoomId === null) return;
    if (rooms.some((room) => room.id === selectedRoomId)) return;
    selectRoom(null);
  }, [rooms, selectedRoomId, selectRoom]);

  // Wheel zoom without scrolling the admin page.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => {
        const next = clamp(current * (event.deltaY > 0 ? 0.9 : 1.1), MIN_ZOOM, MAX_ZOOM);
        return Number(next.toFixed(3));
      });
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  const handleViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-room-node]")) return;
    panDragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag) return;
    setPan({
      x: drag.panX + (event.clientX - drag.x),
      y: drag.panY + (event.clientY - drag.y),
    });
  };

  const endViewportDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    panDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleNodePointerDown = (event: ReactPointerEvent, node: RenderNode) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    suppressClickRef.current = false;
    nodeDragRef.current = {
      roomId: node.room.id,
      startX: event.clientX,
      startY: event.clientY,
      left: node.left,
      top: node.top,
      currentLeft: node.left,
      currentTop: node.top,
      moved: false,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handleNodePointerMove = (event: ReactPointerEvent) => {
    const drag = nodeDragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    drag.currentLeft = drag.left + dx;
    drag.currentTop = drag.top + dy;
    suppressClickRef.current = true;

    setDragOverrides((current) => {
      const next = new Map(current);
      next.set(drag.roomId, { left: drag.currentLeft, top: drag.currentTop });
      return next;
    });
  };

  const handleNodePointerUp = async (event: ReactPointerEvent, node: RenderNode) => {
    const drag = nodeDragRef.current;
    if (!drag) return;
    nodeDragRef.current = null;
    if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    }
    if (!drag.moved) return;

    const gridX = (drag.currentLeft - node.originX) / CELL_W + node.minX;
    const gridY = (drag.currentTop - node.originY) / CELL_H + node.minY;

    try {
      await updateRoomPosition(node.room.id, Number(gridX.toFixed(2)), Number(gridY.toFixed(2)));
      await refresh();
    } catch (err) {
      showToast("error", errorMessage(err));
      setDragOverrides(new Map());
    }
  };

  const handleResetLayout = async () => {
    const ids = selectedSectionId
      ? rooms.filter((room) => room.sectionId === selectedSectionId).map((room) => room.id)
      : rooms.map((room) => room.id);

    try {
      await clearRoomPositions(ids);
      await refresh();
      setPan({ x: 0, y: 0 });
      setZoom(1);
      showToast("success", "Layout reset to the compass auto-layout.");
    } catch (err) {
      showToast("error", errorMessage(err));
    }
  };

  const handleGhostCreated = async (roomId: number) => {
    await refresh();
    selectRoom(roomId);
  };

  const focusStart = () => {
    const layout = layouts[0];
    const firstNode = layout?.nodes.find((node) => node.isStart) ?? layout?.nodes[0];
    if (!firstNode) return;
    // Put the node near the visible centre of the viewport.
    const viewport = viewportRef.current;
    const width = viewport?.clientWidth ?? 800;
    const height = viewport?.clientHeight ?? 600;
    setPan({
      x: width / 2 - ((firstNode.x - layout.bounds.minX) * CELL_W + ORIGIN_X + NODE_W / 2) * zoom,
      y:
        height / 2 -
        ((firstNode.y - layout.bounds.minY) * CELL_H + ORIGIN_Y + SECTION_HEADER) * zoom,
    });
  };

  return (
    <>
      <main className="flex h-full min-h-0 flex-col overflow-hidden" style={mapPageStyle}>
        <div style={headerStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>World Builder</div>
            <div style={titleRowStyle}>
              <Compass size={20} style={{ color: colors.gold }} />
              <h1 style={titleStyle}>Realm Map</h1>
              <span style={countStyle}>{rooms.length} rooms</span>
            </div>
            <p style={hintStyle}>
              Drag the map to pan · drag a room to save a position · scroll to zoom · select a room
              to add a neighbour
            </p>
          </div>

          <div style={toolbarStyle}>
            <select
              value={selectedSectionId ?? ""}
              onChange={(event) =>
                selectSection(event.target.value ? Number(event.target.value) : null)
              }
              aria-label="Filter map by section"
              style={selectStyle}
            >
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setSectionsOpen(true)} style={toolButtonStyle}>
              <Layers size={14} />
              Sections
            </button>
            <button type="button" onClick={focusStart} style={toolButtonStyle}>
              <LocateFixed size={14} />
              Start
            </button>
            <button type="button" onClick={() => void handleResetLayout()} style={toolButtonStyle}>
              <RotateCcw size={14} />
              Reset layout
            </button>
            <Link to="/admin/game-design/rooms" style={toolLinkStyle}>
              <Search size={14} />
              Room list
            </Link>
          </div>
        </div>

        <div style={canvasWrapStyle}>
          <div
            ref={viewportRef}
            style={viewportStyle}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={endViewportDrag}
            onPointerCancel={endViewportDrag}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                backgroundImage:
                  "radial-gradient(circle, rgba(180,140,80,0.15) 1px, transparent 1px)",
                backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                background:
                  "radial-gradient(ellipse at center, transparent 42%, rgba(13,11,7,0.66) 100%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: viewModel.width,
                height: viewModel.height,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                zIndex: 2,
              }}
            >
              <svg
                width={viewModel.width}
                height={viewModel.height}
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "visible",
                  pointerEvents: "none",
                }}
                aria-hidden
              >
                {viewModel.sections.flatMap((section) =>
                  section.edges.map((edge) => (
                    <g key={`${section.key}-${edge.key}`}>
                      <path
                        d={edge.path}
                        fill="none"
                        stroke="rgba(180,140,80,0.42)"
                        strokeWidth={1.5}
                      />
                      {edge.labels.map((label, index) => (
                        <g key={index}>
                          <circle cx={label.x} cy={label.y} r={7} fill="#14110a" />
                          <text
                            x={label.x}
                            y={label.y + 0.5}
                            fill={colors.gold}
                            fontSize={9}
                            fontFamily={fonts.display}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {directionShort(label.direction)}
                          </text>
                        </g>
                      ))}
                    </g>
                  )),
                )}
              </svg>

              {viewModel.sections.map((section) => (
                <div key={section.key}>
                  <div style={{ position: "absolute", top: section.headerTop, left: ORIGIN_X }}>
                    <span style={sectionLabelStyle}>{section.name}</span>
                  </div>
                  {section.nodes.map((node) => (
                    <RoomNode
                      key={`${section.key}-${node.room.id}`}
                      node={node}
                      selected={node.room.id === selectedRoomId}
                      onPointerDown={handleNodePointerDown}
                      onPointerMove={handleNodePointerMove}
                      onPointerUp={(event, target) => void handleNodePointerUp(event, target)}
                      onClick={() => {
                        if (suppressClickRef.current) return;
                        selectRoom(node.room.id);
                      }}
                    />
                  ))}
                  {ghostSlots
                    .filter((slot) => slot.sectionKey === section.key)
                    .map((slot) => (
                      <GhostNode
                        key={slot.key}
                        slot={slot}
                        onClick={() => setGhostTarget(slot)}
                      />
                    ))}
                </div>
              ))}
            </div>

            {viewModel.sections.length === 0 && (
              <div style={emptyCanvasStyle}>
                <p style={{ margin: 0 }}>No rooms match this section filter.</p>
                <Link to="/admin/game-design/rooms/new" style={toolLinkStyle}>
                  Create a room
                </Link>
              </div>
            )}

            <div style={zoomControlsStyle}>
              <button
                type="button"
                onClick={() => setZoom((current) => clamp(current * 1.15, MIN_ZOOM, MAX_ZOOM))}
                style={zoomButtonStyle}
                aria-label="Zoom in"
              >
                <Plus size={15} />
              </button>
              <span style={zoomLabelStyle}>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((current) => clamp(current / 1.15, MIN_ZOOM, MAX_ZOOM))}
                style={zoomButtonStyle}
                aria-label="Zoom out"
              >
                <Minus size={15} />
              </button>
            </div>
          </div>

          {selectedRoom && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/60 md:hidden"
                onClick={() => selectRoom(null)}
              />
              <aside className="fixed inset-0 z-40 md:static md:z-auto md:w-[410px] md:shrink-0">
                <RoomInspector
                  variant="drawer"
                  room={selectedRoom}
                  rooms={rooms}
                  sections={sections}
                  onSelectRoom={selectRoom}
                  onRefresh={refresh}
                  onSectionsChanged={refresh}
                  onDeleted={() => selectRoom(null)}
                  onClose={() => selectRoom(null)}
                  showToast={showToast}
                />
              </aside>
            </>
          )}
        </div>
      </main>

      {sectionsOpen && (
        <SectionManagerDialog
          sections={sections}
          onClose={() => setSectionsOpen(false)}
          onChanged={refresh}
          showToast={showToast}
        />
      )}

      {ghostTarget && selectedRoom && (
        <CreateRoomFromMapDialog
          slot={ghostTarget}
          room={selectedRoom}
          sections={sections}
          onClose={() => setGhostTarget(null)}
          onCreated={handleGhostCreated}
          showToast={showToast}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

interface RoomNodeProps {
  node: RenderNode;
  selected: boolean;
  onPointerDown: (event: ReactPointerEvent, node: RenderNode) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent, node: RenderNode) => void;
  onClick: () => void;
}

function RoomNode({
  node,
  selected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
}: RoomNodeProps) {
  const [hovered, setHovered] = useState(false);
  const interactionKey = getInteractionKey(node.room);
  const cfg = interactionConfig[interactionKey] ?? interactionConfig.none;

  return (
    <button
      type="button"
      data-room-node
      onPointerDown={(event) => onPointerDown(event, node)}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => onPointerUp(event, node)}
      onPointerCancel={(event) => onPointerUp(event, node)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Inspect room ${node.room.name}`}
      aria-pressed={selected}
      title={node.unplaced ? `${node.room.name} (unplaced)` : node.room.name}
      style={{
        position: "absolute",
        left: node.left,
        top: node.top,
        width: NODE_W,
        height: NODE_H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: "0 8px",
        font: "inherit",
        background:
          selected || hovered
            ? cfg.bg
            : node.isStart
              ? "rgba(212,175,55,0.12)"
              : "rgba(13,11,7,0.9)",
        border: `1px solid ${
          selected ? colors.gold : node.isStart ? "rgba(212,175,55,0.6)" : cfg.border
        }`,
        borderRadius: 7,
        boxShadow: selected ? `0 0 0 1px ${colors.gold}55, 0 0 18px rgba(212,175,55,0.2)` : "none",
        cursor: "grab",
        touchAction: "none",
        opacity: node.unplaced ? 0.72 : 1,
        zIndex: selected || hovered ? 10 : 1,
      }}
    >
      <span
        style={{
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 11,
          fontFamily: fonts.display,
          fontWeight: 600,
          letterSpacing: "0.03em",
          color: node.isStart ? colors.gold : colors.text,
        }}
      >
        {node.room.name}
      </span>
      <span
        style={{
          fontSize: 9,
          fontFamily: fonts.display,
          letterSpacing: "0.06em",
          color: cfg.color,
          opacity: 0.85,
        }}
      >
        {cfg.label}
      </span>
      {node.isStart && <span style={startBadgeStyle}>START</span>}
    </button>
  );
}

function GhostNode({ slot, onClick }: { slot: GhostSlot; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const label = directionLabel(slot.direction);

  return (
    <button
      type="button"
      data-room-node
      data-ghost-slot
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Create a room to the ${label.toLowerCase()}`}
      title={`Add a room to the ${label.toLowerCase()}`}
      style={{
        position: "absolute",
        left: slot.left,
        top: slot.top,
        width: NODE_W,
        height: NODE_H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: "0 8px",
        background: hovered ? "rgba(212,175,55,0.14)" : "rgba(13,11,7,0.55)",
        border: `1px dashed ${hovered ? colors.gold : "rgba(212,175,55,0.45)"}`,
        borderRadius: 7,
        color: colors.goldMuted,
        cursor: "pointer",
        touchAction: "none",
        zIndex: 2,
        transition: "background 120ms ease, border-color 120ms ease",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Plus size={12} />
        <span
          style={{
            fontSize: 10,
            fontFamily: fonts.display,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </span>
      <span style={{ fontSize: 9, color: colors.muted }}>Add room</span>
    </button>
  );
}

function CreateRoomFromMapDialog({
  slot,
  room,
  sections,
  onClose,
  onCreated,
  showToast,
}: {
  slot: GhostSlot;
  room: Room;
  sections: Section[];
  onClose: () => void;
  onCreated: (roomId: number) => Promise<void>;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const label = directionLabel(slot.direction);
  const sectionName =
    sections.find((section) => section.id === room.sectionId)?.name ?? "Unassigned";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setBusy(true);
    try {
      const newRoomId = await createRoomWithExits({
        name: trimmed,
        sectionId: room.sectionId || null,
        exits: [{ direction: slot.direction, targetRoomId: room.id }],
        mapX: slot.gridX,
        mapY: slot.gridY,
      });
      await onCreated(newRoomId);
      showToast("success", `"${trimmed}" was created to the ${label.toLowerCase()}.`);
      onClose();
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent style={dialogStyle}>
        <DialogTitle asChild>
          <h2 style={dialogTitleStyle}>Add a room to the {label.toLowerCase()}</h2>
        </DialogTitle>
        <p style={dialogHintStyle}>
          The new room will appear in the dashed slot beside{" "}
          <strong style={{ color: colors.text }}>{room.name}</strong> in {sectionName}, with a
          doorway between them.
        </p>

        <form onSubmit={(event) => void submit(event)} style={{ display: "flex", gap: 8 }}>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Room name"
            aria-label="New room name"
            style={{ ...dialogInputStyle, flex: 1 }}
          />
          <button type="submit" disabled={busy || !name.trim()} style={dialogPrimaryStyle}>
            {busy ? "Creating…" : "Create room"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" onClick={onClose} style={dialogButtonStyle}>
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionManagerDialog({
  sections,
  onClose,
  onChanged,
  showToast,
}: {
  sections: Section[];
  onClose: () => void;
  onChanged: () => Promise<void>;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(sections.map((section) => [section.id, section.name])),
  );
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDrafts(Object.fromEntries(sections.map((section) => [section.id, section.name])));
  }, [sections]);

  const rename = async (section: Section) => {
    const name = (drafts[section.id] ?? "").trim();
    if (!name || name === section.name) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("sections").update({ name }).eq("id", section.id);
      if (error) throw error;
      await onChanged();
      showToast("success", "Section renamed.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (section: Section) => {
    if (
      !window.confirm(
        `Delete section "${section.name}"? Rooms stay in the database but lose their section.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("sections").delete().eq("id", section.id);
      if (error) throw error;
      await onChanged();
      showToast("success", `"${section.name}" was removed.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("sections").insert({ name });
      if (error) throw error;
      setNewName("");
      await onChanged();
      showToast("success", `"${name}" was created.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent style={dialogStyle}>
        <DialogTitle asChild>
          <h2 style={dialogTitleStyle}>Sections</h2>
        </DialogTitle>
        <p style={dialogHintStyle}>
          Sections group rooms and decide where exploration begins. The full Sections page remains
          available as a secondary view.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sections.map((section) => (
            <div key={section.id} style={sectionRowStyle}>
              <input
                value={drafts[section.id] ?? ""}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [section.id]: event.target.value }))
                }
                onBlur={() => void rename(section)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void rename(section);
                  }
                }}
                aria-label={`Rename ${section.name}`}
                style={dialogInputStyle}
              />
              <button
                type="button"
                onClick={() => void remove(section)}
                disabled={busy}
                style={dialogDangerStyle}
              >
                Delete
              </button>
            </div>
          ))}
          {sections.length === 0 && <div style={dialogEmptyStyle}>No sections yet.</div>}
        </div>

        <form
          onSubmit={(event) => void create(event)}
          style={{ display: "flex", gap: 8, marginTop: 18 }}
        >
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New section name"
            aria-label="New section name"
            style={{ ...dialogInputStyle, flex: 1 }}
          />
          <button type="submit" disabled={busy || !newName.trim()} style={dialogPrimaryStyle}>
            Create
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" onClick={onClose} style={dialogButtonStyle}>
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const mapPageStyle: CSSProperties = {
  height: "100%",
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
};
const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  padding: "18px 24px 14px",
  borderBottom: `1px solid ${colors.goldBorder}`,
  flexShrink: 0,
};
const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 4,
};
const titleRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 9 };
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
const countStyle: CSSProperties = {
  padding: "2px 9px",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  fontSize: 10,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
};
const hintStyle: CSSProperties = {
  margin: "5px 0 0",
  fontSize: 11,
  color: colors.muted,
};
const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
};
const selectStyle: CSSProperties = {
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  padding: "7px 10px",
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
  outline: "none",
  cursor: "pointer",
};
const toolButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 11,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
};
const toolLinkStyle: CSSProperties = {
  ...toolButtonStyle,
  textDecoration: "none",
};
const canvasWrapStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minHeight: 0,
  position: "relative",
};
const viewportStyle: CSSProperties = {
  position: "relative",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
};
const sectionLabelStyle: CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 20,
  border: `1px solid ${colors.goldBorder}`,
  background: "rgba(13,11,7,0.9)",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const startBadgeStyle: CSSProperties = {
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
const zoomControlsStyle: CSSProperties = {
  position: "absolute",
  right: 14,
  bottom: 14,
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: 4,
  background: "rgba(13,11,7,0.9)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 8,
};
const zoomButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  background: "transparent",
  border: "none",
  color: colors.textMuted,
  cursor: "pointer",
};
const zoomLabelStyle: CSSProperties = {
  minWidth: 42,
  textAlign: "center",
  fontSize: 10,
  color: colors.goldMuted,
  fontFamily: fonts.display,
};
const emptyCanvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  color: colors.muted,
  fontSize: 14,
};
const dialogStyle: CSSProperties = {
  maxWidth: 460,
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  padding: 24,
  color: colors.text,
  fontFamily: fonts.body,
};
const dialogTitleStyle: CSSProperties = {
  margin: 0,
  color: colors.text,
  fontFamily: fonts.display,
  fontSize: 20,
  letterSpacing: "0.04em",
};
const dialogHintStyle: CSSProperties = {
  margin: "8px 0 18px",
  fontSize: 12,
  lineHeight: 1.5,
  color: colors.muted,
};
const sectionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const dialogInputStyle: CSSProperties = {
  padding: "8px 10px",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 13,
  fontFamily: fonts.body,
  outline: "none",
  minWidth: 0,
};
const dialogDangerStyle: CSSProperties = {
  padding: "6px 10px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 5,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dialogPrimaryStyle: CSSProperties = {
  padding: "8px 14px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 11,
  fontWeight: 700,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dialogButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 11,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dialogEmptyStyle: CSSProperties = {
  padding: "16px 12px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  border: `1px dashed ${colors.subtleBorder}`,
  borderRadius: 7,
};
