import { describe, expect, it } from "vitest";
import { DIRECTION_OPTIONS, directionToDbEnum, oppositeDirection } from "@/lib/directions";
import { Directions } from "@/types/Directions";

describe("directionToDbEnum", () => {
  it("maps every direction to its database enum", () => {
    expect(directionToDbEnum(Directions.North)).toBe("North");
    expect(directionToDbEnum(Directions.West)).toBe("West");
    expect(directionToDbEnum(Directions.South)).toBe("South");
    expect(directionToDbEnum(Directions.East)).toBe("East");
  });
});

describe("oppositeDirection", () => {
  it("returns the reverse of each direction", () => {
    expect(oppositeDirection(Directions.North)).toBe(Directions.South);
    expect(oppositeDirection(Directions.South)).toBe(Directions.North);
    expect(oppositeDirection(Directions.East)).toBe(Directions.West);
    expect(oppositeDirection(Directions.West)).toBe(Directions.East);
  });
});

describe("DIRECTION_OPTIONS", () => {
  it("offers all four directions exactly once", () => {
    expect(new Set(DIRECTION_OPTIONS.map((option) => option.value)).size).toBe(4);
  });
});
