"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSignMessage,
  useSwitchChain,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { appNetworkConfig, scoreContractAddresses, targetChain } from "@/config/networks";
import { useSnakeGame } from "@/game/hooks/useSnakeGame";
import type { Direction, GameStatus } from "@/game/types";
import { HomeScreen } from "@/components/game/HomeScreen";
import { SnakeBoard } from "@/components/game/SnakeBoard";
import { TouchControls } from "@/components/game/TouchControls";
import { GameOverPanel } from "@/components/game/GameOverPanel";
import { WalletPanel } from "@/components/wallet/WalletPanel";
import { NetworkSwitchModal } from "@/components/wallet/NetworkSwitchModal";
import { LeaderboardPanel } from "@/components/leaderboard/LeaderboardPanel";
import { scoreContractAbi } from "@/lib/contracts/scoreContract";
import { createScoreClaimMessage, createUsernameMessage } from "@/lib/leaderboard/messages";
import type { LeaderboardResponse } from "@/lib/leaderboard/types";
import { SoundToggle } from "@/components/game/SoundToggle";
import { useRetroSounds } from "@/lib/sound/useRetroSounds";
import { baseAppConfig } from "@/config/baseApp";
import { Attribution } from "ox/erc8021";
import { sdk } from "@farcaster/miniapp-sdk";

type ScreenView = "home" | "game" | "leaderboard";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const BASE_CHAIN_HEX = `0x${targetChain.id.toString(16)}`;
const configuredBuilderCode =
  process.env.NEXT_PUBLIC_BASE_BUILDER_CODE?.trim() ?? baseAppConfig.builderCode.trim();
const isBuilderCodeConfigured =
  configuredBuilderCode.length > 3 && configuredBuilderCode !== "TODO_ADD_BASE_BUILDER_CODE";
