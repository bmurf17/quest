import { useCharacter } from "../CharacterContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SubraceForm() {
  const { character, updateCharacter } = useCharacter();

  const handleSubraceChange = (value: string) => {
    updateCharacter("subrace", value);
  };

  const subraces: { [key: string]: string[] } = {
    human: ["Standard", "Variant"],
    elf: ["High Elf", "Wood Elf", "Dark Elf"],
    dwarf: ["Hill Dwarf", "Mountain Dwarf"],
    halfling: ["Lightfoot", "Stout"],
    dragonborn: [
      "Black",
      "Blue",
      "Brass",
      "Bronze",
      "Copper",
      "Gold",
      "Green",
      "Red",
      "Silver",
      "White",
    ],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Subrace</h2>
      {character.race ? (
        <RadioGroup
          value={character.subrace}
          onValueChange={handleSubraceChange}
        >
          {subraces[character.race].map((subrace) => (
            <div key={subrace} className="flex items-center space-x-2">
              <RadioGroupItem
                value={subrace.toLowerCase().replace(" ", "-")}
                id={subrace.toLowerCase().replace(" ", "-")}
                className="border-yellow-500 text-yellow-500 focus:ring-yellow-500 data-[state=checked]:bg-yellow-500"
              />
              <Label htmlFor={subrace.toLowerCase().replace(" ", "-")}>
                {subrace}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <p>Please select a race first.</p>
      )}
    </div>
  );
}
