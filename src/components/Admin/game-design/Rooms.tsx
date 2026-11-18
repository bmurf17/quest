import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllRooms } from "@/queries/RoomQueries";
import { deleteRoom, linkRooms, unlinkRooms, updateRoomBasics } from "@/queries/AdminQueries";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { DIRECTION_OPTIONS, oppositeDirection } from "@/lib/directions";
import { Directions } from "@/types/Directions";
import { Toast } from "./create-room/Toast";
import { RoomContents } from "./RoomContents";
import { FieldGroup, StyledInput, StyledSelect } from "./create-room/primitives";
import { AdminPageHeader } from "@/components/Admin/ui/AdminPrimitives";
import type { Room } from "@/types/Room";
import type { CSSProperties } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

const interactionLabel = (room: Room) => {
  if (room.interaction) {
    return room.interaction.type === "NPC" ? "NPC" : room.interaction.type;
  }
  return room.enemies.length > 0 ? "Combat" : "Empty";
};

/** Rooms reachable from the first room in the same section. */
function findUnreachable(roomsInSection: Room[]): Room[] {
  if (roomsInSection.length === 0) return [];

  const byId = new Map(roomsInSection.map((room) => [room.id, room]));
  const reachable = new Set<number>();
  const stack = [roomsInSection[0]];

  while (stack.length > 0) {
    const room = stack.pop()!;
    if (reachable.has(room.id)) continue;
    reachable.add(room.id);
    for (const [, neighbor] of room.neighboringRooms) {
      if (byId.has(neighbor.id) && !reachable.has(neighbor.id)) {
        stack.push(byId.get(neighbor.id)!);
      }
    }
  }

  return roomsInSection.filter((room) => !reachable.has(room.id));
}

