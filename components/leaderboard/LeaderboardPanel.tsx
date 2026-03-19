import type { LeaderboardEntry } from "@/lib/leaderboard/types";
import { formatDateTime } from "@/lib/utils";

type LeaderboardPanelProps = {
  entries: LeaderboardEntry[];
  personalBest: LeaderboardEntry | null;
  isLoading: boolean;
  error: string | null;
  note?: string | null;
  setupMissing?: boolean;
  onRefresh: () => void;
  compact?: boolean;
};

const identitySourceLabel: Record<LeaderboardEntry["identitySource"], string> = {
  basename: "Base",
  ens: "ENS",
  custom: "Custom",
  address: "Address",
};

export function LeaderboardPanel({
  entries,
  personalBest,
  isLoading,
  error,
  note,
  setupMissing = false,
  onRefresh,
  compact = false,
}: LeaderboardPanelProps) {
  const hasData = entries.length > 0;

  return (
    <div
      className={`space-y-2.5 rounded-md border-2 border-[#435220] bg-[#ece9d8] shadow-[0_4px_0_#a8a483] ${compact ? "p-2.5" : "p-3"}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-[#334215]">Leaderboard</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-sm border border-[#556732] bg-[#d8d5c2] px-2 py-1 text-[10px] text-[#1f240c] shadow-[1px_1px_0_#7f8f5a]"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-sm border border-[#5b6a31] bg-[#d8d5c2] p-2.5">
          <p className="font-['VT323'] text-2xl leading-none text-[#334215]">Loading leaderboard...</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-sm border border-[#7a1d1d] bg-[#f3d8d8] p-2.5 text-xs text-[#631313]">
          <p>Could not load leaderboard right now.</p>
          <p className="mt-1 opacity-80">{error}</p>
        </div>
      ) : null}

      {!error && !isLoading && setupMissing ? (
        <div className="rounded-sm border border-[#6b7248] bg-[#e5e1cf] p-2.5 text-xs text-[#48522d]">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#59663a]">Setup Needed</p>
          <p className="mt-1">Leaderboard is not configured on this network yet.</p>
          <p className="mt-1">Switch to Base Sepolia or set the score contract address.</p>
        </div>
      ) : null}

      {!error && !isLoading && !setupMissing && note ? (
        <div className="rounded-sm border border-[#6c7245] bg-[#e3e0cf] p-2 text-xs text-[#4d5430]">{note}</div>
      ) : null}

      {!isLoading && !error && !setupMissing ? (
        <div
          className={`overflow-auto rounded-sm border border-[#5b6a31] ${compact ? "max-h-[210px]" : "max-h-[360px]"}`}
        >
          <table className="w-full border-collapse text-left text-[10px] text-[#1f240c]">
            <thead className="sticky top-0 bg-[#d8d5c2]">
              <tr>
                <th className="border-b border-[#5b6a31] px-2 py-1">#</th>
                <th className="border-b border-[#5b6a31] px-2 py-1">Player</th>
                <th className="border-b border-[#5b6a31] px-2 py-1">Score</th>
                {!compact ? <th className="border-b border-[#5b6a31] px-2 py-1">Time</th> : null}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.address} className="odd:bg-[#ece9d8] even:bg-[#e0ddcb]">
                  <td className="px-2 py-1 font-mono">{entry.rank}</td>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-['VT323'] text-lg leading-none">{entry.displayName}</span>
                      <span className="rounded-sm border border-[#6f7a45] bg-[#d8d5c2] px-1 py-0.5 text-[8px] uppercase tracking-[0.08em] text-[#4f5d2c]">
                        {identitySourceLabel[entry.identitySource]}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1 font-['VT323'] text-lg leading-none">{entry.score}</td>
                  {!compact ? <td className="px-2 py-1">{formatDateTime(entry.achievedAt)}</td> : null}
                </tr>
              ))}
              {!hasData ? (
                <tr>
                  <td className="px-2 py-3 text-center text-xs text-[#3f4b1f]" colSpan={compact ? 3 : 4}>
                    No scores submitted yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="rounded-sm border border-[#5b6a31] bg-[#d8d5c2] p-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#4c5a27]">Your Best</p>
        {personalBest ? (
          <p className="font-['VT323'] text-2xl leading-none text-[#27330e]">
            #{personalBest.rank} | {personalBest.score} | {personalBest.displayName}
          </p>
        ) : (
          <p className="font-['VT323'] text-xl leading-none text-[#3f4b1f]">No onchain best yet.</p>
        )}
      </div>
    </div>
  );
}
