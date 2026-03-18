export type LeaderboardEntry = {
  rank: number;
  address: `0x${string}`;
  username: string | null;
  score: number;
  achievedAt: number;
};

export type LeaderboardResponse = {
  chainId: number;
  contractAddress: `0x${string}` | null;
  totalPlayers: number;
  top: LeaderboardEntry[];
  personalBest: LeaderboardEntry | null;
  source: "onchain-events";
  note?: string;
};

export type ProfileRecord = {
  username: string;
  updatedAt: number;
};

