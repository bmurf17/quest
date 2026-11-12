import { useState, useCallback, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { colors, fonts } from "@/theme";
import { useGameStore } from "@/state/GameState";
import {
  saveToSlot,
  getSaveKeys,
  getSaveLabel,
  deleteSave,
  getSaveData,
  peekSaveData,
  exportSaveAsJson,
  importSaveFromJson,
  SaveDataError,
} from "@/state/saveLoad";

const btnBase: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 11,
  fontFamily: fonts.body,
  fontWeight: 600,
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  cursor: "pointer",
  background: "transparent",
  color: colors.text,
  transition: "background 0.15s",
};

export default function DevPanel() {
  const loadGame = useGameStore((s) => s.loadGame);
  const [saves, setSaves] = useState<string[]>([]);
  const [newSlotName, setNewSlotName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setSaves(getSaveKeys());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const flash = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const handleSave = useCallback(
    (slot: string) => {
      saveToSlot(slot);
      refresh();
      flash(`Saved: ${slot}`);
    },
    [refresh, flash],
  );

  const handleLoad = useCallback(
    (slot: string) => {
      try {
        const data = getSaveData(slot);
        if (!data) {
          flash("Save not found");
          return;
        }
        loadGame(data);
        flash(`Loaded: ${slot}`);
      } catch (error) {
        flash(error instanceof SaveDataError ? error.message : "Failed to load save");
      }
    },
    [loadGame, flash],
  );

  const handleDelete = useCallback(
    (slot: string) => {
      deleteSave(slot);
      refresh();
      flash(`Deleted: ${slot}`);
    },
    [refresh, flash],
  );

  const handleCreateNew = useCallback(() => {
    const trimmed = newSlotName.trim();
    if (!trimmed) return;
    handleSave(trimmed);
    setNewSlotName("");
  }, [newSlotName, handleSave]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      importSaveFromJson(file)
        .then((slot) => {
          refresh();
          flash(`Imported: ${slot}`);
        })
        .catch((error) => {
          flash(error instanceof SaveDataError ? error.message : "Import failed");
        });
      e.target.value = "";
    },
    [refresh, flash],
  );

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div style={devPanelStyle}>
      <div style={devPanelStyle2}>
        <span style={devPanelStyle3}>Dev Panel</span>
      </div>

      {message && <div style={devPanelStyle4}>{message}</div>}

      <div style={devPanelStyle5}>
        <div style={devPanelStyle6}>
          <input
            value={newSlotName}
            onChange={(e) => setNewSlotName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
            placeholder="New save name..."
            style={devPanelStyle7}
          />
          <button onClick={handleCreateNew} style={btnBase}>
            Save
          </button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button onClick={() => fileRef.current?.click()} style={{ ...btnBase, fontSize: 10 }}>
            Import JSON
          </button>
        </div>
      </div>

      <div style={devPanelStyle8}>
        {saves.length === 0 && <div style={devPanelStyle9}>No saves yet.</div>}
        {saves.map((slot) => {
          const label = getSaveLabel(slot);
          const data = peekSaveData(slot);
          return (
            <div key={slot} style={devPanelStyle10}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={devPanelStyle11}>{label || slot}</div>
                {data && <div style={devPanelStyle12}>{formatDate(data.timestamp)}</div>}
              </div>
              <div style={devPanelStyle13}>
                <button
                  onClick={() => handleSave(slot)}
                  style={{ ...btnBase, fontSize: 9, padding: "3px 7px" }}
                  title="Overwrite save"
                >
                  Save
                </button>
                <button
                  onClick={() => handleLoad(slot)}
                  style={{
                    ...btnBase,
                    fontSize: 9,
                    padding: "3px 7px",
                    color: colors.success,
                    borderColor: "rgba(52,211,153,0.3)",
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => exportSaveAsJson(slot)}
                  style={{ ...btnBase, fontSize: 9, padding: "3px 7px" }}
                  title="Export as JSON file"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(slot)}
                  style={{
                    ...btnBase,
                    fontSize: 9,
                    padding: "3px 7px",
                    color: colors.danger,
                    borderColor: "rgba(239,68,68,0.3)",
                  }}
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const devPanelStyle: CSSProperties = {
  position: "fixed",
  top: 56,
  right: 12,
  width: 360,
  maxHeight: "calc(100vh - 70px)",
  background: "rgba(10,9,6,0.97)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 8,
  zIndex: 200,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
};
const devPanelStyle2: CSSProperties = {
  padding: "10px 12px",
  borderBottom: `1px solid ${colors.goldBorder}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexShrink: 0,
};
const devPanelStyle3: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.gold,
  fontFamily: fonts.display,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};
const devPanelStyle4: CSSProperties = {
  padding: "6px 12px",
  fontSize: 11,
  color: colors.gold,
  background: "rgba(212,175,55,0.08)",
  borderBottom: `1px solid ${colors.goldBorder}`,
};
const devPanelStyle5: CSSProperties = {
  padding: "10px 12px",
  borderBottom: `1px solid ${colors.goldBorder}`,
  flexShrink: 0,
};
const devPanelStyle6: CSSProperties = { display: "flex", gap: 6, marginBottom: 6 };
const devPanelStyle7: CSSProperties = {
  flex: 1,
  padding: "4px 8px",
  fontSize: 11,
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  color: colors.text,
  fontFamily: fonts.body,
  outline: "none",
};
const devPanelStyle8: CSSProperties = { flex: 1, overflowY: "auto", padding: "4px 0" };
const devPanelStyle9: CSSProperties = {
  padding: "20px 12px",
  textAlign: "center",
  fontSize: 11,
  color: colors.textMuted,
};
const devPanelStyle10: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderBottom: `1px solid ${colors.subtleBorder}`,
};
const devPanelStyle11: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: colors.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const devPanelStyle12: CSSProperties = { fontSize: 9, color: colors.textMuted, marginTop: 1 };
const devPanelStyle13: CSSProperties = { display: "flex", gap: 4, flexShrink: 0 };
