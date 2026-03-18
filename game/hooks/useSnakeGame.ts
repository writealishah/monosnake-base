"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LOCAL_BEST_STORAGE_KEY } from "@/config/game";
import { createInitialGameState, queueDirection, stepGame } from "@/game/logic/engine";
import type { Direction, GameState } from "@/game/types";

function readLocalBest(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = window.localStorage.getItem(LOCAL_BEST_STORAGE_KEY);
  if (!stored) {
    return 0;
  }

  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function useSnakeGame() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [localBest, setLocalBest] = useState<number>(() => readLocalBest());
  const localBestRef = useRef(localBest);

  useEffect(() => {
    localBestRef.current = localBest;
  }, [localBest]);

  useEffect(() => {
    if (gameState.status !== "playing") {
      return;
    }

    const timer = window.setInterval(() => {
      setGameState((previous) => {
        const next = stepGame(previous);

        if (next.status === "game-over" && next.score > localBestRef.current) {
          localBestRef.current = next.score;
          setLocalBest(next.score);
          window.localStorage.setItem(LOCAL_BEST_STORAGE_KEY, String(next.score));
        }

        return next;
      });
    }, gameState.tickMs);

    return () => window.clearInterval(timer);
  }, [gameState.status, gameState.tickMs]);

  const startGame = useCallback(() => {
    setGameState((previous) => ({
      ...createInitialGameState(previous.width, previous.height),
      status: "playing",
    }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((previous) =>
      previous.status === "playing" ? { ...previous, status: "paused" } : previous,
    );
  }, []);

  const resumeGame = useCallback(() => {
    setGameState((previous) =>
      previous.status === "paused" ? { ...previous, status: "playing" } : previous,
    );
  }, []);

  const togglePause = useCallback(() => {
    setGameState((previous) => {
      if (previous.status === "paused") {
        return { ...previous, status: "playing" };
      }
      if (previous.status === "playing") {
        return { ...previous, status: "paused" };
      }
      return previous;
    });
  }, []);

  const restartGame = useCallback(() => {
    setGameState((previous) => ({
      ...createInitialGameState(previous.width, previous.height),
      status: "playing",
    }));
  }, []);

  const setDirection = useCallback((direction: Direction) => {
    setGameState((previous) => queueDirection(previous, direction));
  }, []);

  const isPlaying = useMemo(() => gameState.status === "playing", [gameState.status]);
  const isPaused = useMemo(() => gameState.status === "paused", [gameState.status]);
  const isGameOver = useMemo(() => gameState.status === "game-over", [gameState.status]);

  return {
    gameState,
    localBest,
    isPlaying,
    isPaused,
    isGameOver,
    startGame,
    pauseGame,
    resumeGame,
    togglePause,
    restartGame,
    setDirection,
  };
}
