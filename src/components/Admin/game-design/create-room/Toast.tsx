import { icons } from "./icons";

export function Toast({
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
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: isSuccess
          ? "rgba(5,150,105,0.15)"
          : "rgba(220,38,38,0.15)",
        border: `1px solid ${isSuccess ? "rgba(5,150,105,0.5)" : "rgba(220,38,38,0.5)"}`,
        borderRadius: 8,
        padding: "12px 16px",
        color: isSuccess ? "#6EE7B7" : "#FCA5A5",
        fontSize: 14,
        backdropFilter: "blur(8px)",
        maxWidth: 360,
      }}
    >
      <span style={{ marginTop: 1 }}>
        {isSuccess ? icons.check : icons.alert}
      </span>
      <div
        style={{
          flex: 1,
          fontFamily: "'Crimson Text', Georgia, serif",
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          fontSize: 18,
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </div>
  );
}
