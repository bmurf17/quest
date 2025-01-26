import warrior from "../assets/Warrior.png";
import { Character } from "../types/Character";

interface Props {
  party: Character[];
}

export default function Party({ party }: Props) {
  return (
    <>
      {party.map((character: Character, i: React.Key | null | undefined) => (
        <div key={i} className="bg-gray-900 rounded p-2 flex gap-2">
          <div className="w-12 h-12 bg-gray-700 rounded">
            <img className="w-12 h-12" src={warrior} />
          </div>
          <div className="flex-1">
            <div className="text-sm">{character.name}</div>
            <div className="h-2 bg-gray-700 rounded mt-1">
              <div
                className="h-full bg-green-500 rounded"
                style={{
                  width: `${(character.hp / character.maxHp) * 100}%`,
                }}
              ></div>
            </div>
            <div className="h-2 bg-gray-700 rounded mt-1 ">
              <div
                className="h-full bg-blue-500 rounded"
                style={{
                  width: `${(character.mp / character.maxMp) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
