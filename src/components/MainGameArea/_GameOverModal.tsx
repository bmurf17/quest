import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameStore } from "@/state/GameState";
import { GameStatus } from "@/types/GameStatus";
import { colors, fonts } from "@/theme";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Skull } from "lucide-react";

function GameOverModalComponent() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const navigate = useNavigate();

  if (gameStatus !== GameStatus.GameOver) return null;

  const handleRestart = () => {
    navigate("/party");
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        style={{
          maxWidth: 420,
          background: "linear-gradient(160deg, #1a0a0a 0%, #2d1515 100%)",
          border: `1px solid ${colors.danger}`,
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          fontFamily: fonts.body,
          color: colors.text,
          textAlign: "center",
        }}
      >
        <DialogHeader
          style={{
            padding: "32px 24px 20px",
            borderBottom: `1px solid ${colors.danger}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.15)",
                border: `2px solid ${colors.danger}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Skull
                size={36}
                color={colors.danger}
                strokeWidth={1.5}
              />
            </div>
          </div>

          <DialogTitle
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: colors.danger,
              fontFamily: fonts.display,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Game Over
          </DialogTitle>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 14,
              color: colors.textMuted,
              fontFamily: fonts.body,
              lineHeight: 1.5,
            }}
          >
            Your party has fallen in battle.
            <br />
            The adventure ends here...
          </p>
        </DialogHeader>

        <div style={{ padding: "24px" }}>
          <button
            onClick={handleRestart}
            style={{
              width: "100%",
              padding: "14px 0",
              background: `rgba(239,68,68,0.15)`,
              border: `1px solid ${colors.danger}`,
              borderRadius: 7,
              color: colors.danger,
              fontFamily: fonts.display,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            }}
          >
            Try Again
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(GameOverModalComponent);
