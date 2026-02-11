import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CharacterData } from "@/types/Character";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useGameStore } from "@/state/GameState";
import { Button } from "../ui/button";

export default function LevelUpModal() {
  const { 
    levelingUpChars, 
    currentLevelingCharIndex,
    applyLevelUp 
  } = useGameStore();

  const currentChar = levelingUpChars[currentLevelingCharIndex];
  const [statPoints, setStatPoints] = useState(3);
  const [allocatedStats, setAllocatedStats] = useState<Record<string, number>>({
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    def: 0
  });

  if (!currentChar || currentLevelingCharIndex === -1) return null;

  const remainingChars = levelingUpChars.length - currentLevelingCharIndex - 1;

  const incrementStat = (stat: string) => {
    if (statPoints > 0) {
      setAllocatedStats(prev => ({
        ...prev,
        [stat]: prev[stat] + 1
      }));
      setStatPoints(prev => prev - 1);
    }
  };

  const decrementStat = (stat: string) => {
    if (allocatedStats[stat] > 0) {
      setAllocatedStats(prev => ({
        ...prev,
        [stat]: prev[stat] - 1
      }));
      setStatPoints(prev => prev + 1);
    }
  };

  const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const handleConfirm = () => {
    const updatedAbilities = { ...currentChar.abilities };
    Object.entries(allocatedStats).forEach(([stat, points]) => {
      const key = stat as keyof typeof updatedAbilities;
      const newScore = updatedAbilities[key].score + points;
      updatedAbilities[key] = {
        score: newScore,
        modifier: calculateModifier(newScore)
      };
    });

    const conIncrease = allocatedStats.con;
    const hpIncrease = conIncrease > 0 ? conIncrease : 0;

    const updatedChar: CharacterData = {
      ...currentChar,
      level: currentChar.level + 1,
      exp: currentChar.exp - currentChar.nextLevelExp,
      nextLevelExp: Math.floor(currentChar.nextLevelExp * 1.5),
      abilities: updatedAbilities,
      maxHp: currentChar.maxHp + hpIncrease,
      hp: currentChar.hp + hpIncrease,
    };

    setStatPoints(3);
    setAllocatedStats({
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    });

    applyLevelUp(updatedChar);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex justify-between items-center">
            <span>Level Up!</span>
            {remainingChars > 0 && (
              <span className="text-sm text-gray-400 font-normal">
                +{remainingChars} more waiting
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-xl mb-2">
              {currentChar.name} reached level {currentChar.level + 1}!
            </p>
            <p className="text-gray-400">
              Allocate {statPoints} stat {statPoints === 1 ? 'point' : 'points'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={currentChar.img}
              alt={currentChar.name}
              style={{
                imageRendering: "pixelated",
              }}
              className="w-24 h-24 rounded bg-gray-700"
            />
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-sm text-gray-400">Level Progress</div>
                <Progress
                  value={100}
                  className="h-2 bg-gray-700"
                />
                <div className="text-sm mt-1 text-green-400">
                  Level {currentChar.level} → {currentChar.level + 1}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Ability Scores</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(currentChar.abilities).map(([key, value]) => {
                const allocated = allocatedStats[key];
                const newScore = value.score + allocated;
                const newModifier = calculateModifier(newScore);
                
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-gray-400 uppercase text-sm">{key}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">
                          {newScore}
                        </span>
                        {allocated > 0 && (
                          <span className="text-sm text-green-400">
                            (+{allocated})
                          </span>
                        )}
                        <span className="text-sm text-gray-300">
                          {newModifier >= 0 ? `+${newModifier}` : newModifier}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-500"
                        onClick={() => decrementStat(key)}
                        disabled={allocated === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-500"
                        onClick={() => incrementStat(key)}
                        disabled={statPoints === 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
            <span className="text-lg">
              {statPoints === 0 ? (
                <span className="text-green-400">✓ All points allocated</span>
              ) : (
                <span>
                  <span className="font-bold text-yellow-400">{statPoints}</span> stat {statPoints === 1 ? 'point' : 'points'} remaining
                </span>
              )}
            </span>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={statPoints > 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            size="lg"
          >
            {remainingChars > 0 ? 'Next Character →' : 'Confirm Level Up'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}