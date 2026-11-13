import { supabase } from "@/queries/RoomQueries";
import { useGameStore } from "@/state/GameState";
import type { Section } from "@/types/Room";
import { useEffect, useState } from "react";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

function Toast({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isSuccess = type === "success";
  return (
    <div
      role={isSuccess ? "status" : "alert"}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: isSuccess ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.15)",
        border: `1px solid ${isSuccess ? "rgba(5,150,105,0.5)" : "rgba(220,38,38,0.5)"}`,
        borderRadius: 8,
        padding: "12px 16px",
        color: isSuccess ? "#6EE7B7" : "#FCA5A5",
        fontSize: 14,
        backdropFilter: "blur(8px)",
        maxWidth: 360,
      }}
    >
      <div style={toastStyle}>{message}</div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" style={toastStyle2}>
        ×
      </button>
    </div>
  );
}

export default function ManageSections() {
  const availableSections = useGameStore((s) => s.availableSections);
  const loadSections = useGameStore((s) => s.loadSections);

  const [sections, setSections] = useState<Section[]>(availableSections);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setSections(availableSections);
  }, [availableSections]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("sections")
        .insert({ name: newName.trim() })
        .select()
        .single();

      if (error) throw error;

      const updated = [...sections, data as Section];
      setSections(updated);
      loadSections(updated);
      setNewName("");
      showToast("success", `"${data.name}" has been created.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to create section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("sections")
        .update({ name: editName.trim() })
        .eq("id", id);

      if (error) throw error;

      const updated = sections.map((s) => (s.id === id ? { ...s, name: editName.trim() } : s));
      setSections(updated);
      loadSections(updated);
      setEditingId(null);
      showToast("success", "Section updated.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (
      !window.confirm(`Delete section "${name}"? Rooms in this section will lose their assignment.`)
    )
      return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("sections").delete().eq("id", id);

      if (error) throw error;

      const updated = sections.filter((s) => s.id !== id);
      setSections(updated);
      loadSections(updated);
      showToast("success", `"${name}" has been removed.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to delete section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main style={manageSectionsStyle}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <a href="/admin" style={manageSectionsStyle2}>
            ← Back to Admin
          </a>

          <h1 style={manageSectionsStyle3}>Sections</h1>
          <p style={manageSectionsStyle4}>Create and manage exploration sections</p>

          <div style={manageSectionsStyle5}>
            {sections.map((section) => {
              const isEditing = editingId === section.id;
              return (
                <div
                  key={section.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${isEditing ? colors.goldBorder : "rgba(180,140,80,0.12)"}`,
                    borderRadius: 8,
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={manageSectionsStyle6}>{section.id}</div>

                  {isEditing ? (
                    <div style={manageSectionsStyle7}>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleUpdate(section.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        style={manageSectionsStyle8}
                        autoFocus
                      />
                      <button
                        onClick={() => void handleUpdate(section.id)}
                        disabled={isSubmitting || !editName.trim()}
                        style={manageSectionsStyle9}
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} style={manageSectionsStyle10}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={manageSectionsStyle11}>{section.name}</span>
                      <button
                        onClick={() => {
                          setEditingId(section.id);
                          setEditName(section.name);
                        }}
                        style={manageSectionsStyle12}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleDelete(section.id, section.name)}
                        disabled={isSubmitting}
                        style={manageSectionsStyle13}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {sections.length === 0 && (
              <div style={manageSectionsStyle14}>No sections yet. Create one below.</div>
            )}
          </div>

          <div style={manageSectionsStyle15}>
            <div style={manageSectionsStyle16}>Create Section</div>

            <form onSubmit={(e) => void handleCreate(e)} style={{ display: "flex", gap: 10 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Section name"
                style={manageSectionsStyle17}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newName.trim()}
                style={{
                  padding: "10px 20px",
                  background: isSubmitting ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.15)",
                  border: `1px solid ${colors.goldBorder}`,
                  borderRadius: 6,
                  color: colors.gold,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: fonts.display,
                  letterSpacing: "0.05em",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {isSubmitting ? "Creating…" : "Create"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

// Static style objects hoisted out of the render path.
const toastStyle: CSSProperties = {
  flex: 1,
  fontFamily: "'Crimson Text', Georgia, serif",
  lineHeight: 1.5,
};
const toastStyle2: CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  padding: 0,
  fontSize: 18,
  lineHeight: 1,
  opacity: 0.7,
};
const manageSectionsStyle: CSSProperties = {
  minHeight: "100%",
  background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
  padding: "48px 32px 80px",
  fontFamily: fonts.body,
};
const manageSectionsStyle2: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: colors.goldMuted,
  fontSize: 13,
  textDecoration: "none",
  marginBottom: 24,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const manageSectionsStyle3: CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 26,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
};
const manageSectionsStyle4: CSSProperties = {
  margin: 0,
  marginBottom: 32,
  fontSize: 14,
  color: colors.muted,
};
const manageSectionsStyle5: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginBottom: 40,
};
const manageSectionsStyle6: CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(212,175,55,0.1)",
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontFamily: fonts.display,
  fontWeight: 700,
};
const manageSectionsStyle7: CSSProperties = { flex: 1, display: "flex", gap: 8 };
const manageSectionsStyle8: CSSProperties = {
  flex: 1,
  padding: "6px 10px",
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  color: colors.text,
  fontSize: 14,
  fontFamily: fonts.body,
  outline: "none",
};
const manageSectionsStyle9: CSSProperties = {
  padding: "6px 12px",
  background: "rgba(5,150,105,0.15)",
  border: "1px solid rgba(52,211,153,0.25)",
  borderRadius: 4,
  color: "#6EE7B7",
  fontSize: 12,
  fontFamily: fonts.display,
  cursor: "pointer",
  letterSpacing: "0.04em",
};
const manageSectionsStyle10: CSSProperties = {
  padding: "6px 12px",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 4,
  color: colors.muted,
  fontSize: 12,
  fontFamily: fonts.display,
  cursor: "pointer",
  letterSpacing: "0.04em",
};
const manageSectionsStyle11: CSSProperties = {
  flex: 1,
  color: colors.text,
  fontSize: 15,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
};
const manageSectionsStyle12: CSSProperties = {
  padding: "5px 10px",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 4,
  color: colors.goldMuted,
  fontSize: 11,
  fontFamily: fonts.display,
  cursor: "pointer",
  letterSpacing: "0.04em",
};
const manageSectionsStyle13: CSSProperties = {
  padding: "5px 10px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 11,
  fontFamily: fonts.display,
  cursor: "pointer",
  letterSpacing: "0.04em",
};
const manageSectionsStyle14: CSSProperties = {
  padding: "24px 16px",
  background: "rgba(255,255,255,0.02)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 8,
  textAlign: "center",
  color: colors.muted,
  fontSize: 14,
};
const manageSectionsStyle15: CSSProperties = {
  padding: "20px 18px",
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
};
const manageSectionsStyle16: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.gold,
  fontFamily: fonts.display,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 14,
};
const manageSectionsStyle17: CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 14,
  fontFamily: fonts.body,
  outline: "none",
};
