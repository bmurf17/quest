import { useGameStore } from "@/state/GameState";
import { colors, fonts } from "@/theme";
import type { CSSProperties } from "react";

export default function CutsceneOverlay() {
  const activeCutscene = useGameStore((state) => state.activeCutscene);
  const cutsceneSceneIndex = useGameStore((state) => state.cutsceneSceneIndex);
  const advanceCutsceneScene = useGameStore(
    (state) => state.advanceCutsceneScene,
  );

  if (!activeCutscene) return null;

  const scene = activeCutscene.scenes[cutsceneSceneIndex];
  const isLastScene = cutsceneSceneIndex >= activeCutscene.scenes.length - 1;
  const hasNextCutscene = !!activeCutscene.nextCutsceneId;
  const buttonLabel = isLastScene
    ? hasNextCutscene
      ? "Continue"
      : "Return"
    : "Continue";

  return (
    <div
      style={cutsceneOverlayStyle}
    >
      <div
        style={cutsceneOverlayStyle2}
      >
        <div
          style={cutsceneOverlayStyle3}
        >
          {scene.text}
        </div>

        <div
          style={cutsceneOverlayStyle4}
        >
          <div
            style={cutsceneOverlayStyle5}
          >
            {cutsceneSceneIndex + 1} / {activeCutscene.scenes.length}
          </div>

          <button
            onClick={advanceCutsceneScene}
            style={cutsceneOverlayStyle6}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Static style objects hoisted out of the render path.
const cutsceneOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  background:
    "radial-gradient(ellipse at center, rgba(10,8,6,0.85) 0%, rgba(5,4,3,0.95) 100%)",
  padding: "64px",
};
const cutsceneOverlayStyle2: CSSProperties = {
  maxWidth: 640,
  width: "100%",
  textAlign: "center",
};
const cutsceneOverlayStyle3: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.7,
  color: colors.text,
  fontFamily: fonts.body,
  marginBottom: 48,
  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
  whiteSpace: "pre-wrap",
};
const cutsceneOverlayStyle4: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  flexDirection: "column",
};
const cutsceneOverlayStyle5: CSSProperties = {
  fontSize: 12,
  color: colors.textMuted,
  fontFamily: fonts.body,
  letterSpacing: "0.1em",
};
const cutsceneOverlayStyle6: CSSProperties = {
  padding: "12px 48px",
  background: colors.gold,
  color: "#111009",
  border: "none",
  borderRadius: 4,
  fontFamily: fonts.display,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.12em",
  cursor: "pointer",
  textTransform: "uppercase",
  transition: "opacity 0.2s",
};
