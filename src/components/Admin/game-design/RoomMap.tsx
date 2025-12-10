import { useGameStore } from "@/state/GameState";
import { Directions } from "@/types/Directions";
import { Room } from "@/types/Room";
import React, { useState } from "react";
import { useRef, useEffect } from "react";

const MAX_DEPTH = 5;
const ROOM_DISTANCE = 160;
const CONTAINER_PADDING = 250;

interface RoomPopupProps {
  room: Room;
  onClose: () => void;
}

const getDirectionOffset = (
  direction: Directions,
  distance: number = ROOM_DISTANCE
) => {
  switch (direction) {
    case Directions.North:
      return { x: 0, y: -distance };
    case Directions.South:
      return { x: 0, y: distance };
    case Directions.East:
      return { x: distance, y: 0 };
    case Directions.West:
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

interface RoomNodeProps {
  room: Room;
  x: number;
  y: number;
  visitedRooms: Set<string>;
  depth?: number;
  onRoomClick: (room: Room) => void;
}

const RoomNode = React.memo(
  ({ room, x, y, visitedRooms, depth = 0, onRoomClick }: RoomNodeProps) => {
    //todo: explore this but saves me incase I have infinite loop of rooms
    const maxDepth = MAX_DEPTH;

    const newVisitedRooms = new Set([...visitedRooms, room.name]);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRoomClick(room);
    };

    return (
      <>
        <div
          className="absolute bg-blue-100 border-2 border-blue-300 px-3 py-2 rounded text-sm font-medium"
          style={{
            left: `${x}px`,
            top: `${y}px`,
          }}
          onClick={handleClick}
        >
          {room.name}
        </div>

        {depth < maxDepth &&
          room.neighboringRooms?.map(
            ([direction, neighborRoom]: any, index: any) => {
              if (newVisitedRooms.has(neighborRoom.name)) {
                return null;
              }

              const offset = getDirectionOffset(direction);
              const newX = x + offset.x;
              const newY = y + offset.y;

              return (
                <RoomNode
                  key={`${neighborRoom.name}-${index}`}
                  room={neighborRoom}
                  x={newX}
                  y={newY}
                  visitedRooms={newVisitedRooms}
                  depth={depth + 1}
                  onRoomClick={onRoomClick}
                />
              );
            }
          )}
      </>
    );
  }
);

const calculateBounds = (
  room: Room,
  visitedRooms = new Set(),
  x = 0,
  y = 0,
  depth = 0
) => {
  const maxDepth = MAX_DEPTH;
  if (depth >= maxDepth || visitedRooms.has(room.name)) {
    return { minX: x, maxX: x, minY: y, maxY: y };
  }

  const newVisitedRooms = new Set([...visitedRooms, room.name]);
  let bounds = { minX: x, maxX: x, minY: y, maxY: y };

  room.neighboringRooms?.forEach(([direction, neighborRoom]) => {
    if (!newVisitedRooms.has(neighborRoom.name)) {
      const offset = getDirectionOffset(direction);
      const newX = x + offset.x;
      const newY = y + offset.y;

      const childBounds = calculateBounds(
        neighborRoom,
        newVisitedRooms,
        newX,
        newY,
        depth + 1
      );
      bounds.minX = Math.min(bounds.minX, childBounds.minX);
      bounds.maxX = Math.max(bounds.maxX, childBounds.maxX);
      bounds.minY = Math.min(bounds.minY, childBounds.minY);
      bounds.maxY = Math.max(bounds.maxY, childBounds.maxY);
    }
  });

  return bounds;
};

export function RoomPopup({ room, onClose }: RoomPopupProps) {  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>
        <h3 className="text-xl font-bold mb-4 text-blue-800">
          {room.name} Info
        </h3>
        <p className="mb-4 text-gray-800">
          <span className="font-semibold text-black">Interaction:</span>{' '}
          <span className="text-black">
            {room.interaction ? room.interaction.type : 'None'}
          </span>
        </p>

        <button
          onClick={onClose}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function RoomMap() {
  const rooms = useGameStore((state) => state.rooms);
  const startRoom = rooms.find((x) => x.name === "Start Room");
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const bounds = startRoom ? calculateBounds(startRoom) : null;

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
  };

  const handleClosePopup = () => {
    setSelectedRoom(null);
  };

  const padding = CONTAINER_PADDING;
  const verticalPadding = 100;

  const containerWidth = bounds ? bounds.maxX - bounds.minX + padding * 2 : 0;
  const containerHeight = bounds
    ? bounds.maxY - bounds.minY + verticalPadding * 2
    : 0;

  useEffect(() => {
    if (containerRef.current) {
      const container: any = containerRef.current;
      const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      const scrollTop = (container.scrollHeight - container.clientHeight) / 2;

      container.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, [containerWidth, containerHeight]);

  if (startRoom) {
    const handleMouseDown = (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
      if (containerRef.current) {
        (containerRef.current as HTMLElement).style.cursor = "grabbing";
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const container = containerRef.current as HTMLElement;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      container.scrollLeft -= dx;
      container.scrollTop -= dy;

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      if (containerRef.current) {
        (containerRef.current as HTMLElement).style.cursor = "grab";
      }
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        if (containerRef.current) {
          (containerRef.current as HTMLElement).style.cursor = "grab";
        }
      }
    };

    if (!startRoom) {
      return <div>No start room found</div>;
    }

    return (
      <main className="container mx-auto p-4 pb-0" style={{ maxHeight: "90%" }}>
        <h2 className="text-3xl font-bold m-4 mb-6">Room Map</h2>
        <div
          ref={containerRef}
          className="bg-white m-4 text-black overflow-auto relative"
          style={{ maxHeight: "90%", minHeight: "78vh", cursor: "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative"
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              transform: `translate(${bounds ? -bounds.minX + padding : 0}px, ${
                bounds ? -bounds.minY + verticalPadding : 0
              }px)`,
            }}
          >
            <RoomNode
              room={startRoom}
              x={0}
              y={0}
              visitedRooms={new Set()}
              depth={0}
              onRoomClick={handleRoomClick}
            />
          </div>
        </div>
        {selectedRoom && (
          <RoomPopup room={selectedRoom} onClose={handleClosePopup} />
        )}
      </main>
    );
  }
}
