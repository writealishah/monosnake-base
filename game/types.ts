export type Direction = "up" | "down" | "left" | "right";

export type Point = {
  x: number;
  y: number;
};

export type CollectibleType = "food" | "bonus";

export type Collectible = Point & {
  type: CollectibleType;
};

export type GameStatus = "idle" | "playing" | "paused" | "game-over";

export type GameState = {
  width: number;
  height: number;
  snake: Point[];
  direction: Direction;
  queuedDirection: Direction;
  food: Collectible;
  bonusFood: Collectible | null;
  score: number;
  foodEaten: number;
  tickMs: number;
  status: GameStatus;
};

