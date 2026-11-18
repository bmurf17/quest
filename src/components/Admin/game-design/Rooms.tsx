import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllRooms, getSections } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { Toast } from "./create-room/Toast";
import { RoomInspector } from "./RoomInspector";
import { AdminPageHeader } from "@/components/Admin/ui/AdminPrimitives";
import type { Room } from "@/types/Room";
import type { CSSProperties } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;

const interactionLabel = (room: Room) => {
  if (room.interaction) {
    return room.interaction.type === "NPC" ? "NPC" : room.interaction.type;
  }
  return room.enemies.length > 0 ? "Combat" : "Empty";
};

/**
 * Alternate list view for the Realm Map. Selecting a room reuses the same
 * RoomInspector the map drawer uses.
 */
export default function Rooms() {
  const rooms = useGameStore((state) => state.rooms);
  const availableSections = useGameStore((state) => state.availableSections);
  const setRooms = useGameStore((state) => state.setRooms);
  const loadSections = useGameStore((state) => state.loadSections);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const id = Number(searchParams.get("room"));
    return Number.isFinite(id) && id > 0 ? id : null;
  });
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<"all" | number>("all");
  const [toast, setToast] = useState<ToastState>(null);

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

  const sectionName = (id: number) =>
    availableSections.find((section) => section.id === id)?.name ?? "No section";

  useEffect(() => {
    if (selectedRoom && rooms.some((room) => room.id === selectedRoom.id)) return;
    if (rooms.length > 0) setSelectedId(rooms[0].id);
  }, [rooms, selectedRoom]);

  // Keep selection in sync when the URL changes (search palette, browser back).
  useEffect(() => {
    const fromUrl = Number(searchParams.get("room"));
    if (Number.isFinite(fromUrl) && fromUrl > 0 && fromUrl !== selectedId) {
      setSelectedId(fromUrl);
    }
    // selectedId intentionally omitted: this only reacts to URL navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (selectedId === null) return;
    if (searchParams.get("room") === String(selectedId)) return;
    const next = new URLSearchParams(searchParams);
    next.set("room", String(selectedId));
    setSearchParams(next, { replace: true });
  }, [selectedId, searchParams, setSearchParams]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const refresh = async () => {
    const [nextRooms, nextSections] = await Promise.all([getAllRooms(), getSections()]);
    setRooms(nextRooms);
    loadSections(nextSections);
  };

  return (
    <>
      <main style={pageStyle}>
        <div style={pageInnerStyle}>
          <AdminPageHeader
            eyebrow="World Builder"
            title="Rooms"
            description="Alternate list view of the Realm Map. Every editor here is the same one the map uses."
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

            <section style={{ minWidth: 0 }}>
              {selectedRoom ? (
                <RoomInspector
                  room={selectedRoom}
                  rooms={rooms}
                  sections={availableSections}
                  onSelectRoom={(roomId) => setSelectedId(roomId)}
                  onRefresh={refresh}
                  onSectionsChanged={refresh}
                  onDeleted={() => setSelectedId(null)}
                  showToast={showToast}
                />
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
