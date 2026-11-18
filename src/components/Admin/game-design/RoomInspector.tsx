import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Compass, Trash2 } from "lucide-react";
import { colors, fonts } from "@/theme";
import {
  createRoomWithExits,
  deleteRoom,
  linkRooms,
  setSectionStartRoom,
  unlinkRooms,
  updateRoomBasics,
} from "@/queries/AdminQueries";
import { DIRECTION_OPTIONS, oppositeDirection } from "@/lib/directions";
import { resolveStartRoom } from "@/lib/roomLayout";
import { Directions } from "@/types/Directions";
import { RoomContents } from "./RoomContents";
import { FieldGroup, StyledInput, StyledSelect } from "./create-room/primitives";
import type { Room, Section } from "@/types/Room";
import type { CSSProperties, ReactNode } from "react";

type ToastFn = (type: "success" | "error", message: string) => void;
type InspectorTab = "basics" | "contents" | "exits" | "danger";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

const sectionLabel = (sections: Section[], id: number) =>
  sections.find((section) => section.id === id)?.name ?? "No section";

export interface RoomInspectorProps {
  room: Room;
  rooms: Room[];
  sections: Section[];
  onSelectRoom: (roomId: number | null) => void;
  onRefresh: () => Promise<void>;
  onSectionsChanged?: () => Promise<void> | void;
  onDeleted?: (roomId: number) => void;
  onClose?: () => void;
  showToast: ToastFn;
  variant?: "drawer" | "inline";
}

/**
 * The one room editor used by both the Realm Map drawer and the Rooms page.
 * Basics, contents, exits, and deletion all live here so the two surfaces
 * cannot drift apart.
 */
