import { GameState, useGameStore } from "@/state/GameState";
import merchant from "../../assets/Merchant.png"
import horse from "/images/characters/npc/Horse-1.png"

export default function RoomNPC() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  const dialogueIndex = useGameStore((state) => state.dialogueIndex);

  const interaction = currentRoom?.interaction;

  if (!currentRoom || interaction?.type !== "NPC") {
    return null;
  }

  const dialogueLines = interaction.npc.dialogue;
  const currentLine = dialogueLines[dialogueIndex] || dialogueLines[dialogueLines.length - 1];
  const isEndOfDialogue = dialogueIndex >= dialogueLines.length - 1;

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
      
      <div className="relative mb-4 px-4 py-3 bg-slate-900/95 border-2 border-white rounded-lg shadow-xl max-w-[280px] min-h-[60px]">
        <p className="text-white text-sm font-mono leading-relaxed">
          {currentLine}
        </p>

        {!isEndOfDialogue && (
           <div className="absolute bottom-1 right-2 text-[10px] text-yellow-400 animate-bounce">
             ▼
           </div>
        )}
        
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 
          border-l-[8px] border-l-transparent 
          border-r-[8px] border-r-transparent 
          border-t-[8px] border-t-white">
        </div>
      </div>

      <div className="relative">
        <img src={horse} alt="horse" className="mx-auto"
          style={{ width: "192px", height: "192px", imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}