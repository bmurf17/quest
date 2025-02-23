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
          <RadioGroupItem
            value="barbarian"
            id="barbarian"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="barbarian">Barbarian</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="bard"
            id="bard"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="bard">Bard</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="cleric"
            id="cleric"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="cleric">Cleric</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="druid"
            id="druid"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="druid">Druid</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="fighter"
            id="fighter"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="fighter">Fighter</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
