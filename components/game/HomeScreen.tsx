type HomeScreenProps = {
  onPlay: () => void;
  onOpenLeaderboard: () => void;
  onConnectWallet: () => void;
  onSwitchNetwork?: () => void;
  isSwitchingNetwork?: boolean;
  targetChainName: string;
  isConnected: boolean;
  canSwitchNetwork: boolean;
};

export function HomeScreen({
  onPlay,
  onOpenLeaderboard,
  onConnectWallet,
  onSwitchNetwork,
  isSwitchingNetwork = false,
  targetChainName,
  isConnected,
  canSwitchNetwork,
}: HomeScreenProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-7 rounded-sm border-2 border-[#2e430a] bg-[#92b318]/70 p-5 text-center shadow-[inset_0_0_0_1px_#b3cd50] sm:p-7">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#39500d]">Pocket Arcade Edition</p>
        <h1 className="text-2xl text-[#162703] sm:text-3xl">MonoSnake Base</h1>
        <p className="mx-auto max-w-[40ch] font-['VT323'] text-2xl leading-tight text-[#223507]">
          Clean retro snake. Instant runs. Fast replays. Connect wallet only when you want to
          record your best on Base.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-sm gap-3">
        <button
          type="button"
          onClick={onPlay}
          className="rounded-sm border-2 border-[#27330e] bg-[#9cbc1e] px-4 py-3 text-xs text-[#1d250b] shadow-[3px_3px_0_#40531a] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#40531a] active:translate-y-0 active:shadow-[2px_2px_0_#40531a]"
        >
          START RUN
        </button>
        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-4 py-3 text-xs text-[#1f240c] shadow-[3px_3px_0_#505b2a] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#505b2a] active:translate-y-0 active:shadow-[2px_2px_0_#505b2a]"
        >
          VIEW LEADERBOARD
        </button>
        <button
          type="button"
          onClick={onConnectWallet}
          disabled={isConnected}
          className="rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-4 py-3 text-xs text-[#1f240c] shadow-[3px_3px_0_#505b2a] disabled:opacity-60"
        >
          {isConnected ? "WALLET CONNECTED" : "CONNECT WALLET"}
        </button>
        {isConnected && canSwitchNetwork ? (
          <button
            type="button"
            onClick={onSwitchNetwork}
            disabled={!onSwitchNetwork || isSwitchingNetwork}
            className="rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-4 py-3 text-xs text-[#1f240c] shadow-[3px_3px_0_#505b2a] disabled:opacity-60"
          >
            {isSwitchingNetwork ? "SWITCHING..." : `SWITCH TO ${targetChainName.toUpperCase()}`}
          </button>
        ) : null}
      </div>

      <p className="font-['VT323'] text-xl text-[#2d4310]">Arrows or WASD to play. Short runs, instant restart.</p>
    </div>
  );
}
