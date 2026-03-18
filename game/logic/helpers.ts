import type { Direction, Point } from "@/game/types";

const oppositeDirectionMap: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function arePointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function pointKey(point: Point): string {
  return `${point.x},${point.y}`;
}

export function isOppositeDirection(current: Direction, next: Direction): boolean {
  return oppositeDirectionMap[current] === next;
}

export function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

