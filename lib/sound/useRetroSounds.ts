"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RetroSoundId, SOUND_MUTE_STORAGE_KEY } from "@/config/sound";

type Tone = {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  gain?: number;
  type?: OscillatorType;
};

const MASTER_VOLUME = 0.22;

const soundMap: Record<RetroSoundId, Tone[]> = {
  buttonClick: [
    { frequency: 520, durationMs: 16, gain: 0.11, type: "square" },
    { frequency: 650, durationMs: 18, delayMs: 16, gain: 0.09, type: "square" },
  ],
  gameStart: [
    { frequency: 392, durationMs: 36, gain: 0.1, type: "square" },
    { frequency: 523, durationMs: 40, delayMs: 38, gain: 0.1, type: "square" },
    { frequency: 659, durationMs: 44, delayMs: 80, gain: 0.09, type: "square" },
  ],
  foodCollect: [{ frequency: 840, durationMs: 34, gain: 0.1, type: "triangle" }],
  scoreIncrease: [
    { frequency: 620, durationMs: 20, gain: 0.09, type: "square" },
    { frequency: 910, durationMs: 30, delayMs: 20, gain: 0.1, type: "square" },
  ],
  gameOver: [
    { frequency: 420, durationMs: 80, gain: 0.1, type: "square" },
    { frequency: 260, durationMs: 120, delayMs: 82, gain: 0.11, type: "sawtooth" },
  ],
  walletConnect: [
    { frequency: 680, durationMs: 28, gain: 0.08, type: "triangle" },
    { frequency: 980, durationMs: 42, delayMs: 30, gain: 0.09, type: "triangle" },
  ],
  submitSuccess: [
    { frequency: 740, durationMs: 28, gain: 0.08, type: "square" },
    { frequency: 1020, durationMs: 54, delayMs: 30, gain: 0.1, type: "square" },
  ],
  submitError: [
    { frequency: 330, durationMs: 52, gain: 0.1, type: "square" },
    { frequency: 220, durationMs: 88, delayMs: 54, gain: 0.11, type: "square" },
  ],
  leaderboardSuccess: [
    { frequency: 560, durationMs: 20, gain: 0.08, type: "triangle" },
    { frequency: 820, durationMs: 38, delayMs: 22, gain: 0.1, type: "triangle" },
  ],
  leaderboardError: [
    { frequency: 280, durationMs: 56, gain: 0.1, type: "square" },
    { frequency: 210, durationMs: 72, delayMs: 58, gain: 0.1, type: "square" },
  ],
};

function readMuteState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(SOUND_MUTE_STORAGE_KEY) === "1";
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return new window.AudioContext();
  } catch {
    return null;
  }
}

export function useRetroSounds() {
  const [isMuted, setIsMuted] = useState(readMuteState);
  const [hasInteracted, setHasInteracted] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);

  const unlockAudio = useCallback(() => {
    if (hasInteracted) {
      return;
    }

    const context = contextRef.current ?? createAudioContext();
    if (!context) {
      return;
    }

    contextRef.current = context;
    void context.resume();
    setHasInteracted(true);
  }, [hasInteracted]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [unlockAudio]);

  const play = useCallback(
    (sound: RetroSoundId) => {
      if (isMuted || !hasInteracted) {
        return;
      }

      const context = contextRef.current ?? createAudioContext();
      if (!context) {
        return;
      }
      contextRef.current = context;

      if (context.state !== "running") {
        void context.resume();
      }

      const now = context.currentTime;
      for (const tone of soundMap[sound]) {
        const start = now + (tone.delayMs ?? 0) / 1000;
        const duration = tone.durationMs / 1000;

        const oscillator = context.createOscillator();
        oscillator.type = tone.type ?? "square";
        oscillator.frequency.setValueAtTime(tone.frequency, start);

        const gainNode = context.createGain();
        const maxGain = Math.max(0.0001, (tone.gain ?? 0.1) * MASTER_VOLUME);

        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.linearRampToValueAtTime(maxGain, start + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.015);
      }
    },
    [hasInteracted, isMuted],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      window.localStorage.setItem(SOUND_MUTE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return {
    play,
    isMuted,
    toggleMute,
    hasInteracted,
  };
}

