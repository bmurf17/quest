import { useCharacter } from "../CharacterContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function RaceForm() {
  const { character, updateCharacter } = useCharacter();

  const handleRaceChange = (value: string) => {
    updateCharacter("race", value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Race</h2>
      <RadioGroup value={character.race} onValueChange={handleRaceChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="human"
            id="human"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="human">Human</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="elf"
            id="elf"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="elf">Elf</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="dwarf"
            id="dwarf"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="dwarf">Dwarf</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="halfling"
            id="halfling"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="halfling">Halfling</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="dragonborn"
            id="dragonborn"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="dragonborn">Dragonborn</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
