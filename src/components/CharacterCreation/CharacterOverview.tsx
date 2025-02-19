import { useCharacter } from "./CharacterContext.tsx";

export default function CharacterOverview() {
  const { character } = useCharacter();

  return (
    <div className="bg-secondary p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Character Overview</h2>
      <div className="space-y-2">
        <p>
          <strong>Origin:</strong> {character.origin || "Not selected"}
        </p>
        <p>
          <strong>Race:</strong> {character.race || "Not selected"}
        </p>
        <p>
          <strong>Subrace:</strong> {character.subrace || "Not selected"}
        </p>
        <p>
          <strong>Class:</strong> {character.class || "Not selected"}
        </p>
        <p>
          <strong>Background:</strong> {character.background || "Not selected"}
        </p>
        <div>
          <strong>Abilities:</strong>
          <ul className="list-disc list-inside pl-4">
            <li>Strength: {character.abilities.strength}</li>
            <li>Dexterity: {character.abilities.dexterity}</li>
            <li>Constitution: {character.abilities.constitution}</li>
            <li>Intelligence: {character.abilities.intelligence}</li>
            <li>Wisdom: {character.abilities.wisdom}</li>
            <li>Charisma: {character.abilities.charisma}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
