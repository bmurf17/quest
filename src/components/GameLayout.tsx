import { useGameStore } from "@/state/GameState";
import Party from "@/components/Party/Party";
import ActionMenu from "@/components/ActionMenu/ActionMenu";
import MainGameArea from "./MainGameArea/MainGameArea";
import ActivityLog from "./ActivityLog";

export default function GameLayout() {
  const activityLog = useGameStore((state) => state.activityLog);
  const party = useGameStore((state) => state.party);

  return (
    <div className="flex flex-col h-screen bg-[#111009] overflow-hidden">
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <MainGameArea />
      </div>

      <div className="h-[285px] shrink-0 grid grid-cols-[320px_1fr_340px] border-t border-gold-dark/20 bg-[rgba(8,7,5,0.97)] relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />

        <div className="border-r border-gold-dark/20 p-2 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 shrink-0 mb-1.5">
            <span className="text-[9px] font-bold text-gold-muted font-display tracking-[0.12em] uppercase">Log</span>
            <div className="flex-1 h-px bg-gold-dark/20" />
          </div>
          <ActivityLog activityLog={activityLog} />
        </div>

        <div className="border-r border-gold-dark/20 px-2.5 py-2 flex flex-col gap-1.5 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-bold text-gold-muted font-display tracking-[0.12em] uppercase">Party</span>
            <div className="flex-1 h-px bg-gold-dark/20" />
          </div>
          <Party party={party} />
        </div>

        <div className="px-2.5 py-2 flex flex-col gap-1.5 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-bold text-gold-muted font-display tracking-[0.12em] uppercase">Actions</span>
            <div className="flex-1 h-px bg-gold-dark/20" />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ActionMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