export function RoomInspector({
  room,
  rooms,
  sections,
  onSelectRoom,
  onRefresh,
  onSectionsChanged,
  onDeleted,
  onClose,
  showToast,
  variant = "inline",
}: RoomInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>("basics");

  const [draftName, setDraftName] = useState(room.name);
  const [draftSectionId, setDraftSectionId] = useState(room.sectionId);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const [linkDirection, setLinkDirection] = useState<Directions>(Directions.North);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [newRoomDirection, setNewRoomDirection] = useState<Directions | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setDraftName(room.name);
    setDraftSectionId(room.sectionId);
    setNewRoomDirection(null);
    setNewRoomName("");
  }, [room.id, room.name, room.sectionId]);

  const section = sections.find((candidate) => candidate.id === room.sectionId) ?? null;
  const sectionRooms = useMemo(
    () => rooms.filter((candidate) => candidate.sectionId === room.sectionId),
    [rooms, room.sectionId],
  );
  const startRoom = resolveStartRoom(sectionRooms, section);

  const diagnostics = useMemo(() => {
    const warnings: string[] = [];
    if (room.neighboringRooms.length === 0) warnings.push("This room has no exits.");
    if (!room.sectionId) warnings.push("This room has no section assigned.");
    if (!room.interaction && room.enemies.length === 0) {
      warnings.push("This room has no interaction or enemies.");
    }

    const duplicate = rooms.some(
      (candidate) =>
        candidate.id !== room.id &&
        candidate.name.trim().toLowerCase() === room.name.trim().toLowerCase(),
    );
    if (duplicate) warnings.push("Another room shares this name.");

    for (const [direction, neighbor] of room.neighboringRooms) {
      const hasReturn = neighbor.neighboringRooms.some(
        ([returnDirection, returnRoom]) =>
          returnRoom.id === room.id && returnDirection === oppositeDirection(direction),
      );
      if (!hasReturn) warnings.push(`The exit to "${neighbor.name}" is one-way.`);
    }

    if (section && startRoom && startRoom.id !== room.id) {
      const graph = new Map(rooms.map((candidate) => [candidate.id, candidate]));
      const reachable = new Set<number>();
      const stack = [startRoom];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (reachable.has(current.id)) continue;
        reachable.add(current.id);
        for (const [, neighbor] of current.neighboringRooms) {
          if (graph.has(neighbor.id) && !reachable.has(neighbor.id)) {
            stack.push(graph.get(neighbor.id)!);
          }
        }
      }
      if (!reachable.has(room.id)) {
        warnings.push(`Not reachable from the section start "${startRoom.name}".`);
      }
    }

    return warnings;
  }, [room, rooms, section, startRoom]);

  const availableDirections = useMemo(
    () =>
      DIRECTION_OPTIONS.filter(
        ({ value }) => !room.neighboringRooms.some(([direction]) => direction === value),
      ),
    [room.neighboringRooms],
  );

  const linkTargets = useMemo(() => {
    const connected = new Set(room.neighboringRooms.map(([, neighbor]) => neighbor.id));
    return rooms.filter((candidate) => candidate.id !== room.id && !connected.has(candidate.id));
  }, [rooms, room]);

  useEffect(() => {
    if (availableDirections.length === 0) return;
    if (!availableDirections.some(({ value }) => value === linkDirection)) {
      setLinkDirection(availableDirections[0].value);
    }
  }, [availableDirections, linkDirection]);

  useEffect(() => {
    if (linkTargets.some((candidate) => String(candidate.id) === linkTargetId)) return;
    setLinkTargetId(linkTargets[0] ? String(linkTargets[0].id) : "");
  }, [linkTargets, linkTargetId]);

  const refreshRoomsAndSections = async () => {
    await onRefresh();
  };

  const handleSaveBasics = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) {
      showToast("error", "Room name is required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateRoomBasics(room.id, {
        name,
        sectionId: draftSectionId === 0 ? null : draftSectionId,
      });
      await refreshRoomsAndSections();
      showToast("success", `Saved "${name}".`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMakeStart = async () => {
    if (!section) {
      showToast("error", "Assign a section before choosing a start room.");
      return;
    }

    try {
      await setSectionStartRoom(section.id, room.id);
      await onRefresh();
      await onSectionsChanged?.();
      showToast("success", `"${room.name}" is now where ${section.name} begins.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    }
  };

  const handleRemoveExit = async (neighbor: Room, direction: Directions) => {
    if (!window.confirm(`Remove the doorway to "${neighbor.name}"?`)) return;
    setIsLinking(true);
    try {
      await unlinkRooms(room.id, neighbor.id, direction);
      await refreshRoomsAndSections();
      showToast("success", `Doorway to "${neighbor.name}" removed.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsLinking(false);
    }
  };

  const handleAddExit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkTargetId) return;
    const target = rooms.find((candidate) => String(candidate.id) === linkTargetId);
    if (!target) return;

    setIsLinking(true);
    try {
      await linkRooms(room.id, target.id, linkDirection);
      await refreshRoomsAndSections();
      showToast("success", `Doorway to "${target.name}" added.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsLinking(false);
    }
  };

  const handleCreateRoom = async (event: React.FormEvent, direction: Directions) => {
    event.preventDefault();
    const name = newRoomName.trim();
    if (!name) {
      showToast("error", "Give the new room a name.");
      return;
    }

    setIsCreating(true);
    try {
      const newRoomId = await createRoomWithExits({
        name,
        sectionId: room.sectionId || null,
        exits: [{ direction, targetRoomId: room.id }],
      });
      await refreshRoomsAndSections();
      setNewRoomDirection(null);
      setNewRoomName("");
      onSelectRoom(newRoomId);
      showToast("success", `"${name}" was created to the ${directionName(direction)}.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete "${room.name}"? Its exits, enemies, and interactions will also be removed.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoom(room.id);
      await refreshRoomsAndSections();
      onDeleted?.(room.id);
      showToast("success", `"${room.name}" was deleted.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const isDrawer = variant === "drawer";

  return (
    <div style={isDrawer ? drawerStyle : inlineStyle}>
      <header style={headerStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={metaStyle}>
            Room #{room.id} · {sectionLabel(sections, room.sectionId)}
            {startRoom?.id === room.id && (
              <span style={startBadgeStyle}>
                <Compass size={11} /> Section start
              </span>
            )}
          </div>
          <h2 style={titleStyle}>{room.name}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Close">
            ×
          </button>
        )}
      </header>

      <div style={tabBarStyle} role="tablist" aria-label="Room inspector">
        {(
          [
            ["basics", "Basics"],
            ["contents", "Contents"],
            ["exits", "Exits"],
            ["danger", "Danger"],
          ] as [InspectorTab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            style={{
              ...tabStyle,
              ...(tab === value ? tabActiveStyle : {}),
              ...(value === "danger" ? dangerTabStyle : {}),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={bodyStyle}>
        {tab === "basics" && (
          <>
            {diagnostics.length > 0 && (
              <div style={warningListStyle}>
                {diagnostics.map((warning) => (
                  <div key={warning} style={warningItemStyle}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={(event) => void handleSaveBasics(event)}>
              <FieldGroup id={`roomName-${room.id}`} label="Room name">
                <StyledInput
                  id={`roomName-${room.id}`}
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </FieldGroup>
              <FieldGroup id={`roomSection-${room.id}`} label="Section">
                <StyledSelect
                  id={`roomSection-${room.id}`}
                  value={draftSectionId}
                  onChange={(event) => setDraftSectionId(Number(event.target.value))}
                >
                  <option value={0}>No section</option>
                  {sections.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </StyledSelect>
              </FieldGroup>

              <div style={actionsStyle}>
                {section && startRoom?.id !== room.id && (
                  <button
                    type="button"
                    onClick={() => void handleMakeStart()}
                    style={secondaryStyle}
                  >
                    Make section start
                  </button>
                )}
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (draftName.trim() === room.name && draftSectionId === room.sectionId)
                  }
                  style={{
                    ...primaryStyle,
                    opacity:
                      isSaving ||
                      (draftName.trim() === room.name && draftSectionId === room.sectionId)
                        ? 0.5
                        : 1,
                  }}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>

            <div style={summaryGridStyle}>
              <Summary label="Enemies" value={String(room.enemies.length)} />
              <Summary label="Interaction" value={room.interaction?.type ?? "None"} />
              <Summary label="Exits" value={String(room.neighboringRooms.length)} />
            </div>
          </>
        )}

        {tab === "contents" && (
          <RoomContents room={room} onRefresh={onRefresh} showToast={showToast} />
        )}

        {tab === "exits" && (
          <>
            <div style={panelHeadingStyle}>Current doorways</div>
            <div style={exitListStyle}>
              {room.neighboringRooms.map(([direction, neighbor]) => (
                <div key={`${direction}-${neighbor.id}`} style={exitRowStyle}>
                  <span style={directionBadgeStyle}>{directionShort(direction)}</span>
                  <button
                    type="button"
                    onClick={() => onSelectRoom(neighbor.id)}
                    style={exitNameStyle}
                  >
                    {neighbor.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemoveExit(neighbor, direction)}
                    disabled={isLinking}
                    style={dangerSmallStyle}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {room.neighboringRooms.length === 0 && (
                <div style={emptyStyle}>This room is isolated.</div>
              )}
            </div>

            <div style={panelHeadingStyle}>Add an existing doorway</div>
            {availableDirections.length === 0 || linkTargets.length === 0 ? (
              <p style={helperStyle}>
                {availableDirections.length === 0
                  ? "All four compass directions are already in use."
                  : "Every other room is already connected to this one."}
              </p>
            ) : (
              <form onSubmit={(event) => void handleAddExit(event)} style={exitFormStyle}>
                <FieldGroup id={`linkDirection-${room.id}`} label="Direction">
                  <StyledSelect
                    id={`linkDirection-${room.id}`}
                    value={linkDirection}
                    onChange={(event) => setLinkDirection(Number(event.target.value) as Directions)}
                  >
                    {availableDirections.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>
                <FieldGroup id={`linkTarget-${room.id}`} label="Destination room">
                  <StyledSelect
                    id={`linkTarget-${room.id}`}
                    value={linkTargetId}
                    onChange={(event) => setLinkTargetId(event.target.value)}
                  >
                    {linkTargets.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} (#{candidate.id})
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>
                <div style={actionsStyle}>
                  <button type="submit" disabled={isLinking} style={secondaryStyle}>
                    {isLinking ? "Linking…" : "Add doorway"}
                  </button>
                </div>
              </form>
            )}

            <div style={{ ...panelHeadingStyle, marginTop: 22 }}>Build a new room</div>
            <p style={helperStyle}>
              Pick an empty compass slot. The doorway is mirrored on both rooms automatically.
            </p>
            <div style={slotGridStyle}>
              {DIRECTION_OPTIONS.map(({ value, label }) => {
                const used = room.neighboringRooms.some(([direction]) => direction === value);
                const active = newRoomDirection === value;
                return (
                  <div key={value} style={{ ...slotStyle, opacity: used ? 0.4 : 1 }}>
                    <button
                      type="button"
                      disabled={used}
                      onClick={() => {
                        setNewRoomDirection(active ? null : value);
                        setNewRoomName("");
                      }}
                      style={{
                        ...slotButtonStyle,
                        ...(active ? slotButtonActiveStyle : {}),
                      }}
                    >
                      {label}
                      <span style={{ fontSize: 10, color: colors.muted }}>
                        {used ? "occupied" : "empty"}
                      </span>
                    </button>
                    {active && (
                      <form
                        onSubmit={(event) => void handleCreateRoom(event, value)}
                        style={{ marginTop: 8 }}
                      >
                        <StyledInput
                          autoFocus
                          value={newRoomName}
                          onChange={(event) => setNewRoomName(event.target.value)}
                          placeholder={`Name for the room to the ${label.toLowerCase()}`}
                          aria-label={`New room name to the ${label.toLowerCase()}`}
                        />
                        <button
                          type="submit"
                          disabled={isCreating || !newRoomName.trim()}
                          style={{
                            ...primaryStyle,
                            width: "100%",
                            marginTop: 8,
                            opacity: isCreating || !newRoomName.trim() ? 0.5 : 1,
                          }}
                        >
                          {isCreating ? "Creating…" : `Create room to the ${label.toLowerCase()}`}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "danger" && (
          <div style={dangerPanelStyle}>
            <div style={{ ...panelHeadingStyle, color: "#FCA5A5" }}>Delete this room</div>
            <p style={helperStyle}>
              Deleting a room removes its exits, attached enemies, and interaction. This cannot be
              undone.
            </p>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              style={{ ...dangerButtonStyle, opacity: isDeleting ? 0.5 : 1 }}
            >
              <Trash2 size={14} />
              {isDeleting ? "Deleting…" : "Delete room"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryStyle}>
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryLabelStyle}>{label}</div>
    </div>
  );
}

function directionShort(direction: Directions): string {
  return DIRECTION_OPTIONS.find(({ value }) => value === direction)?.label.slice(0, 1) ?? "?";
}

function directionName(direction: Directions): string {
  return DIRECTION_OPTIONS.find(({ value }) => value === direction)?.label.toLowerCase() ?? "side";
}

interface WrapperProps {
  children: ReactNode;
}

export function InspectorSection({ title, children }: WrapperProps & { title: string }) {
  return (
    <div>
      <div style={panelHeadingStyle}>{title}</div>
      {children}
    </div>
  );
}

const inlineStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
};
const drawerStyle: CSSProperties = {
  ...inlineStyle,
  height: "100%",
  borderRadius: 0,
  borderTop: "none",
  borderRight: "none",
  borderBottom: "none",
  background: "rgba(13,11,7,0.98)",
};
const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "18px 20px 12px",
  borderBottom: `1px solid ${colors.subtleBorder}`,
};
const metaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  fontSize: 11,
  color: colors.muted,
  marginBottom: 4,
};
const startBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "1px 7px",
  color: colors.gold,
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  fontFamily: fonts.display,
  fontSize: 9,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
};
const closeButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: colors.muted,
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  padding: 0,
};
const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: 2,
  padding: "0 12px",
  borderBottom: `1px solid ${colors.subtleBorder}`,
  flexShrink: 0,
};
const tabStyle: CSSProperties = {
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  borderBottom: "2px solid transparent",
  color: colors.muted,
  fontFamily: fonts.display,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};
const tabActiveStyle: CSSProperties = {
  color: colors.gold,
  borderBottomColor: colors.gold,
};
const dangerTabStyle: CSSProperties = { color: "#FCA5A5" };
const bodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: 20,
};
const panelHeadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 10,
};
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
  alignItems: "flex-start",
  gap: 7,
  fontSize: 12,
  lineHeight: 1.4,
  color: "#F5C77E",
};
const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 4,
};
const primaryStyle: CSSProperties = {
  padding: "9px 16px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  cursor: "pointer",
};
const secondaryStyle: CSSProperties = {
  padding: "9px 16px",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  cursor: "pointer",
};
const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 20,
};
const summaryStyle: CSSProperties = {
  padding: "10px 12px",
  background: "rgba(0,0,0,0.2)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 7,
};
const summaryValueStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  textTransform: "capitalize",
};
const summaryLabelStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 9,
  color: colors.muted,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
const helperStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 12,
  lineHeight: 1.5,
  color: colors.muted,
};
const exitListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 20,
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
  width: 24,
  fontSize: 10,
  fontWeight: 700,
  color: colors.gold,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
const exitNameStyle: CSSProperties = {
  flex: 1,
  textAlign: "left",
  background: "none",
  border: "none",
  padding: 0,
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.body,
  cursor: "pointer",
};
const dangerSmallStyle: CSSProperties = {
  padding: "4px 9px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const emptyStyle: CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  border: `1px dashed ${colors.subtleBorder}`,
  borderRadius: 7,
};
const exitFormStyle: CSSProperties = {
  paddingTop: 14,
  borderTop: `1px solid ${colors.subtleBorder}`,
};
const slotGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};
const slotStyle: CSSProperties = {
  padding: 8,
  background: "rgba(0,0,0,0.18)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 7,
};
const slotButtonStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "6px 8px",
  background: "transparent",
  border: "none",
  color: colors.textMuted,
  fontFamily: fonts.display,
  fontSize: 11,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  cursor: "pointer",
};
const slotButtonActiveStyle: CSSProperties = {
  color: colors.gold,
};
const dangerPanelStyle: CSSProperties = {
  padding: 16,
  background: "rgba(220,38,38,0.05)",
  border: "1px solid rgba(220,38,38,0.2)",
  borderRadius: 8,
};
const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 16px",
  background: "rgba(220,38,38,0.1)",
  border: "1px solid rgba(220,38,38,0.3)",
  borderRadius: 6,
  color: "#FCA5A5",
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  cursor: "pointer",
};
