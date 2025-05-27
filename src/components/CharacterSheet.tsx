"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import warrior from "../assets/Warrior.png";
import bow from "../assets/BowV1.png";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CharacterData } from "@/types/Character";

export default function CharacterSheet({
  isOpen = false,
  onOpenChange,
  characterData,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  characterData: CharacterData;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {characterData.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700/50 rounded-lg">
              <div>
                <span className="text-sm text-gray-400">Race</span>
                <p>{characterData.race}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Class</span>
                <p>{characterData.class}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Level</span>
                <p>{characterData.level}</p>
              </div>
            </div>

            {/* Character Stats */}
            <div className="flex items-center gap-4">
              <img
                src={characterData.img}
                alt={"name"}
                className="w-24 h-24 rounded bg-gray-700"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <div className="text-sm text-gray-400">HP</div>
                  <Progress
                    value={(characterData.hp / characterData.maxHp) * 100}
                    className="h-2 bg-gray-700"
                    //indicatorClassName="bg-green-500"
                  />
                  <div className="text-sm mt-1">
                    {characterData.hp} / {characterData.maxHp}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">MP</div>
                  <Progress
                    value={(characterData.mp / characterData.maxMp) * 100}
                    className="h-2 bg-gray-700"
                    //indicatorClassName="bg-blue-500"
                  />
                  <div className="text-sm mt-1">
                    {characterData.mp} / {characterData.maxMp}
                  </div>
                </div>
              </div>
            </div>

            {/* Abilities */}
            <div className="grid grid-cols-6 gap-4">
              {Object.entries(characterData.abilities).map(([key, value]) => (
                <div
                  key={key}
                  className="text-center p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="text-gray-400 uppercase text-sm">{key}</div>
                  <div className="text-xl font-bold">{value.score}</div>
                  <div className="text-sm text-gray-300">
                    {value.modifier >= 0
                      ? `+${value.modifier}`
                      : value.modifier}
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Skills</h3>
              <div className="grid grid-cols-2 gap-2">
                {characterData.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex justify-between p-2 bg-gray-700/50 rounded"
                  >
                    <span>
                      {skill.name} ({skill.ability})
                    </span>
                    <span>{skill.modifier}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="space-y-2">
                {characterData.actions.map((action) => (
                  <div
                    key={action.name}
                    className="flex justify-between items-center p-2 bg-gray-700/50 rounded"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{action.name}</span>
                      <img
                        src={bow}
                        alt={"name"}
                        className="w-16 h-16 rounded bg-gray-700"
                      />
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>Hit: {action.hitDC}</span>
                      <span>Damage: {action.damage}</span>
                      <span className="text-gray-400">{action.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saving Throws */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Saving Throws</h3>
              <div className="grid grid-cols-6 gap-4">
                {Object.entries(characterData.savingThrows).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="text-center p-2 bg-gray-700/50 rounded"
                    >
                      <div className="text-gray-400 uppercase text-sm">
                        {key}
                      </div>
                      <div className="font-medium">{value}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
