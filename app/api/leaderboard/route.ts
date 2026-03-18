import { NextRequest, NextResponse } from "next/server";
import { isAddress, parseAbiItem } from "viem";
import { appNetworkConfig } from "@/config/networks";
import { createScorePublicClient, resolveContractAddress } from "@/lib/contracts/clients";
import { readProfiles } from "@/lib/leaderboard/storage";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/types";

const MAX_LOG_RANGE = 10_000n;
const DEFAULT_LOOKBACK_BLOCKS = 200_000n;

function getChainId(request: NextRequest): number {
  const chainIdParam = request.nextUrl.searchParams.get("chainId");
  const parsed = chainIdParam ? Number(chainIdParam) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : appNetworkConfig.targetChainId;
}

function parseOptionalBigInt(value: string | undefined): bigint | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = BigInt(value);
    return parsed >= 0n ? parsed : null;
  } catch {
    return null;
  }
}

function resolveFromBlock(chainId: number, latestBlock: bigint): { fromBlock: bigint; note?: string } {
  const fromBlockEnv =
    chainId === 8453
      ? process.env.SCORE_EVENTS_FROM_BLOCK_BASE_MAINNET
      : process.env.SCORE_EVENTS_FROM_BLOCK_BASE_SEPOLIA;
  const explicitFromBlock = parseOptionalBigInt(fromBlockEnv);

  if (explicitFromBlock !== null) {
    return {
      fromBlock: explicitFromBlock <= latestBlock ? explicitFromBlock : latestBlock,
    };
  }

  const configuredLookback =
    parseOptionalBigInt(process.env.SCORE_EVENTS_LOOKBACK_BLOCKS) ?? DEFAULT_LOOKBACK_BLOCKS;
  const fallbackFromBlock = latestBlock > configuredLookback ? latestBlock - configuredLookback : 0n;

  return {
    fromBlock: fallbackFromBlock,
    note:
      "Using fallback scan window. Set SCORE_EVENTS_FROM_BLOCK_BASE_MAINNET for full indexing.",
  };
}

async function fetchScoreLogsChunked({
  publicClient,
  contractAddress,
  fromBlock,
  toBlock,
}: {
  publicClient: ReturnType<typeof createScorePublicClient>;
  contractAddress: `0x${string}`;
  fromBlock: bigint;
  toBlock: bigint;
}) {
  const logs = [];
  let failedChunks = 0;
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const batchToBlock = cursor + MAX_LOG_RANGE - 1n < toBlock ? cursor + MAX_LOG_RANGE - 1n : toBlock;

    let batchSucceeded = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const batch = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem(
            "event ScoreUpdated(address indexed player, uint256 previousBest, uint256 newBest, uint256 timestamp)",
          ),
          fromBlock: cursor,
          toBlock: batchToBlock,
        });
        logs.push(...batch);
        batchSucceeded = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 220 * (attempt + 1)));
      }
    }

    if (!batchSucceeded) {
      failedChunks += 1;
    }

    cursor = batchToBlock + 1n;
  }

  return { logs, failedChunks };
}

export async function GET(request: NextRequest) {
  const chainId = getChainId(request);
  const contractAddress = resolveContractAddress(chainId);

  if (!contractAddress) {
    const response: LeaderboardResponse = {
      chainId,
      contractAddress: null,
      totalPlayers: 0,
      top: [],
      personalBest: null,
      source: "onchain-events",
      note: "Score contract address is not configured for this chain.",
    };
    return NextResponse.json(response);
  }

  const queryAddress = request.nextUrl.searchParams.get("address");
  const normalizedAddress =
    queryAddress && isAddress(queryAddress) ? queryAddress.toLowerCase() : null;

  const publicClient = createScorePublicClient(chainId);
  const [latestBlock, profiles] = await Promise.all([publicClient.getBlockNumber(), readProfiles()]);
  const { fromBlock, note } = resolveFromBlock(chainId, latestBlock);

  const { logs, failedChunks } = await fetchScoreLogsChunked({
    publicClient,
    contractAddress,
    fromBlock,
    toBlock: latestBlock,
  });

  const byPlayer = new Map<string, { score: number; achievedAt: number }>();
  for (const log of logs) {
    const player = (log.args.player as string).toLowerCase();
    const score = Number(log.args.newBest);
    const achievedAt = Number(log.args.timestamp) * 1000;
    byPlayer.set(player, { score, achievedAt });
  }

  const sorted = [...byPlayer.entries()]
    .map(([address, value]) => ({
      address: address as `0x${string}`,
      score: value.score,
      achievedAt: value.achievedAt,
      username: profiles[address]?.username ?? null,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.achievedAt - b.achievedAt;
    });

  const top: LeaderboardEntry[] = sorted.slice(0, 20).map((entry, index) => ({
    rank: index + 1,
    address: entry.address,
    username: entry.username,
    score: entry.score,
    achievedAt: entry.achievedAt,
  }));

  const personal = normalizedAddress
    ? sorted.find((entry) => entry.address.toLowerCase() === normalizedAddress) ?? null
    : null;

  const personalBest: LeaderboardEntry | null = personal
    ? {
        rank:
          sorted.findIndex((entry) => entry.address.toLowerCase() === personal.address.toLowerCase()) +
          1,
        address: personal.address,
        username: personal.username,
        score: personal.score,
        achievedAt: personal.achievedAt,
      }
    : null;

  const response: LeaderboardResponse = {
    chainId,
    contractAddress,
    totalPlayers: sorted.length,
    top,
    personalBest,
    source: "onchain-events",
    note:
      failedChunks > 0 && note
        ? `${note} Partial RPC retries occurred; a dedicated RPC will be more reliable.`
        : failedChunks > 0
          ? "Leaderboard loaded with partial RPC retries. Use a dedicated RPC for best reliability."
          : note,
  };

  return NextResponse.json(response);
}
