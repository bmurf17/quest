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
          <RadioGroupItem value="human" id="human" />
          <Label htmlFor="human">Human</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="elf" id="elf" />
          <Label htmlFor="elf">Elf</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dwarf" id="dwarf" />
          <Label htmlFor="dwarf">Dwarf</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="halfling" id="halfling" />
          <Label htmlFor="halfling">Halfling</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dragonborn" id="dragonborn" />
          <Label htmlFor="dragonborn">Dragonborn</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