const scoreTxDataSuffix = isBuilderCodeConfigured
  ? Attribution.toDataSuffix({ codes: [configuredBuilderCode] })
  : undefined;

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function SnakeApp() {
  const gameViewportRef = useRef<HTMLDivElement | null>(null);
  const [screenView, setScreenView] = useState<ScreenView>("home");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardNote, setLeaderboardNote] = useState<string | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const {
    gameState,
    localBest,
    isPlaying,
    isPaused,
    isGameOver,
    startGame,
    restartGame,
    togglePause,
    setDirection,
  } = useSnakeGame();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingNetwork } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync, isPending: isContractTxPending } = useWriteContract();
  const { play, isMuted, toggleMute } = useRetroSounds();

  const targetChainId = appNetworkConfig.targetChainId;
  const targetChainName = appNetworkConfig.targetChainName;
  const targetContractAddress = scoreContractAddresses[targetChainId];
  const publicClient = usePublicClient({ chainId: targetChainId });

  const safeAddress = (address ?? ZERO_ADDRESS) as `0x${string}`;
  const safeContractAddress = (targetContractAddress ?? ZERO_ADDRESS) as `0x${string}`;
  const canInteractWithContract = Boolean(
    isConnected && address && chainId === targetChainId && targetContractAddress,
  );

  const { data: onchainBestRaw, refetch: refetchOnchainBest } = useReadContract({
    address: safeContractAddress,
    abi: scoreContractAbi,
    functionName: "getBestScore",
    args: [safeAddress],
    query: {
      enabled: canInteractWithContract,
    },
  });

  const onchainBestScore = canInteractWithContract ? Number(onchainBestRaw ?? 0n) : null;
  const chainName = chainId
    ? appNetworkConfig.namesById[chainId as keyof typeof appNetworkConfig.namesById] ?? `Chain ${chainId}`
    : undefined;
  const networkWarning = useMemo(() => {
    if (!isConnected) {
      return undefined;
    }
    if (chainId !== targetChainId) {
      return `Wrong network detected. Switch to ${targetChainName}.`;
    }
    if (!targetContractAddress) {
      return `${targetChainName} contract is not configured yet.`;
    }
    return undefined;
  }, [chainId, isConnected, targetChainId, targetChainName, targetContractAddress]);
  const networkStatusText = useMemo(() => {
    if (!isConnected) {
      return `Target network: ${targetChainName}`;
    }
    if (chainId === targetChainId) {
      return `Ready on ${targetChainName}`;
    }
    return `Wrong network. Switch to ${targetChainName}`;
  }, [chainId, isConnected, targetChainId, targetChainName]);

  const loadLeaderboard = useCallback(
    async ({ manual = false }: { manual?: boolean } = {}) => {
      if (manual) {
        play("buttonClick");
      }

      const params = new URLSearchParams({ chainId: String(targetChainId) });
      if (address) {
        params.set("address", address);
      }

      try {
        setIsLeaderboardLoading(true);
        setLeaderboardError(null);
        setLeaderboardNote(null);
        const response = await fetch(`/api/leaderboard?${params.toString()}`);
        const payload = await readJsonSafely<LeaderboardResponse & { error?: string }>(response);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to fetch leaderboard data.");
        }
        if (!payload) {
          throw new Error("Leaderboard service returned an empty response.");
        }
        setLeaderboardData(payload);
        setLeaderboardNote(payload.note ?? null);

        if (manual) {
          play("leaderboardSuccess");
          setStatusMessage("Leaderboard refreshed.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch leaderboard data.";
        setLeaderboardError(message);
        if (manual) {
          play("leaderboardError");
          setStatusMessage("Leaderboard refresh failed.");
        }
      } finally {
        setIsLeaderboardLoading(false);
      }
    },
    [address, play, targetChainId],
  );

  useEffect(() => {
    let cancelled = false;

    async function markMiniAppReady() {
      try {
        await sdk.actions.ready({ disableNativeGestures: true });
      } catch {
        if (!cancelled) {
          // Ignore when running outside supported mini app hosts.
        }
      }
    }

    void markMiniAppReady();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!address) {
      setUsernameInput("");
      return;
    }

    async function loadProfile() {
      try {
        const response = await fetch(`/api/profile?address=${address}`);
        const payload = await readJsonSafely<{ username: string | null }>(response);
        if (!payload) {
          setUsernameInput("");
          return;
        }
        setUsernameInput(payload.username ?? "");
      } catch {
        setUsernameInput("");
      }
    }

    void loadProfile();
  }, [address]);

  useEffect(() => {
    if (screenView !== "game") {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };

      const direction = map[event.key];
      if (direction) {
        event.preventDefault();
        setDirection(direction);
      }

      if (event.key === " " || event.key.toLowerCase() === "p") {
        event.preventDefault();
        togglePause();
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        play("gameStart");
        restartGame();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [play, restartGame, screenView, setDirection, togglePause]);

  useEffect(() => {
    if (screenView !== "game") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (!window.matchMedia("(max-width: 1023px)").matches) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      gameViewportRef.current?.scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "auto",
      });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [screenView]);

  useEffect(() => {
    if (!isConnected) {
      setShowNetworkModal(false);
      return;
    }
    if (chainId !== targetChainId) {
      setShowNetworkModal(true);
      return;
    }
    setShowNetworkModal(false);
  }, [chainId, isConnected, targetChainId]);

  const previousScoreRef = useRef(gameState.score);
  useEffect(() => {
    const previousScore = previousScoreRef.current;
    if (gameState.score > previousScore) {
      play("foodCollect");
      play("scoreIncrease");
    }
    previousScoreRef.current = gameState.score;
  }, [gameState.score, play]);

  const previousStatusRef = useRef<GameStatus>(gameState.status);
  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    if (gameState.status === "game-over" && previousStatus !== "game-over") {
      play("gameOver");
    }
    previousStatusRef.current = gameState.status;
  }, [gameState.status, play]);

  const previousConnectedRef = useRef(isConnected);
  useEffect(() => {
    if (isConnected && !previousConnectedRef.current) {
      play("walletConnect");
      setStatusMessage("Wallet connected.");
    }
    previousConnectedRef.current = isConnected;
  }, [isConnected, play]);

  const startRound = useCallback(() => {
    play("buttonClick");
    play("gameStart");
    setScreenView("game");
    setStatusMessage(null);
    startGame();
  }, [play, startGame]);

  const replayRound = useCallback(() => {
    play("buttonClick");
    play("gameStart");
    restartGame();
  }, [play, restartGame]);

  const saveUsername = useCallback(async () => {
    play("buttonClick");

    if (!address || !isConnected) {
      setStatusMessage("Connect wallet to save your username.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(usernameInput)) {
      setStatusMessage("Username must be 2-20 chars using letters/numbers/underscore.");
      return;
    }

    try {
      setIsSavingUsername(true);
      const nonce = Date.now();
      const message = createUsernameMessage(address, usernameInput, nonce);
      const signature = await signMessageAsync({ message });

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          username: usernameInput,
          signature,
          nonce,
        }),
      });
      const payload = await readJsonSafely<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save username.");
      }
      setStatusMessage("Username saved.");
      await loadLeaderboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save username.";
      setStatusMessage(message);
    } finally {
      setIsSavingUsername(false);
    }
  }, [address, isConnected, loadLeaderboard, play, signMessageAsync, usernameInput]);

  const attemptSwitchToTargetNetwork = useCallback(async (): Promise<boolean> => {
    try {
      await switchChainAsync({ chainId: targetChainId });
      setStatusMessage(`Switched to ${targetChainName}.`);
      setShowNetworkModal(false);
      return true;
    } catch (error) {
      try {
        const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
        if (!provider) {
          throw error;
        }

        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_HEX }],
          });
        } catch (switchError) {
          const code = (switchError as { code?: number }).code;
          if (code !== 4902) {
            throw switchError;
          }

          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_CHAIN_HEX,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: targetChain.rpcUrls.default.http,
                blockExplorerUrls: targetChain.blockExplorers?.default?.url
                  ? [targetChain.blockExplorers.default.url]
                  : [],
              },
            ],
          });
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_HEX }],
          });
        }

        setStatusMessage(`Switched to ${targetChainName}.`);
        setShowNetworkModal(false);
        return true;
      } catch (fallbackError) {
        const message =
          fallbackError instanceof Error ? fallbackError.message : "Network switch failed.";
        setStatusMessage(message);
        return false;
      }
    }
  }, [switchChainAsync, targetChainId, targetChainName]);

  const submitScore = useCallback(async () => {
    play("buttonClick");

    if (!address || !isConnected) {
      setStatusMessage("Connect wallet to submit your score.");
      return;
    }

    if (chainId !== targetChainId) {
      setStatusMessage(`Switching to ${targetChainName}...`);
      const switched = await attemptSwitchToTargetNetwork();
      if (!switched) {
        return;
      }
    }

    if (!targetContractAddress) {
      setStatusMessage(`${targetChainName} score contract is not configured yet.`);
      return;
    }
    if (gameState.score <= 0) {
      setStatusMessage("Score must be above zero.");
      return;
    }
    if (!publicClient) {
      setStatusMessage("Network client not ready yet. Try again.");
      return;
    }

    let latestOnchainBest = onchainBestScore ?? 0;
    try {
      const latestBestRaw = await publicClient.readContract({
        address: targetContractAddress,
        abi: scoreContractAbi,
        functionName: "getBestScore",
        args: [safeAddress],
      });
      latestOnchainBest = Number(latestBestRaw ?? 0n);
    } catch {
      // Keep cached value if a fresh read is temporarily unavailable.
    }

    if (gameState.score <= latestOnchainBest) {
      setStatusMessage(
        `Score ${gameState.score} is not higher than your onchain best (${latestOnchainBest}). Beat it to submit.`,
      );
      return;
    }

    try {
      setIsSubmittingScore(true);
      const nonce = Date.now();
      const sessionId = crypto.randomUUID();
      const claimMessage = createScoreClaimMessage(address, gameState.score, nonce, sessionId);
      const signature = await signMessageAsync({ message: claimMessage });

      try {
        const claimResponse = await fetch("/api/submit-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            score: gameState.score,
            nonce,
            sessionId,
            signature,
          }),
        });
        const claimPayload = await readJsonSafely<{ error?: string }>(claimResponse);
        if (!claimResponse.ok) {
          if (claimResponse.status === 400 || claimResponse.status === 401) {
            throw new Error(claimPayload?.error ?? "Signed score claim failed.");
          }
          setStatusMessage("Score claim service unavailable. Continuing onchain.");
        }
      } catch (claimError) {
        if (claimError instanceof Error && /signature verification failed/i.test(claimError.message)) {
          throw claimError;
        }
        setStatusMessage("Score claim service unavailable. Continuing onchain.");
      }

      const txHash = await writeContractAsync({
        address: targetContractAddress,
        abi: scoreContractAbi,
        functionName: "submitScore",
        args: [BigInt(gameState.score)],
        chainId: targetChainId,
        ...(scoreTxDataSuffix ? { dataSuffix: scoreTxDataSuffix } : {}),
      });

      setStatusMessage("Transaction sent. Waiting for confirmation...");
      if (!publicClient) {
        throw new Error("Public client is unavailable for receipt confirmation.");
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Onchain score transaction failed.");
      }

      play("submitSuccess");
      setStatusMessage("Score submitted onchain successfully.");
      await refetchOnchainBest();
      await loadLeaderboard();
    } catch (error) {
      play("submitError");
      const message = error instanceof Error ? error.message : "Score submission failed.";
      if (
        /scoremustincrease|execution reverted|simulation failed|revert #-39000/i.test(message)
      ) {
        setStatusMessage("Submission rejected: score must be higher than your current onchain best.");
      } else {
        setStatusMessage(message);
      }
    } finally {
      setIsSubmittingScore(false);
    }
  }, [
    address,
    attemptSwitchToTargetNetwork,
    chainId,
    gameState.score,
    isConnected,
    loadLeaderboard,
    play,
    publicClient,
    refetchOnchainBest,
    safeAddress,
    signMessageAsync,
    targetChainId,
    targetChainName,
    targetContractAddress,
    writeContractAsync,
    onchainBestScore,
  ]);

  const connectWallet = useCallback(() => {
    play("buttonClick");
    const connector = connectors[0];
    if (!connector) {
      setStatusMessage("No injected wallet was found.");
      return;
    }
    connect({ connector });
  }, [connect, connectors, play]);

  const switchToTargetNetwork = useCallback(async () => {
    play("buttonClick");
    await attemptSwitchToTargetNetwork();
  }, [attemptSwitchToTargetNetwork, play]);

  const toggleSound = useCallback(() => {
    if (isMuted) {
      toggleMute();
      play("buttonClick");
      return;
    }
    play("buttonClick");
    toggleMute();
  }, [isMuted, play, toggleMute]);

  const openHome = useCallback(() => {
    play("buttonClick");
    setScreenView("home");
  }, [play]);

  const openLeaderboard = useCallback(() => {
    play("buttonClick");
    setScreenView("leaderboard");
    void loadLeaderboard({ manual: true });
  }, [loadLeaderboard, play]);

  const togglePauseFromButton = useCallback(() => {
    play("buttonClick");
    togglePause();
  }, [play, togglePause]);

  const showSubmitButton = isConnected && isGameOver && gameState.score > 0;
  const isGameScreen = screenView === "game";
  const isMobileCompactGame = isGameScreen;
  const canBeatOnchainBest = onchainBestScore === null || gameState.score > onchainBestScore;
  const submitDisabled = chainId === targetChainId && !canBeatOnchainBest;
  const showSwitchNetworkButton = isConnected && chainId !== targetChainId;
  const submitButtonLabel =
    chainId !== targetChainId
      ? `Switch to ${targetChainName}`
      : onchainBestScore !== null && gameState.score <= onchainBestScore
        ? `Need > ${onchainBestScore}`
      : targetContractAddress
        ? "Save Score Onchain"
        : "Contract Missing";
  const isLeaderboardScreen = screenView === "leaderboard";
  const leaderboardSetupMissing = Boolean(
    leaderboardNote && leaderboardNote.toLowerCase().includes("not configured"),
  );
  const controlButtonClass =
    "rounded-sm border-2 border-[#3f4f1a] bg-[#d8d5c2] px-3 py-2 text-[10px] text-[#1f240c] shadow-[2px_2px_0_#7f8f5a] transition active:translate-y-[1px] active:shadow-[1px_1px_0_#7f8f5a]";
  const primaryButtonClass =
    "rounded-sm border-2 border-[#27330e] bg-[#9cbc1e] px-3 py-2 text-[10px] text-[#1d250b] shadow-[2px_2px_0_#617a22] transition active:translate-y-[1px] active:shadow-[1px_1px_0_#617a22]";

  return (
    <main
      className={`${isGameScreen ? "min-h-[100dvh] overscroll-y-none px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] sm:px-3 sm:py-3" : "min-h-screen px-3 py-5 sm:px-4 sm:py-6"} bg-[radial-gradient(circle_at_top,#f3f0e3_0%,#ddd9c4_58%,#cbc7ae_100%)] text-[#1f240c]`}
    >
      <div
        className={`mx-auto grid w-full max-w-[1380px] ${isMobileCompactGame ? "gap-2 sm:gap-3" : "gap-4"} lg:grid-cols-[minmax(0,1.68fr)_minmax(238px,0.68fr)]`}
      >
        <section
          ref={gameViewportRef}
          className={`rounded-[26px] border-[4px] border-[#b6b18f] bg-[#ece9d8] ${isMobileCompactGame ? "p-2 sm:p-3" : "p-3 sm:p-4"} shadow-[0_14px_0_#8f8a68,0_22px_34px_rgba(68,60,30,0.2),inset_0_0_0_1px_#faf7e7]`}
        >
          <div className="mb-3 rounded-xl border-2 border-[#a6a17b] bg-[#dfdbc7] px-3 py-2 shadow-[inset_0_1px_0_#f7f4e8]">
            <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-[#4f5f2b]">
              <p>MonoSnake Base</p>
              <p>{targetChainName}</p>
            </div>
          </div>

          <div className="rounded-md border-[4px] border-[#26390a] bg-[#8faa17] p-3 shadow-[inset_0_0_0_2px_#5b730f,inset_0_7px_18px_rgba(245,255,198,0.09)] sm:p-4">
            {screenView === "home" ? (
              <HomeScreen
                onPlay={startRound}
                onOpenLeaderboard={openLeaderboard}
                onConnectWallet={connectWallet}
                onSwitchNetwork={showSwitchNetworkButton ? switchToTargetNetwork : undefined}
                isSwitchingNetwork={isSwitchingNetwork}
                targetChainName={targetChainName}
                isConnected={isConnected}
                canSwitchNetwork={showSwitchNetworkButton}
              />
            ) : null}

            {screenView === "leaderboard" ? (
              <LeaderboardPanel
                entries={leaderboardData?.top ?? []}
                personalBest={leaderboardData?.personalBest ?? null}
                isLoading={isLeaderboardLoading}
                error={leaderboardError}
                note={leaderboardNote}
                setupMissing={leaderboardSetupMissing}
                onRefresh={() => void loadLeaderboard({ manual: true })}
              />
            ) : null}

            {screenView === "game" ? (
              <div className="relative">
                <div className="relative overflow-hidden rounded-sm border border-[#607a17] bg-[#95b51a] px-1.5 py-1.5 sm:px-2.5 sm:py-2">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-multiply"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(34,52,8,0.22) 0px, rgba(34,52,8,0.22) 1px, transparent 1px, transparent 5px)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.16]"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(23,35,6,0.22) 0%, rgba(23,35,6,0.02) 16%, rgba(23,35,6,0.02) 84%, rgba(23,35,6,0.22) 100%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                      background:
                        "radial-gradient(circle at 22% 52%, rgba(45,69,11,0.25) 0%, transparent 27%), radial-gradient(circle at 78% 48%, rgba(45,69,11,0.25) 0%, transparent 27%)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-multiply"
                    style={{
                      background:
                        "radial-gradient(circle at 11% 26%, rgba(56,88,14,0.45) 0 2px, transparent 2px), radial-gradient(circle at 89% 72%, rgba(56,88,14,0.45) 0 1.5px, transparent 1.5px), radial-gradient(circle at 84% 22%, rgba(56,88,14,0.35) 0 1.5px, transparent 1.5px)",
                    }}
                  />

                  <div className="relative z-20 mb-1 flex items-start justify-between gap-2 px-0.5 text-[#203308] sm:gap-3">
                    <div className="leading-none">
                      <p className="text-[9px] uppercase tracking-[0.15em] opacity-75">SCORE</p>
                      <p className="font-['VT323'] text-[34px] leading-none sm:text-3xl">{gameState.score}</p>
                    </div>

                    <div className="pt-0.5 text-center text-[9px] uppercase tracking-[0.14em] opacity-80">
                      <p>SPD {gameState.tickMs}MS</p>
                      <p>{isPaused ? "PAUSED" : isGameOver ? "GAME OVER" : "RUNNING"}</p>
                    </div>

                    <div className="text-right leading-none">
                      <p className="text-[9px] uppercase tracking-[0.15em] opacity-75">BEST</p>
                      <p className="font-['VT323'] text-[34px] leading-none sm:text-3xl">{localBest}</p>
                      <div className="mt-0.5 flex justify-end">
                        <SoundToggle
                          isMuted={isMuted}
                          onToggle={toggleSound}
                          className="rounded-sm border border-[#587216]/70 bg-[#8eac1a]/35 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#213608]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-center pt-1">
                    <div className="relative inline-block">
                      <SnakeBoard gameState={gameState} />

                      {isPaused ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#243409]/70">
                          <p className="rounded-sm border border-[#d8d5c2] bg-[#d8d5c2] px-4 py-2 text-sm text-[#1f240c]">
                            PAUSED
                          </p>
                        </div>
                      ) : null}

                      {isGameOver ? (
                        <GameOverPanel
                          score={gameState.score}
                          localBest={localBest}
                          canSubmitScore={showSubmitButton}
                          submitDisabled={submitDisabled}
                          isSubmitting={isSubmittingScore || isContractTxPending}
                          submitLabel={submitButtonLabel}
                          onReplay={replayRound}
                          onSubmit={submitScore}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>

                <TouchControls
                  onDirection={setDirection}
                  disabled={screenView !== "game" || isPaused || isGameOver}
                />
              </div>
            ) : null}
          </div>

          <div
            className={`${isGameScreen ? "hidden md:flex" : "flex"} ${isMobileCompactGame ? "mt-2" : "mt-3"} flex-wrap gap-2`}
          >
            <button type="button" onClick={openHome} className={controlButtonClass}>
              HOME
            </button>
            <button type="button" onClick={startRound} className={primaryButtonClass}>
              PLAY
            </button>
            <button
              type="button"
              onClick={togglePauseFromButton}
              disabled={screenView !== "game" || isGameOver}
              className={`${controlButtonClass} disabled:opacity-40`}
            >
              {isPlaying ? "PAUSE" : "RESUME"}
            </button>
            <button
              type="button"
              onClick={replayRound}
              disabled={screenView !== "game"}
              className={`${controlButtonClass} disabled:opacity-40`}
            >
              RESTART
            </button>
            <button
              type="button"
              onClick={openLeaderboard}
              className={isLeaderboardScreen ? primaryButtonClass : controlButtonClass}
            >
              LEADERBOARD
            </button>
            {showSwitchNetworkButton ? (
              <button
                type="button"
                onClick={() => void switchToTargetNetwork()}
                disabled={isSwitchingNetwork}
                className={`${controlButtonClass} disabled:opacity-50`}
              >
                {isSwitchingNetwork ? "SWITCHING..." : `SWITCH ${targetChainName.toUpperCase()}`}
              </button>
            ) : null}
          </div>

          {!isMobileCompactGame ? (
            <p className="mt-2 font-['VT323'] text-2xl leading-none text-[#2e3f12]">
              Arrows/WASD move | Space or P pause | R restart
            </p>
          ) : null}
          {statusMessage ? (
            <p className="mt-2 rounded-sm border border-[#5b6a31] bg-[#d8d5c2] px-2 py-1.5 text-xs text-[#2c3713]">
              {statusMessage}
            </p>
          ) : null}
        </section>

        <aside className={`${isGameScreen ? "hidden lg:block" : "block"} space-y-2.5 self-start lg:pt-1`}>
          <WalletPanel
            isConnected={isConnected}
            address={address}
            chainName={chainName}
            targetChainName={targetChainName}
            networkStatusText={networkStatusText}
            networkWarning={networkWarning}
            onConnect={connectWallet}
            onDisconnect={() => {
              play("buttonClick");
              disconnect();
            }}
            onSwitchNetwork={chainId !== targetChainId ? switchToTargetNetwork : undefined}
            isSwitchingNetwork={isSwitchingNetwork}
            usernameInput={usernameInput}
            onUsernameInput={setUsernameInput}
            onSaveUsername={saveUsername}
            isSavingUsername={isSavingUsername}
            onchainBest={onchainBestScore}
          />

          <LeaderboardPanel
            entries={leaderboardData?.top ?? []}
            personalBest={leaderboardData?.personalBest ?? null}
            isLoading={isLeaderboardLoading}
            error={leaderboardError}
            note={leaderboardNote}
            setupMissing={leaderboardSetupMissing}
            onRefresh={() => void loadLeaderboard({ manual: true })}
            compact
          />
          {isConnecting ? (
            <div className="rounded-md border border-[#617439] bg-[#d8d5c2] px-2 py-1 text-xs text-[#455426]">
              Connecting wallet...
            </div>
          ) : null}
        </aside>
      </div>

      <NetworkSwitchModal
        isOpen={showNetworkModal}
        currentChainName={chainName}
        targetChainName={targetChainName}
        isSwitching={isSwitchingNetwork}
        onSwitch={() => void switchToTargetNetwork()}
        onDismiss={() => setShowNetworkModal(false)}
      />
    </main>
  );
}
