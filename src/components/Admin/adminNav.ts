import {
  DatabaseBackup,
  DoorOpen,
  Layers,
  LayoutDashboard,
  Map,
  MessageSquare,
  Package,
  Swords,
  type LucideIcon,
} from "lucide-react";

export type AdminNavGroup = "Overview" | "World" | "Content" | "Ops";

export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  group: AdminNavGroup;
  description: string;
  end?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Overview",
    to: "/admin",
    icon: LayoutDashboard,
    group: "Overview",
    description: "Counts, warnings, and shortcuts",
    end: true,
  },
  {
    label: "Realm Map",
    to: "/admin/game-design/roomMap",
    icon: Map,
    group: "World",
    description: "Visualise and edit the connected room graph",
  },
  {
    label: "Rooms",
    to: "/admin/game-design/rooms",
    icon: DoorOpen,
    group: "World",
    description: "Browse and edit rooms and their exits",
  },
  {
    label: "Sections",
    to: "/admin/game-design/sections",
    icon: Layers,
    group: "World",
    description: "Manage exploration sections and ordering",
  },
  {
    label: "Items",
    to: "/admin/game-design/items",
    icon: Package,
    group: "Content",
    description: "Create items and control shop stock",
  },
  {
    label: "Enemies",
    to: "/admin/game-design/enemies",
    icon: Swords,
    group: "Content",
    description: "Reusable enemies, bosses, and balance",
  },
  {
    label: "Dialogues",
    to: "/admin/game-design/dialogues",
    icon: MessageSquare,
    group: "Content",
    description: "Build branching conversations",
  },
  {
    label: "Backup",
    to: "/admin/game-design/backup",
    icon: DatabaseBackup,
    group: "Ops",
    description: "Export, snapshot, and restore content",
  },
];

export const adminNavGroups: AdminNavGroup[] = ["Overview", "World", "Content", "Ops"];

export function findAdminNavItem(pathname: string): AdminNavItem | null {
  return (
    [...adminNavItems]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ?? null
  );
}

export interface AdminCrumb {
  label: string;
  to?: string;
}

export function adminBreadcrumbs(pathname: string): AdminCrumb[] {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/admin") return [{ label: "Admin", to: "/admin" }];

  const item = findAdminNavItem(normalized);
  const crumbs: AdminCrumb[] = [{ label: "Admin", to: "/admin" }];

  if (item && item.to !== "/admin") {
    crumbs.push({ label: "Game Design" });
    crumbs.push({ label: item.label, to: item.to });
  }

  if (normalized.endsWith("/rooms/new")) {
    crumbs.push({ label: "New room" });
  }

  return crumbs;
}
