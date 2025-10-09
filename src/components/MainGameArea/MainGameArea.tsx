import BattleEnemies from "./_BattleEnemies";
import MapNav from "./_MapNav";
import RoomChest from "./_RoomChest";
import RoomNPC from "./_RoomNPC";


export default function MainGameArea() {
  return (
    <div className="flex-1 relative bg-cover bg-center bg-battle-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <BattleEnemies />
          <RoomNPC />
          <RoomChest />
          <MapNav />
        </div>
      </div>
    </div>
  );
}
