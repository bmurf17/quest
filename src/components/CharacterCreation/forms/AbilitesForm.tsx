import { useCharacter } from "../CharacterContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AbilitiesForm() {
  const { character, updateCharacter } = useCharacter();

  const handleAbilityChange = (ability: string, value: string) => {
    const numValue = Number.parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
      updateCharacter("abilities", {
        ...character.abilities,
        [ability]: numValue,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Set Your Abilities</h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(character.abilities).map(([ability, value]) => (
          <div key={ability} className="space-y-2">
            <Label htmlFor={ability}>
              {ability.charAt(0).toUpperCase() + ability.slice(1)}
            </Label>
            <Input
              type="number"
              id={ability}
              value={value}
              onChange={(e) => handleAbilityChange(ability, e.target.value)}
              min="1"
              max="20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
