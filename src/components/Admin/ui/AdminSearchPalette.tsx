import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, MessageSquare, Package, Search, Swords, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getAdminNpcSummaries } from "@/queries/AdminDialogueQueries";
import { getAdminEnemies } from "@/queries/AdminEnemyQueries";
import { getAllItems } from "@/queries/ItemQueries";
import { getAllRooms } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";

type ResultKind = "room" | "item" | "enemy" | "npc";

interface SearchResult {
  key: string;
  kind: ResultKind;
  label: string;
  meta: string;
  href: string;
}

interface SearchIndex {
  rooms: SearchResult[];
  items: SearchResult[];
  enemies: SearchResult[];
  npcs: SearchResult[];
}

const KIND_LABELS: Record<ResultKind, string> = {
  room: "Rooms",
  item: "Items",
  enemy: "Enemies",
  npc: "NPCs",
};

const KIND_ICONS: Record<ResultKind, LucideIcon> = {
  room: DoorOpen,
  item: Package,
  enemy: Swords,
  npc: MessageSquare,
};

const GROUP_ORDER: ResultKind[] = ["room", "item", "enemy", "npc"];

const KIND_KEYS: Record<ResultKind, keyof SearchIndex> = {
  room: "rooms",
  item: "items",
  enemy: "enemies",
  npc: "npcs",
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Could not load admin content.";

interface AdminSearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSearchPalette({ open, onOpenChange }: AdminSearchPaletteProps) {
  const navigate = useNavigate();
  const availableSections = useGameStore((state) => state.availableSections);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || index !== null) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void Promise.all([getAllRooms(), getAllItems(), getAdminEnemies(), getAdminNpcSummaries()])
      .then(([rooms, items, enemies, npcs]) => {
        if (cancelled) return;

        const sectionName = (id: number) =>
          availableSections.find((section) => section.id === id)?.name ?? "No section";

        setIndex({
          rooms: rooms.map((room) => ({
            key: `room-${room.id}`,
            kind: "room",
            label: room.name,
            meta: `${sectionName(room.sectionId)} · ${room.neighboringRooms.length} exits`,
            href: `/admin/game-design/rooms?room=${room.id}`,
          })),
          items: items.map((item) => ({
            key: `item-${item.id}`,
            kind: "item",
            label: item.name,
            meta: `${item.type} · ${item.value} GP`,
            href: `/admin/game-design/items?item=${encodeURIComponent(item.id)}`,
          })),
          enemies: enemies.map((enemy) => ({
            key: `enemy-${enemy.id}`,
            kind: "enemy",
            label: enemy.name,
            meta: `${enemy.type} · ${enemy.health} HP`,
            href: `/admin/game-design/enemies?enemy=${enemy.id}`,
          })),
          npcs: npcs.map((npc) => ({
            key: `npc-${npc.id}`,
            kind: "npc",
            label: npc.name,
            meta: `${npc.npc_type}${npc.dialogueTreeId ? " · dialogue tree" : ""}`,
            href: `/admin/game-design/dialogues?npc=${npc.id}`,
          })),
        });
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, index, availableSections]);

  const filtered = useMemo(() => {
    if (!index) return null;
    const needle = query.trim().toLowerCase();

    const filterList = (results: SearchResult[]) => {
      const matches = needle
        ? results.filter(
            (result) =>
              result.label.toLowerCase().includes(needle) ||
              result.meta.toLowerCase().includes(needle),
          )
        : results;
      return matches.slice(0, needle ? 8 : 5);
    };

    return {
      rooms: filterList(index.rooms),
      items: filterList(index.items),
      enemies: filterList(index.enemies),
      npcs: filterList(index.npcs),
    };
  }, [index, query]);

  const flatResults = useMemo(() => {
    if (!filtered) return [];
    return GROUP_ORDER.flatMap((kind) => filtered[KIND_KEYS[kind]]);
  }, [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const goToResult = (result: SearchResult | undefined) => {
    if (!result) return;
    onOpenChange(false);
    void navigate(result.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(flatResults.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      goToResult(flatResults[activeIndex]);
    }
  };

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl gap-0 overflow-hidden p-0"
        style={paletteStyle}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Search admin content</DialogTitle>
        <DialogDescription className="sr-only">
          Search rooms, items, enemies, and NPCs.
        </DialogDescription>

        <div style={searchRowStyle}>
          <Search size={16} style={{ color: colors.goldMuted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search rooms, items, enemies, NPCs…"
            aria-label="Search admin content"
            style={inputStyle}
          />
          <kbd style={kbdStyle}>esc</kbd>
        </div>

        <div ref={listRef} style={resultsStyle}>
          {isLoading && <div style={emptyStyle}>Loading content…</div>}
          {error && <div style={{ ...emptyStyle, color: "#FCA5A5" }}>{error}</div>}
          {!isLoading && !error && flatResults.length === 0 && (
            <div style={emptyStyle}>No matches for “{query.trim()}”.</div>
          )}

          {filtered &&
            GROUP_ORDER.map((kind) => {
              const results = filtered[KIND_KEYS[kind]];
              if (results.length === 0) return null;
              const Icon = KIND_ICONS[kind];

              return (
                <div key={kind} style={groupStyle}>
                  <div style={groupHeadingStyle}>{KIND_LABELS[kind]}</div>
                  {results.map((result) => {
                    const itemIndex = flatIndex++;
                    const isActive = itemIndex === activeIndex;
                    return (
                      <button
                        key={result.key}
                        type="button"
                        data-search-index={itemIndex}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => goToResult(result)}
                        style={{ ...resultRowStyle, ...(isActive ? resultRowActiveStyle : {}) }}
                      >
                        <span style={resultIconStyle}>
                          <Icon size={15} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={resultLabelStyle}>{result.label}</span>
                          <span style={resultMetaStyle}>{result.meta}</span>
                        </span>
                        <span style={enterHintStyle}>↵</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div style={footerStyle}>
          <span>↑↓ to move · ↵ to open</span>
          <span>⌘K to toggle</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const paletteStyle: React.CSSProperties = {
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 100%)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 12,
  boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
  color: colors.text,
  fontFamily: fonts.body,
};
const searchRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 16px",
  borderBottom: `1px solid ${colors.goldBorder}`,
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "transparent",
  border: "none",
  outline: "none",
  color: colors.text,
  fontSize: 14,
  fontFamily: fonts.body,
};
const kbdStyle: React.CSSProperties = {
  padding: "2px 6px",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 4,
  color: colors.muted,
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
};
const resultsStyle: React.CSSProperties = {
  maxHeight: "60vh",
  overflowY: "auto",
  padding: "8px",
};
const groupStyle: React.CSSProperties = { marginBottom: 8 };
const groupHeadingStyle: React.CSSProperties = {
  padding: "6px 8px 4px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
};
const resultRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "8px 10px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 7,
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
  color: colors.text,
};
const resultRowActiveStyle: React.CSSProperties = {
  background: "rgba(212,175,55,0.1)",
  borderColor: colors.goldBorder,
};
const resultIconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  color: colors.goldMuted,
};
const resultLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const resultMetaStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  color: colors.muted,
  textTransform: "capitalize",
};
const enterHintStyle: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(168,145,106,0.6)",
  fontFamily: fonts.display,
};
const emptyStyle: React.CSSProperties = {
  padding: "28px 16px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
};
const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 14px",
  borderTop: `1px solid ${colors.goldBorder}`,
  color: colors.muted,
  fontSize: 10,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
