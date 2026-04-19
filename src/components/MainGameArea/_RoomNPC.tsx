import { GameState, useGameStore } from "@/state/GameState";
import { DialogueNode } from "@/types/RoomInteractions";
import { useEffect, useRef } from "react";

export default function RoomNPC() {
  const state = useGameStore((state: GameState) => state);
  const currentRoom = state.room;
  const dialogueIndex = useGameStore((state) => state.dialogueIndex);
  const activeDialogue = useGameStore((state) => state.activeDialogue);
  const dialogueTrees = useGameStore((state) => state.dialogueTrees);
  const startDialogue = useGameStore((state: GameState) => state.startDialogue);
  const selectDialogueChoice = useGameStore((state: GameState) => state.selectDialogueChoice);
  const npcIdRef = useRef<number | null>(null);

  const interaction = currentRoom?.interaction;
  const npcId = interaction?.type === "NPC" ? interaction.npc.id : null;

  useEffect(() => {
    if (!interaction || interaction.type !== "NPC" || !npcId) return;
    if (npcIdRef.current === npcId) return;
    npcIdRef.current = npcId;
    
    const cachedTree = dialogueTrees.get(npcId);
    if (cachedTree) {
      startDialogue(interaction.npc, cachedTree);
    } else {
      startDialogue(interaction.npc);
    }
  }, [npcId, dialogueTrees]);

  if (!currentRoom || interaction?.type !== "NPC") {
    return null;
  }

  const npc = interaction.npc;
  const hasDialogueTree = activeDialogue !== null;

  if (hasDialogueTree) {
    return <DialogueTreeView npc={npc} activeDialogue={activeDialogue} selectDialogueChoice={selectDialogueChoice} />;
  }

  const dialogueLines = npc.dialogue;
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
        <img src={npc.img} alt={npc.name} className="mx-auto"
          style={{ width: "192px", height: "192px", imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

function DialogueTreeView({ 
  npc, 
  activeDialogue, 
  selectDialogueChoice 
}: { 
  npc: any; 
  activeDialogue: DialogueNode | null; 
  selectDialogueChoice: (choiceId: string) => void;
}) {
  if (!activeDialogue) {
    return null;
  }

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-4 px-4 py-3 bg-slate-900/95 border-2 border-white rounded-lg shadow-xl max-w-[280px] min-h-[60px]">
        <p className="text-white text-sm font-mono leading-relaxed">
          {activeDialogue.text}
        </p>
        
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 
          border-l-[8px] border-l-transparent 
          border-r-[8px] border-r-transparent 
          border-t-[8px] border-t-white">
        </div>
      </div>

      {activeDialogue.choices && activeDialogue.choices.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-[260px] mb-3">
          {activeDialogue.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => selectDialogueChoice(choice.id)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 
                         rounded text-white text-sm text-left transition-colors
                         hover:border-yellow-500"
            >
              {choice.text}
              {choice.skillCondition && (
                <span className="text-xs text-yellow-400 ml-2">
                  ({choice.skillCondition.skill} DC{choice.skillCondition.dc})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <img src={npc.img} alt={npc.name} className="mx-auto"
          style={{ width: "192px", height: "192px", imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}