import { useCharacter } from "../CharacterContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function BackgroundForm() {
  const { character, updateCharacter } = useCharacter();

  const handleBackgroundChange = (value: string) => {
    updateCharacter("background", value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Background</h2>
      <RadioGroup
        value={character.background}
        onValueChange={handleBackgroundChange}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="acolyte"
            id="bg-acolyte"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="bg-acolyte">Acolyte</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="charlatan"
            id="bg-charlatan"
            className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="bg-charlatan">Charlatan</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="criminal" id="bg-criminal" />
          <Label htmlFor="bg-criminal">Criminal</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="entertainer" id="bg-entertainer" />
          <Label htmlFor="bg-entertainer">Entertainer</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="folk-hero" id="bg-folk-hero" />
          <Label htmlFor="bg-folk-hero">Folk Hero</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
