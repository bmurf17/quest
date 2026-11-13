import { NavLink, Outlet } from "react-router-dom";
import { DoorOpen, LayoutDashboard, Layers, Map, MessageSquare, Package, Swords, DatabaseBackup, ArrowLeft } from "lucide-react";
import { colors, fonts } from "@/theme";

const navItems = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Rooms", to: "/admin/game-design/rooms", icon: DoorOpen },
  { label: "Realm Map", to: "/admin/game-design/roomMap", icon: Map },
  { label: "Sections", to: "/admin/game-design/sections", icon: Layers },
  { label: "Items", to: "/admin/game-design/items", icon: Package },
  { label: "Enemies", to: "/admin/game-design/enemies", icon: Swords },
  { label: "Dialogues", to: "/admin/game-design/dialogues", icon: MessageSquare },
  { label: "Backup", to: "/admin/game-design/backup", icon: DatabaseBackup },
];

export function AdminLayout() {
  return (
    <div
      className="flex h-[calc(100vh-52px)] flex-col overflow-hidden md:flex-row"
      style={{ background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)" }}
    >
      <aside
        className="flex shrink-0 flex-col border-b md:border-b-0 md:border-r"
        style={{ borderColor: colors.goldBorder, background: "rgba(10,9,6,0.55)" }}
      >
        <div className="hidden px-5 pb-3 pt-5 md:block">
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: colors.goldMuted,
            }}
          >
            Admin Console
          </div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Shape the realm</div>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-0.5 md:px-2 md:pb-4">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm no-underline transition-colors"
              style={({ isActive }) => ({
                fontFamily: fonts.display,
                letterSpacing: "0.03em",
                color: isActive ? colors.gold : colors.textMuted,
                background: isActive ? "rgba(212,175,55,0.1)" : "transparent",
                border: `1px solid ${isActive ? colors.goldBorder : "transparent"}`,
              })}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden p-3 md:block">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs no-underline transition-colors hover:bg-white/5"
            style={{ color: colors.muted, fontFamily: fonts.display, letterSpacing: "0.04em" }}
          >
            <ArrowLeft size={13} />
            Back to game
          </NavLink>
        </div>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
