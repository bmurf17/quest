import { useCharacter } from "../CharacterContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ClassForm() {
  const { character, updateCharacter } = useCharacter();

  const handleClassChange = (value: string) => {
    updateCharacter("class", value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Class</h2>
      <RadioGroup value={character.class} onValueChange={handleClassChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="barbarian" id="barbarian" />
          <Label htmlFor="barbarian">Barbarian</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bard" id="bard" />
          <Label htmlFor="bard">Bard</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cleric" id="cleric" />
          <Label htmlFor="cleric">Cleric</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="druid" id="druid" />
          <Label htmlFor="druid">Druid</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="fighter" id="fighter" />
          <Label htmlFor="fighter">Fighter</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
