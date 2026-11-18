import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Search } from "lucide-react";
import { getAdminNpcSummaries } from "@/queries/AdminDialogueQueries";
import { getAdminEnemies } from "@/queries/AdminEnemyQueries";
import { getAllItems } from "@/queries/ItemQueries";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import { oppositeDirection } from "@/lib/directions";
import { adminNavItems } from "./adminNav";
import { AdminPageHeader } from "./ui/AdminPrimitives";
import {
  adminPageStyle,
  adminPanelStyle,
  adminPrimaryButtonStyle,
  adminSectionHeadingStyle,
} from "./ui/adminStyles";
import type { CSSProperties } from "react";

interface ContentCounts {
  items: number;
  enemies: number;
  npcs: number;
}

interface Warning {
  key: string;
  label: string;
  count: number;
  detail: string;
  to: string;
}

export default function Admin() {
  const { openSearch } = useOutletContext<{ openSearch: () => void }>();
  const rooms = useGameStore((state) => state.rooms);
  const sections = useGameStore((state) => state.availableSections);
  const [counts, setCounts] = useState<ContentCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getAllItems(), getAdminEnemies(), getAdminNpcSummaries()])
      .then(([items, enemies, npcs]) => {
        if (!cancelled) {
          setCounts({ items: items.length, enemies: enemies.length, npcs: npcs.length });
        }
      })
      .catch(() => {
        // Counts are decorative; keep the dashboard usable if one query fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const duplicateNames = useMemo(() => {
    const byName = new Map<string, string[]>();
    for (const room of rooms) {
      const key = room.name.trim().toLowerCase();
      byName.set(key, [...(byName.get(key) ?? []), room.name]);
    }
    return [...byName.values()].filter((names) => names.length > 1);
  }, [rooms]);

  const warnings = useMemo<Warning[]>(() => {
    const isolated = rooms.filter((room) => room.neighboringRooms.length === 0);
    const unassigned = rooms.filter((room) => !room.sectionId);
    const empty = rooms.filter((room) => !room.interaction && room.enemies.length === 0);
    const oneWay = rooms.flatMap((room) =>
      room.neighboringRooms
        .filter(([direction, neighbor]) => {
          const returnDirection = oppositeDirection(direction);
          return !neighbor.neighboringRooms.some(
            ([backDirection, backRoom]) =>
              backRoom.id === room.id && backDirection === returnDirection,
          );
        })
        .map(([, neighbor]) => ({ room, neighbor })),
    );

    const list: Warning[] = [];
    if (isolated.length > 0) {
      list.push({
        key: "isolated",
        label: "Rooms with no exits",
        count: isolated.length,
        detail: isolated
          .slice(0, 3)
          .map((room) => room.name)
          .join(", "),
        to: `/admin/game-design/rooms?room=${isolated[0].id}`,
      });
    }
    if (duplicateNames.length > 0) {
      list.push({
        key: "duplicate",
        label: "Duplicate room names",
        count: duplicateNames.length,
        detail: duplicateNames
          .slice(0, 3)
          .map((names) => names[0])
          .join(", "),
        to: "/admin/game-design/rooms",
      });
    }
    if (oneWay.length > 0) {
      list.push({
        key: "one-way",
        label: "One-way exits",
        count: oneWay.length,
        detail: oneWay
          .slice(0, 3)
          .map(({ room, neighbor }) => `${room.name} → ${neighbor.name}`)
          .join(", "),
        to: `/admin/game-design/rooms?room=${oneWay[0].room.id}`,
      });
    }
    if (empty.length > 0) {
      list.push({
        key: "empty",
        label: "Empty rooms",
        count: empty.length,
        detail: empty
          .slice(0, 3)
          .map((room) => room.name)
          .join(", "),
        to: `/admin/game-design/rooms?room=${empty[0].id}`,
      });
    }
    if (unassigned.length > 0) {
      list.push({
        key: "unassigned",
        label: "Rooms without a section",
        count: unassigned.length,
        detail: unassigned
          .slice(0, 3)
          .map((room) => room.name)
          .join(", "),
        to: `/admin/game-design/rooms?room=${unassigned[0].id}`,
      });
    }
    return list;
  }, [rooms, duplicateNames]);

  const recentRooms = useMemo(() => [...rooms].sort((a, b) => b.id - a.id).slice(0, 6), [rooms]);

  const stats = [
    { label: "Rooms", value: rooms.length, to: "/admin/game-design/rooms" },
    { label: "Sections", value: sections.length, to: "/admin/game-design/sections" },
    { label: "Items", value: counts?.items, to: "/admin/game-design/items" },
    { label: "Enemies", value: counts?.enemies, to: "/admin/game-design/enemies" },
    { label: "NPCs", value: counts?.npcs, to: "/admin/game-design/dialogues" },
  ];

  const shortcuts = adminNavItems.filter((item) => item.group !== "Overview");

  return (
    <main style={adminPageStyle}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <AdminPageHeader
          eyebrow="Admin Console"
          title="Overview"
          description="Everything you can edit, in one place."
          actions={
            <>
              <button type="button" onClick={openSearch} style={searchButtonStyle}>
                <Search size={14} />
                Search everything
                <kbd style={searchKbdStyle}>⌘K</kbd>
              </button>
              <Link to="/admin/game-design/roomMap" style={adminPrimaryButtonStyle}>
                Open Realm Map
              </Link>
            </>
          }
        />

        <div style={statsGridStyle}>
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.to} className="admin-card" style={statCardStyle}>
              <span style={statValueStyle}>{stat.value ?? "—"}</span>
              <span style={statLabelStyle}>{stat.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section style={adminPanelStyle}>
            <div style={panelHeaderStyle}>
              <div style={adminSectionHeadingStyle}>Needs attention</div>
              <span style={badgeStyle}>{warnings.length === 0 ? "clear" : warnings.length}</span>
            </div>

            {warnings.length === 0 ? (
              <div style={clearStateStyle}>
                <CheckCircle2 size={18} style={{ color: colors.success }} />
                <span>No structural warnings. The realm looks tidy.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {warnings.map((warning) => (
                  <Link key={warning.key} to={warning.to} style={warningRowStyle}>
                    <AlertTriangle
                      size={15}
                      style={{ color: colors.warning, flexShrink: 0, marginTop: 1 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={warningLabelStyle}>
                        {warning.label} · {warning.count}
                      </span>
                      <span style={warningDetailStyle}>{warning.detail}</span>
                    </span>
                    <ArrowRight size={13} style={{ color: colors.muted, flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section style={adminPanelStyle}>
            <div style={panelHeaderStyle}>
              <div style={adminSectionHeadingStyle}>Recently added rooms</div>
              <Link to="/admin/game-design/rooms" style={smallLinkStyle}>
                View all
              </Link>
            </div>

            {recentRooms.length === 0 ? (
              <div style={mutedTextStyle}>No rooms yet. Start on the Realm Map.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentRooms.map((room) => (
                  <Link
                    key={room.id}
                    to={`/admin/game-design/rooms?room=${room.id}`}
                    style={roomRowStyle}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={roomNameStyle}>{room.name}</span>
                      <span style={roomMetaStyle}>
                        {sections.find((section) => section.id === room.sectionId)?.name ??
                          "No section"}{" "}
                        · {room.neighboringRooms.length} exits
                      </span>
                    </span>
                    <span style={roomIdStyle}>#{room.id}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <section style={{ marginTop: 28 }}>
          <div style={shortcutHeadingStyle}>Jump into a workspace</div>
          <div style={shortcutGridStyle}>
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="admin-card" style={shortcutCardStyle}>
                  <span style={shortcutIconStyle}>
                    <Icon size={17} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={shortcutLabelStyle}>{item.label}</span>
                    <span style={shortcutDescriptionStyle}>{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

const searchButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.textMuted,
  fontSize: 12,
  fontFamily: fonts.body,
  cursor: "pointer",
};
const searchKbdStyle: CSSProperties = {
  padding: "1px 5px",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 4,
  color: colors.goldMuted,
  fontSize: 9,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
};
const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
  marginBottom: 24,
};
const statCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 9,
  textDecoration: "none",
};
const statValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  lineHeight: 1,
};
const statLabelStyle: CSSProperties = {
  fontSize: 10,
  color: colors.muted,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 12,
};
const badgeStyle: CSSProperties = {
  padding: "2px 8px",
  background: "rgba(212,175,55,0.08)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  color: colors.goldMuted,
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
const clearStateStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "14px 12px",
  background: "rgba(5,150,105,0.06)",
  border: "1px solid rgba(5,150,105,0.2)",
  borderRadius: 8,
  color: "#A7F3D0",
  fontSize: 12,
};
const warningRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  padding: "9px 10px",
  background: "rgba(242,164,68,0.05)",
  border: "1px solid rgba(242,164,68,0.18)",
  borderRadius: 7,
  textDecoration: "none",
};
const warningLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#F5C77E",
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const warningDetailStyle: CSSProperties = {
  display: "block",
  marginTop: 2,
  fontSize: 10,
  color: colors.muted,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const mutedTextStyle: CSSProperties = { fontSize: 12, color: colors.muted, lineHeight: 1.6 };
const smallLinkStyle: CSSProperties = {
  fontSize: 11,
  color: colors.goldMuted,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  textDecoration: "none",
};
const roomRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 6,
  textDecoration: "none",
};
const roomNameStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const roomMetaStyle: CSSProperties = { display: "block", fontSize: 10, color: colors.muted };
const roomIdStyle: CSSProperties = { fontSize: 10, color: "#6B7280", flexShrink: 0 };
const shortcutHeadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 12,
};
const shortcutGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 10,
};
const shortcutCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 8,
  textDecoration: "none",
};
const shortcutIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(212,175,55,0.08)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 7,
  color: colors.goldMuted,
};
const shortcutLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
};
const shortcutDescriptionStyle: CSSProperties = {
  display: "block",
  marginTop: 2,
  fontSize: 10,
  color: colors.muted,
  lineHeight: 1.4,
};
