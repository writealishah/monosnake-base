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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1a2609]/68 p-2.5 backdrop-blur-[1px] sm:p-4">
      <div className="max-h-[96%] w-full max-w-[288px] overflow-y-auto rounded-sm border-[3px] border-[#192508] bg-[#d8d5c2] p-3.5 text-center shadow-[0_8px_0_#334513,inset_0_0_0_1px_#f4f0dd] sm:max-h-none sm:max-w-sm sm:p-5">
        <h2 className="text-[13px] text-[#1f240c] sm:text-base">RUN COMPLETE</h2>
        <p className="mt-1.5 font-['VT323'] text-[38px] leading-none text-[#223407] sm:mt-2 sm:text-4xl">
          {score}
        </p>
        <p className="font-['VT323'] text-[27px] text-[#3b4a17] sm:text-2xl">BEST {localBest}</p>
        {isBestRun ? (
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[#334d0d] sm:mt-1 sm:text-[10px]">
            New local best
          </p>
        ) : null}

        <div className="mt-3 grid gap-1.5 sm:mt-4 sm:gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="min-h-10 rounded-sm border-2 border-[#27330e] bg-[#9cbc1e] px-3 py-2 text-[11px] text-[#1d250b] shadow-[3px_3px_0_#40531a] active:translate-y-[1px] active:shadow-[2px_2px_0_#40531a] sm:min-h-11 sm:text-xs"
          >
            PLAY AGAIN
          </button>
          <button
            type="button"
            onClick={onShare}
            className="min-h-10 rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[3px_3px_0_#505b2a] active:translate-y-[1px] active:shadow-[2px_2px_0_#505b2a] sm:min-h-11"
          >
            SHARE SCORE
          </button>
          {canSubmitScore ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || submitDisabled}
              className="min-h-10 rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[3px_3px_0_#505b2a] disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-[1px] active:shadow-[2px_2px_0_#505b2a] sm:min-h-11"
            >
              {isSubmitting ? "SUBMITTING..." : submitLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
