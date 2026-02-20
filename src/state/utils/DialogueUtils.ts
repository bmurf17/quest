import { CharacterData } from "@/types/Character";

export function partyHasAnimalHandling(party: CharacterData[]): boolean {
  return party.some(member => 
    member.alive && member.skills.some(skill => skill.name === "Animal Handling")
  );
}