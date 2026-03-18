import { useMemo, type ReactElement } from "react";
import type { GameState } from "@/game/types";
import { pointKey } from "@/game/logic/helpers";

type SnakeBoardProps = {
  gameState: GameState;
};

export function SnakeBoard({ gameState }: SnakeBoardProps) {
  const cellSize = "clamp(8px, 1.05vw, 15px)";
  const head = gameState.snake[0];
  const snakeBody = useMemo(() => new Set(gameState.snake.map(pointKey)), [gameState.snake]);
  const headKey = pointKey(head);
  const foodKey = pointKey(gameState.food);
  const bonusKey = gameState.bonusFood ? pointKey(gameState.bonusFood) : null;
  const showTongue = gameState.status === "playing";

  const eyePositions = (() => {
    switch (gameState.direction) {
      case "up":
        return [
          { left: "36%", top: "30%" },
          { left: "64%", top: "30%" },
        ];
      case "down":
        return [
          { left: "36%", top: "70%" },
          { left: "64%", top: "70%" },
        ];
      case "left":
        return [
          { left: "30%", top: "36%" },
          { left: "30%", top: "64%" },
        ];
      case "right":
        return [
          { left: "70%", top: "36%" },
          { left: "70%", top: "64%" },
        ];
    }
  })();

  const tongueStyle = (() => {
    switch (gameState.direction) {
      case "up":
        return {
          width: "14%",
          height: "22%",
          left: "50%",
          top: "-2%",
          transform: "translate(-50%, -70%)",
        };
      case "down":
        return {
          width: "14%",
          height: "22%",
          left: "50%",
          top: "100%",
          transform: "translate(-50%, 2%)",
        };
      case "left":
        return {
          width: "22%",
          height: "14%",
          left: "-2%",
          top: "50%",
          transform: "translate(-70%, -50%)",
        };
      case "right":
        return {
          width: "22%",
          height: "14%",
          left: "100%",
          top: "50%",
          transform: "translate(2%, -50%)",
        };
    }
  })();

  const cells = useMemo(() => {
    const generated: ReactElement[] = [];
    for (let y = 0; y < gameState.height; y += 1) {
      for (let x = 0; x < gameState.width; x += 1) {
        const key = `${x},${y}`;
        const isHead = key === headKey;
        const isBody = snakeBody.has(key) && !isHead;
        const isFood = key === foodKey;
        const isBonus = bonusKey ? key === bonusKey : false;
        const cellFillClass = isHead
          ? "bg-[#0e417f] shadow-[inset_0_0_0_1px_rgba(180,210,255,0.28)]"
          : isBody
            ? "bg-[#255da8]"
            : isFood
              ? "bg-[#2b67bf]"
              : "bg-[#98b719]";

        generated.push(
          <div
            key={key}
            className={[
              "relative flex h-full w-full items-center justify-center border-[0.5px] border-[#78921d]/75",
              cellFillClass,
              isFood ? "z-20 lcd-food-blink border-[#2a5ca6]/90 shadow-[0_0_0_1px_rgba(20,44,84,0.42)]" : "",
            ].join(" ")}
          >
            {isHead ? (
              <span className="pointer-events-none absolute inset-0">
                {eyePositions.map((eye, index) => (
                  <span
                    key={`${key}-eye-${index}`}
                    className="absolute h-[2px] w-[2px] bg-[#04101f]"
                    style={{
                      left: eye.left,
                      top: eye.top,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}
                {showTongue ? (
                  <span
                    className="lcd-tongue absolute bg-[#7fc8de]"
                    style={{
                      ...tongueStyle,
                    }}
                  />
                ) : null}
              </span>
            ) : null}

            {isBonus ? (
              <span
                className="h-[55%] w-[55%] bg-[#54c8ff]"
                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0 50%)" }}
              />
            ) : null}
          </div>,
        );
      }
    }
    return generated;
  }, [
    bonusKey,
    eyePositions,
    foodKey,
    gameState.height,
    gameState.width,
    headKey,
    showTongue,
    snakeBody,
    tongueStyle,
  ]);

  return (
    <div className="relative touch-none rounded-[3px] border-[7px] border-[#1e3006] bg-[#86a913] p-[3px] shadow-[inset_0_0_0_2px_#4b650d,0_6px_0_#3d530a]">
      <div className="relative inline-grid overflow-hidden rounded-[1px] border border-[#304908] shadow-[inset_0_0_0_1px_rgba(208,237,87,0.18)]">
        <div
          className="inline-grid"
          style={{
            gridTemplateColumns: `repeat(${gameState.width}, ${cellSize})`,
            gridTemplateRows: `repeat(${gameState.height}, ${cellSize})`,
          }}
        >
          {cells}
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-22 mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(38,58,8,0.16) 0px, rgba(38,58,8,0.16) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(132deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 42%, rgba(0,0,0,0.14) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-16 mix-blend-multiply"
          style={{
            background:
              "radial-gradient(circle at center, transparent 52%, rgba(20,35,6,0.45) 100%)",
          }}
        />
      </div>
    </div>
  );
}
