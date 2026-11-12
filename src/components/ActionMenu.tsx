import { useGameStore } from "@/state/GameState";
import { Camp, Chest, NPC, Quest } from "@/types/RoomInteractions";
import { CharacterData } from "@/types/Character";
import { useState } from "react";
import Inventory from "./Inventory";
import Shop from "./Shop";
import SectionSelector from "./SectionSelector";
import { manaPotion } from "@/types/Item";
import { GameStatus } from "@/types/GameStatus";
import QuestList from "./Quests/QuestList";
import QuestOffer from "./Quests/QuestOffer";
import { ActionBtn } from "./action-menu/ActionBtn";
import { CombatActions } from "./action-menu/CombatActions";
import { DialogueActions } from "./action-menu/DialogueActions";
import { ChestActions } from "./action-menu/ChestActions";
import { CampActions } from "./action-menu/CampActions";
import { TownActions } from "./action-menu/TownActions";

export default function ActionMenu() {
  const party = useGameStore((state) => state.party);
  const index = useGameStore((state) => state.activeFighterIndex);
  const combatOrder = useGameStore((state) => state.combatOrder);
  const isFighterEnemy = useGameStore((state) => state.isCurrentFighterEnemy());
  const room = useGameStore((state) => state.room);
  const inventory = useGameStore((state) => state.inventory);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const restInTown = useGameStore((state) => state.restInTown);
  const quests = useGameStore((state) => state.quests);
  const rest = useGameStore((state) => state.rest);
  const updateChest = useGameStore((state) => state.updateChest);
  const takeFromChest = useGameStore((state) => state.takeFromChest);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isSectionSelectorOpen, setIsSectionSelectorOpen] = useState(false);
  const [isQuestDescriptionOpen, setIsQuestDescriptionOpen] = useState(false);
  const [isQuestListOpen, setIsQuestListOpen] = useState(false);

  const currentFighter = combatOrder[index] as CharacterData;
  const inCombat = room && room.enemies.length > 0;
  const npc =
    room?.interaction?.type === "NPC"
      ? (room.interaction as { type: "NPC"; npc: NPC }).npc
      : null;
  const chest =
    room?.interaction?.type === "chest"
      ? (room.interaction.chest as Chest)
      : null;
  const camp =
    room?.interaction?.type === "camp" ? (room.interaction.camp as Camp) : null;

  const tempQuest: Quest = {
    id: 0,
    name: "Unknown Quest",
    description: "No description available.",
    type: { type: "fetch", item: manaPotion },
    objectives: [],
    rewards: [manaPotion],
    accepted: false,
    completed: false,
  };
  const isQuestAlreadyAccepted = npc?.quest
    ? quests.some((q) => q.id === npc.quest?.id)
    : false;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          height: "100%",
          fontFamily: "'Lato', sans-serif",
        }}
      >
        {inCombat && !isFighterEnemy && currentFighter && (
          <CombatActions fighter={currentFighter} />
        )}

        {npc && (
          <DialogueActions
            npc={npc}
            party={party}
            onOpenShop={() => setIsShopModalOpen(true)}
            onOpenQuestDescription={() => setIsQuestDescriptionOpen(true)}
          />
        )}

        {chest && (
          <ChestActions
            chest={chest}
            onUpdate={updateChest}
            onTakeAll={takeFromChest}
          />
        )}

        {camp && <CampActions camp={camp} onRest={rest} />}

        {gameStatus === GameStatus.InTown && (
          <TownActions
            onExplore={() => setIsSectionSelectorOpen(true)}
            onShop={() => setIsShopModalOpen(true)}
            onRest={() => restInTown()}
          />
        )}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "row",
            gap: 6,
          }}
        >
          <div style={{ height: 1, background: "rgba(180,140,80,0.1)" }} />
          <ActionBtn onClick={() => setIsInventoryModalOpen(true)} fullWidth>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              width={13}
              height={13}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.75 7.5h16.5M8.625 4.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            Inventory
          </ActionBtn>
          <div style={{ height: 1, background: "rgba(180,140,80,0.1)" }} />
          <ActionBtn onClick={() => setIsQuestListOpen(true)} fullWidth>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              width={13}
              height={13}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5V6a2.25 2.25 0 0 1 2.25-2.25h8.25A2.25 2.25 0 0 1 17.25 6v13.5m-12.75 0a2.25 2.25 0 0 0 2.25 2.25h8.25a2.25 2.25 0 0 0 2.25-2.25m-12.75 0h12.75M7.5 8.25h6M7.5 11.25h6M7.5 14.25h3.75M19.5 6.75v9a1.5 1.5 0 0 1-1.5 1.5h-.75"
              />
            </svg>
            Quests
          </ActionBtn>
        </div>
      </div>

      <Inventory
        isOpen={isInventoryModalOpen}
        onOpenChange={setIsInventoryModalOpen}
        inventory={inventory}
      />
      <Shop
        isOpen={isShopModalOpen}
        onOpenChange={setIsShopModalOpen}
        inventory={[manaPotion]}
        ownersName={npc?.name ?? "Shopkeeper"}
      />
      <SectionSelector
        isOpen={isSectionSelectorOpen}
        onOpenChange={setIsSectionSelectorOpen}
      />
      <QuestList isOpen={isQuestListOpen} onOpenChange={setIsQuestListOpen} />

      <QuestOffer
        isOpen={isQuestDescriptionOpen}
        onOpenChange={setIsQuestDescriptionOpen}
        quest={
          npc?.quest
            ? { ...npc.quest, accepted: isQuestAlreadyAccepted }
            : tempQuest
        }
      />
    </>
  );
}