export default function Rooms() {
  const rooms = useGameStore((state) => state.rooms);
  const availableSections = useGameStore((state) => state.availableSections);
  const setRooms = useGameStore((state) => state.setRooms);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const id = Number(searchParams.get("room"));
    return Number.isFinite(id) && id > 0 ? id : null;
  });
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<"all" | number>("all");
  const [toast, setToast] = useState<ToastState>(null);

  const [draftName, setDraftName] = useState("");
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkDirection, setLinkDirection] = useState<Directions>(Directions.North);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedId) ?? null,
    [rooms, selectedId],
  );

  const filteredRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesQuery = needle.length === 0 || room.name.toLowerCase().includes(needle);
      const matchesSection = sectionFilter === "all" || room.sectionId === sectionFilter;
      return matchesQuery && matchesSection;
    });
  }, [rooms, query, sectionFilter]);

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const room of rooms) {
      const key = room.name.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
  }, [rooms]);

  const sectionName = (id: number) =>
    availableSections.find((section) => section.id === id)?.name ?? "No section";

  const selectedNeighbors = useMemo(() => selectedRoom?.neighboringRooms ?? [], [selectedRoom]);

  const availableDirections = useMemo(
    () =>
      DIRECTION_OPTIONS.filter(
        ({ value }) => !selectedNeighbors.some(([direction]) => direction === value),
      ),
    [selectedNeighbors],
  );

  const linkTargets = useMemo(() => {
    if (!selectedRoom) return [];
    const connected = new Set(selectedNeighbors.map(([, neighbor]) => neighbor.id));
    return rooms.filter((room) => room.id !== selectedRoom.id && !connected.has(room.id));
  }, [rooms, selectedRoom, selectedNeighbors]);

  useEffect(() => {
    if (selectedRoom && rooms.some((room) => room.id === selectedRoom.id)) return;
    if (rooms.length > 0) setSelectedId(rooms[0].id);
  }, [rooms, selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) return;
    setDraftName(selectedRoom.name);
    setDraftSectionId(selectedRoom.sectionId);
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedId === null) return;
    if (searchParams.get("room") === String(selectedId)) return;
    const next = new URLSearchParams(searchParams);
    next.set("room", String(selectedId));
    setSearchParams(next, { replace: true });
  }, [selectedId, searchParams, setSearchParams]);

  useEffect(() => {
    if (availableDirections.length === 0) return;
    if (!availableDirections.some(({ value }) => value === linkDirection)) {
      setLinkDirection(availableDirections[0].value);
    }
  }, [availableDirections, linkDirection]);

  useEffect(() => {
    if (linkTargets.some((room) => String(room.id) === linkTargetId)) return;
    setLinkTargetId(linkTargets[0] ? String(linkTargets[0].id) : "");
  }, [linkTargets, linkTargetId]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const refresh = async () => {
    setRooms(await getAllRooms());
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRoom) return;

    const name = draftName.trim();
    if (!name) {
      showToast("error", "Room name is required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateRoomBasics(selectedRoom.id, {
        name,
        sectionId: draftSectionId === 0 ? null : draftSectionId,
      });
      await refresh();
      showToast("success", `Saved "${name}".`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    if (
      !window.confirm(
        `Delete "${selectedRoom.name}"? Its exits, enemies, and interactions will also be removed.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoom(selectedRoom.id);
      setSelectedId(null);
      await refresh();
      showToast("success", `"${selectedRoom.name}" was deleted.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRoom || !linkTargetId) return;

    const target = rooms.find((room) => String(room.id) === linkTargetId);
    if (!target) return;

    setIsLinking(true);
    try {
      await linkRooms(selectedRoom.id, target.id, linkDirection);
      await refresh();
      showToast("success", `Doorway to "${target.name}" added.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveLink = async (neighbor: Room, direction: Directions) => {
    if (!selectedRoom) return;
    if (!window.confirm(`Remove the doorway to "${neighbor.name}"?`)) return;

    setIsLinking(true);
    try {
      await unlinkRooms(selectedRoom.id, neighbor.id, direction);
      await refresh();
      showToast("success", `Doorway to "${neighbor.name}" removed.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsLinking(false);
    }
  };

  const warnings: string[] = [];
  if (selectedRoom) {
    if (selectedNeighbors.length === 0) warnings.push("This room has no exits.");
    if (!selectedRoom.sectionId) warnings.push("This room has no section assigned.");
    if (duplicateNames.has(selectedRoom.name.trim().toLowerCase())) {
      warnings.push("Another room shares this name.");
    }
    if (!selectedRoom.interaction && selectedRoom.enemies.length === 0) {
      warnings.push("This room has no interaction or enemies.");
    }
    for (const [direction, neighbor] of selectedNeighbors) {
      const hasReturn = neighbor.neighboringRooms.some(
        ([returnDirection, returnRoom]) =>
          returnRoom.id === selectedRoom.id && returnDirection === oppositeDirection(direction),
      );
      if (!hasReturn) warnings.push(`The exit to "${neighbor.name}" is one-way.`);
    }

    const sameSection = rooms.filter((room) => room.sectionId === selectedRoom.sectionId);
    const unreachable = findUnreachable(sameSection);
    if (unreachable.some((room) => room.id === selectedRoom.id)) {
      warnings.push("This room is not reachable from the first room in its section.");
    }
  }

  return (
    <>
      <main style={pageStyle}>
        <div style={pageInnerStyle}>
          <AdminPageHeader
            eyebrow="World Builder"
            title="Rooms"
            description="Browse every chamber, fix connections, and keep the map consistent."
            actions={
              <>
                <Link to="/admin/game-design/roomMap" style={secondaryButtonStyle}>
                  View map
                </Link>
                <Link to="/admin/game-design/rooms/new" style={primaryButtonStyle}>
                  + New room
                </Link>
              </>
            }
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section style={panelStyle}>
              <div style={panelHeadingStyle}>Find a room</div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name…"
                aria-label="Search rooms"
                style={searchStyle}
              />
              <select
                value={sectionFilter}
                onChange={(event) =>
                  setSectionFilter(
                    event.target.value === "all" ? "all" : Number(event.target.value),
                  )
                }
                aria-label="Filter rooms by section"
                style={filterStyle}
              >
                <option value="all">All sections</option>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>

              <div style={listStyle}>
                {filteredRooms.map((room) => {
                  const isSelected = room.id === selectedId;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedId(room.id)}
                      style={{
                        ...roomRowStyle,
                        ...(isSelected ? roomRowSelectedStyle : {}),
                      }}
                    >
                      <div style={roomRowTopStyle}>
                        <span style={roomNameStyle}>{room.name}</span>
                        <span style={roomIdStyle}>#{room.id}</span>
                      </div>
                      <div style={roomRowMetaStyle}>
                        <span>{sectionName(room.sectionId)}</span>
                        <span style={badgeStyle}>{interactionLabel(room)}</span>
                        <span>{room.neighboringRooms.length} exits</span>
                      </div>
                    </button>
                  );
                })}

                {filteredRooms.length === 0 && (
                  <div style={emptyListStyle}>No rooms match this filter.</div>
                )}
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {selectedRoom ? (
                <>
                  <div style={panelStyle}>
                    <div style={detailHeaderStyle}>
                      <div>
                        <h2 style={detailTitleStyle}>{selectedRoom.name}</h2>
                        <div style={detailMetaStyle}>
                          Room #{selectedRoom.id} · {sectionName(selectedRoom.sectionId)}
                        </div>
                      </div>
                      <span style={badgeStyle}>{interactionLabel(selectedRoom)}</span>
                    </div>

                    {warnings.length > 0 && (
                      <div style={warningListStyle}>
                        {warnings.map((warning) => (
                          <div key={warning} style={warningItemStyle}>
                            <span style={warningDotStyle} />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={(event) => void handleSave(event)}>
                      <div style={formGridStyle}>
                        <FieldGroup id="roomName" label="Room name">
                          <StyledInput
                            id="roomName"
                            value={draftName}
                            onChange={(event) => setDraftName(event.target.value)}
                          />
                        </FieldGroup>
                        <FieldGroup id="roomSection" label="Section">
                          <StyledSelect
                            id="roomSection"
                            value={draftSectionId}
                            onChange={(event) => setDraftSectionId(Number(event.target.value))}
                          >
                            <option value={0}>No section</option>
                            {availableSections.map((section) => (
                              <option key={section.id} value={section.id}>
                                {section.name}
                              </option>
                            ))}
                          </StyledSelect>
                        </FieldGroup>
                      </div>
                      <div style={formActionsStyle}>
                        <button
                          type="submit"
                          disabled={isSaving || draftName.trim() === selectedRoom.name}
                          style={{
                            ...primaryButtonStyle,
                            opacity: isSaving || draftName.trim() === selectedRoom.name ? 0.5 : 1,
                            cursor:
                              isSaving || draftName.trim() === selectedRoom.name
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isSaving ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div style={panelStyle}>
                    <div style={panelHeadingStyle}>Exits</div>
                    <div style={exitListStyle}>
                      {selectedNeighbors.map(([direction, neighbor]) => (
                        <div key={`${direction}-${neighbor.id}`} style={exitRowStyle}>
                          <span style={directionBadgeStyle}>
                            {DIRECTION_OPTIONS.find(({ value }) => value === direction)?.label ??
                              "Unknown"}
                          </span>
                          <span style={exitNameStyle}>{neighbor.name}</span>
                          <button
                            type="button"
                            onClick={() => void handleRemoveLink(neighbor, direction)}
                            disabled={isLinking}
                            style={dangerSmallButtonStyle}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {selectedNeighbors.length === 0 && (
                        <div style={emptyListStyle}>This room is isolated.</div>
                      )}
                    </div>

                    <form onSubmit={(event) => void handleAddLink(event)} style={addExitStyle}>
                      <div style={panelSubheadingStyle}>Add a doorway</div>
                      {availableDirections.length === 0 || linkTargets.length === 0 ? (
                        <p style={helperTextStyle}>
                          {availableDirections.length === 0
                            ? "All four directions are already in use."
                            : "Every other room is already connected to this one."}
                        </p>
                      ) : (
                        <>
                          <div style={formGridStyle}>
                            <FieldGroup id="linkDirection" label="Direction">
                              <StyledSelect
                                id="linkDirection"
                                value={linkDirection}
                                onChange={(event) =>
                                  setLinkDirection(Number(event.target.value) as Directions)
                                }
                              >
                                {availableDirections.map(({ value, label }) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </StyledSelect>
                            </FieldGroup>
                            <FieldGroup id="linkTarget" label="Destination room">
                              <StyledSelect
                                id="linkTarget"
                                value={linkTargetId}
                                onChange={(event) => setLinkTargetId(event.target.value)}
                              >
                                {linkTargets.map((room) => (
                                  <option key={room.id} value={room.id}>
                                    {room.name} (#{room.id})
                                  </option>
                                ))}
                              </StyledSelect>
                            </FieldGroup>
                          </div>
                          <div style={formActionsStyle}>
                            <button
                              type="submit"
                              disabled={isLinking}
                              style={{
                                ...secondaryButtonStyle,
                                opacity: isLinking ? 0.5 : 1,
                                cursor: isLinking ? "not-allowed" : "pointer",
                              }}
                            >
                              {isLinking ? "Linking…" : "Add doorway"}
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  </div>

                  <div style={panelStyle}>
                    <div style={panelHeadingStyle}>Room contents</div>
                    <div style={contentGridStyle}>
                      <div style={contentStatStyle}>
                        <div style={contentValueStyle}>{selectedRoom.enemies.length}</div>
                        <div style={contentLabelStyle}>Enemies</div>
                      </div>
                      <div style={contentStatStyle}>
                        <div style={contentValueStyle}>
                          {selectedRoom.interaction?.type ?? "None"}
                        </div>
                        <div style={contentLabelStyle}>Interaction</div>
                      </div>
                      <div style={contentStatStyle}>
                        <div style={contentValueStyle}>{selectedNeighbors.length}</div>
                        <div style={contentLabelStyle}>Exits</div>
                      </div>
                    </div>
                    <p style={helperTextStyle}>
                      Edit the enemy roster and interaction below. Changes save to the database
                      immediately.
                    </p>
                  </div>

                  <RoomContents room={selectedRoom} onRefresh={refresh} showToast={showToast} />

                  <div style={{ ...panelStyle, borderColor: "rgba(220,38,38,0.25)" }}>
                    <div style={{ ...panelHeadingStyle, color: "#FCA5A5" }}>Danger zone</div>
                    <p style={helperTextStyle}>
                      Deleting a room also removes its exits, enemies, and interaction.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      style={{
                        ...dangerButtonStyle,
                        opacity: isDeleting ? 0.5 : 1,
                        cursor: isDeleting ? "not-allowed" : "pointer",
                      }}
                    >
                      {isDeleting ? "Deleting…" : "Delete room"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ ...panelStyle, textAlign: "center", padding: 48 }}>
                  <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 10 }}>◇</div>
                  <p style={{ margin: 0, color: colors.muted }}>
                    Select a room to inspect and edit it.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

// Static style objects hoisted out of the render path.
const pageStyle: CSSProperties = {
  minHeight: "100%",
  padding: "36px 28px 72px",
  fontFamily: fonts.body,
};
const pageInnerStyle: CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
};
const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
  padding: 20,
};
const panelHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 14,
};
const panelSubheadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.textMuted,
  fontFamily: fonts.display,
  marginBottom: 10,
};
const searchStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  marginBottom: 8,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 13,
  fontFamily: fonts.body,
  outline: "none",
};
const filterStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  marginBottom: 14,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 13,
  fontFamily: fonts.body,
  outline: "none",
  cursor: "pointer",
};
const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  maxHeight: "65vh",
  overflowY: "auto",
  paddingRight: 2,
};
const roomRowStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 7,
  cursor: "pointer",
  font: "inherit",
  transition: "background 0.15s, border-color 0.15s",
};
const roomRowSelectedStyle: CSSProperties = {
  background: "rgba(212,175,55,0.1)",
  borderColor: colors.goldBorder,
};
const roomRowTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 8,
};
const roomNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const roomIdStyle: CSSProperties = { fontSize: 11, color: "#6B7280", flexShrink: 0 };
const roomRowMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 5,
  fontSize: 11,
  color: colors.muted,
  flexWrap: "wrap",
};
const badgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(212,175,55,0.08)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  color: colors.goldMuted,
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
const emptyListStyle: CSSProperties = {
  padding: "18px 12px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  border: `1px dashed ${colors.subtleBorder}`,
  borderRadius: 7,
};
const detailHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};
const detailTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
};
const detailMetaStyle: CSSProperties = { marginTop: 4, fontSize: 12, color: colors.muted };
const warningListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "10px 12px",
  marginBottom: 16,
  background: "rgba(242,164,68,0.06)",
  border: "1px solid rgba(242,164,68,0.25)",
  borderRadius: 7,
};
const warningItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  color: "#F5C77E",
};
const warningDotStyle: CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: colors.warning,
  flexShrink: 0,
};
const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 14,
};
const formActionsStyle: CSSProperties = { display: "flex", justifyContent: "flex-end" };
const primaryButtonStyle: CSSProperties = {
  display: "inline-block",
  padding: "9px 18px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  textDecoration: "none",
  cursor: "pointer",
};
const secondaryButtonStyle: CSSProperties = {
  display: "inline-block",
  padding: "9px 18px",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  textDecoration: "none",
  cursor: "pointer",
};
const dangerSmallButtonStyle: CSSProperties = {
  padding: "4px 9px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
};
const dangerButtonStyle: CSSProperties = {
  padding: "9px 18px",
  background: "rgba(220,38,38,0.1)",
  border: "1px solid rgba(220,38,38,0.3)",
  borderRadius: 6,
  color: "#FCA5A5",
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
const exitListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 18,
};
const exitRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "7px 10px",
  background: "rgba(0,0,0,0.2)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
};
const directionBadgeStyle: CSSProperties = {
  width: 48,
  fontSize: 10,
  fontWeight: 700,
  color: colors.gold,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
const exitNameStyle: CSSProperties = {
  flex: 1,
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.body,
};
const addExitStyle: CSSProperties = {
  paddingTop: 16,
  borderTop: `1px solid ${colors.subtleBorder}`,
};
const helperTextStyle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: 12,
  lineHeight: 1.5,
  color: colors.muted,
};
const contentGridStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const contentStatStyle: CSSProperties = {
  flex: 1,
  minWidth: 100,
  padding: "12px 14px",
  background: "rgba(0,0,0,0.2)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 7,
};
const contentValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
};
const contentLabelStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 10,
  color: colors.muted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
