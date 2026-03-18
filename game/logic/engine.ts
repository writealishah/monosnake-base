import {
  BONUS_FOOD_INTERVAL,
  BONUS_SCORE,
  BONUS_SPAWN_CHANCE,
  ENABLE_BONUS_COLLECTIBLE,
  FOOD_SCORE,
  GRID_HEIGHT,
  GRID_WIDTH,
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  SPEED_SCORE_INTERVAL,
  SPEED_STEP_MS,
} from "@/config/game";
import type { Collectible, Direction, GameState, Point } from "@/game/types";
import { arePointsEqual, isOppositeDirection, pointKey, randomInt } from "@/game/logic/helpers";

function getStartingSnake(width: number, height: number): Point[] {
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  return [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
}

function getNextHead(head: Point, direction: Direction): Point {
  switch (direction) {
    case "up":
      return { x: head.x, y: head.y - 1 };
    case "down":
      return { x: head.x, y: head.y + 1 };
    case "left":
      return { x: head.x - 1, y: head.y };
    case "right":
      return { x: head.x + 1, y: head.y };
  }
}

function spawnCollectible(
  width: number,
  height: number,
  snake: Point[],
  banned: Point[] = [],
  type: Collectible["type"] = "food",
): Collectible {
  const used = new Set<string>([...snake, ...banned].map(pointKey));
  const freeCells: Point[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`;
      if (!used.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return { x: 0, y: 0, type };
  }

  const index = randomInt(freeCells.length);
  return { ...freeCells[index], type };
}

function getTickSpeedFromScore(score: number): number {
  const speedUps = Math.floor(score / FOOD_SCORE / SPEED_SCORE_INTERVAL);
  const nextSpeed = INITIAL_TICK_MS - speedUps * SPEED_STEP_MS;
  return Math.max(MIN_TICK_MS, nextSpeed);
}

export function canQueueDirection(current: Direction, next: Direction): boolean {
  return !isOppositeDirection(current, next);
}

export function createInitialGameState(
  width: number = GRID_WIDTH,
  height: number = GRID_HEIGHT,
): GameState {
  const snake = getStartingSnake(width, height);
  const food = spawnCollectible(width, height, snake);

  return {
    width,
    height,
    snake,
    direction: "right",
    queuedDirection: "right",
    food,
    bonusFood: null,
    score: 0,
    foodEaten: 0,
    tickMs: INITIAL_TICK_MS,
    status: "idle",
  };
}

export function queueDirection(state: GameState, nextDirection: Direction): GameState {
  if (!canQueueDirection(state.direction, nextDirection)) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function stepGame(state: GameState): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const nextDirection = canQueueDirection(state.direction, state.queuedDirection)
    ? state.queuedDirection
    : state.direction;
  const currentHead = state.snake[0];
  const nextHead = getNextHead(currentHead, nextDirection);

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.width ||
    nextHead.y >= state.height;
  if (hitWall) {
    return {
      ...state,
      status: "game-over",
      direction: nextDirection,
    };
  }

  const ateFood = arePointsEqual(nextHead, state.food);
  const ateBonus = state.bonusFood ? arePointsEqual(nextHead, state.bonusFood) : false;
  const bodyToCheck = ateFood || ateBonus ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((part) => arePointsEqual(part, nextHead));
  if (hitSelf) {
    return {
      ...state,
      status: "game-over",
      direction: nextDirection,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood && !ateBonus) {
    nextSnake.pop();
  }

  let score = state.score;
  let foodEaten = state.foodEaten;
  let nextFood = state.food;
  let nextBonus = state.bonusFood;

  if (ateFood) {
    score += FOOD_SCORE;
    foodEaten += 1;
    nextFood = spawnCollectible(state.width, state.height, nextSnake, nextBonus ? [nextBonus] : []);

    const shouldSpawnBonus =
      ENABLE_BONUS_COLLECTIBLE &&
      foodEaten % BONUS_FOOD_INTERVAL === 0 &&
      Math.random() < BONUS_SPAWN_CHANCE;
    nextBonus = shouldSpawnBonus
      ? spawnCollectible(state.width, state.height, nextSnake, [nextFood], "bonus")
      : null;
  }

  if (ateBonus) {
    score += BONUS_SCORE;
    nextBonus = null;
  }

  const hasWon = nextSnake.length >= state.width * state.height;
  if (hasWon) {
    return {
      ...state,
      snake: nextSnake,
      score,
      status: "game-over",
      direction: nextDirection,
      queuedDirection: nextDirection,
      food: nextFood,
      bonusFood: nextBonus,
      foodEaten,
      tickMs: getTickSpeedFromScore(score),
    };
  }

  return {
    ...state,
    snake: nextSnake,
    score,
    status: "playing",
    direction: nextDirection,
    queuedDirection: nextDirection,
    food: nextFood,
    bonusFood: nextBonus,
    foodEaten,
    tickMs: getTickSpeedFromScore(score),
  };
}
