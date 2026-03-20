type GameOverPanelProps = {
  score: number;
  localBest: number;
  canSubmitScore: boolean;
  submitDisabled?: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onReplay: () => void;
  onSubmit: () => void;
  onShare: () => void;
};

export function GameOverPanel({
  score,
  localBest,
  canSubmitScore,
  submitDisabled = false,
  isSubmitting,
  submitLabel,
  onReplay,
  onSubmit,
  onShare,
}: GameOverPanelProps) {
  const isBestRun = score >= localBest && score > 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1a2609]/68 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-sm border-[3px] border-[#192508] bg-[#d8d5c2] p-5 text-center shadow-[0_8px_0_#334513,inset_0_0_0_1px_#f4f0dd]">
        <h2 className="text-base text-[#1f240c]">RUN COMPLETE</h2>
        <p className="mt-2 font-['VT323'] text-4xl leading-none text-[#223407]">{score}</p>
        <p className="font-['VT323'] text-2xl text-[#3b4a17]">BEST {localBest}</p>
        {isBestRun ? (
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#334d0d]">New local best</p>
        ) : null}

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-sm border-2 border-[#27330e] bg-[#9cbc1e] px-3 py-2 text-xs text-[#1d250b] shadow-[3px_3px_0_#40531a] active:translate-y-[1px] active:shadow-[2px_2px_0_#40531a]"
          >
            PLAY AGAIN
          </button>
          <button
            type="button"
            onClick={onShare}
            className="rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[3px_3px_0_#505b2a] active:translate-y-[1px] active:shadow-[2px_2px_0_#505b2a]"
          >
            SHARE SCORE
          </button>
          {canSubmitScore ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || submitDisabled}
              className="rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[3px_3px_0_#505b2a] disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-[1px] active:shadow-[2px_2px_0_#505b2a]"
            >
              {isSubmitting ? "SUBMITTING..." : submitLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
