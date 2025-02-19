import { useCharacter } from "../CharacterContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function OriginForm() {
  const { character, updateCharacter } = useCharacter();

  const handleOriginChange = (value: string) => {
    updateCharacter("origin", value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Origin</h2>
      <RadioGroup value={character.origin} onValueChange={handleOriginChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
            value="acolyte"
            id="acolyte"
          />
          <Label htmlFor="acolyte">Acolyte</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
            value="charlatan"
            id="charlatan"
          />
          <Label htmlFor="charlatan">Charlatan</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
            value="criminal"
            id="criminal"
          />
          <Label htmlFor="criminal">Criminal</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
            value="entertainer"
            id="entertainer"
          />
          <Label htmlFor="entertainer">Entertainer</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
            value="folk-hero"
            id="folk-hero"
          />
          <Label htmlFor="folk-hero">Folk Hero</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
