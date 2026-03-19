import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress, parseAbiItem, toCoinType } from "viem";
import { mainnet } from "viem/chains";
import { appNetworkConfig } from "@/config/networks";
import { createScorePublicClient, resolveContractAddress } from "@/lib/contracts/clients";
import { readProfiles } from "@/lib/leaderboard/storage";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/leaderboard/types";

const MAX_LOG_RANGE = 10_000n;
const DEFAULT_LOOKBACK_BLOCKS = 200_000n;
const ENS_LOOKUP_TIMEOUT_MS = 1_400;

const ensLookupClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_MAINNET_RPC_URL ?? mainnet.rpcUrls.default.http[0]),
});

type RankedScore = {
  address: `0x${string}`;
  score: number;
  achievedAt: number;
  username: string | null;
};

type ResolvedIdentity = Pick<LeaderboardEntry, "displayName" | "identitySource">;

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

function shortenAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function resolveCoinType(chainId: number): bigint {
  try {
    return toCoinType(chainId);
  } catch {
    return 60n;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
  });

  const result = await Promise.race([promise.then((value) => value as T).catch(() => null), timeoutPromise]);

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  return result as T | null;
}

async function lookupEnsName(address: `0x${string}`, coinType: bigint): Promise<string | null> {
  return withTimeout(
    ensLookupClient.getEnsName({
      address,
      coinType,
      strict: false,
    }),
    ENS_LOOKUP_TIMEOUT_MS,
  );
}

async function resolveIdentity({
  address,
  chainId,
  username,
  cache,
}: {
  address: `0x${string}`;
  chainId: number;
  username: string | null;
  cache: Map<string, Promise<ResolvedIdentity>>;
}): Promise<ResolvedIdentity> {
  const cacheKey = address.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const resolutionPromise = (async () => {
    const basenameCoinType = resolveCoinType(chainId);
    const basenameName = await lookupEnsName(address, basenameCoinType);
    if (basenameName && basenameName.toLowerCase().endsWith(".base.eth")) {
      return {
        displayName: basenameName,
        identitySource: "basename",
      } satisfies ResolvedIdentity;
    }

    const ensName =
      basenameCoinType === 60n ? basenameName : await lookupEnsName(address, 60n);
    if (ensName) {
      return {
        displayName: ensName,
        identitySource: ensName.toLowerCase().endsWith(".base.eth") ? "basename" : "ens",
      } satisfies ResolvedIdentity;
    }

    if (username) {
      return {
        displayName: username,
        identitySource: "custom",
      } satisfies ResolvedIdentity;
    }

    return {
      displayName: shortenAddress(address),
      identitySource: "address",
    } satisfies ResolvedIdentity;
  })();

  cache.set(cacheKey, resolutionPromise);
  return resolutionPromise;
}

async function toLeaderboardEntry({
  row,
  rank,
  chainId,
  cache,
}: {
  row: RankedScore;
  rank: number;
  chainId: number;
  cache: Map<string, Promise<ResolvedIdentity>>;
}): Promise<LeaderboardEntry> {
  const identity = await resolveIdentity({
    address: row.address,
    chainId,
    username: row.username,
    cache,
  });

  return {
    rank,
    address: row.address,
    username: row.username,
    displayName: identity.displayName,
    identitySource: identity.identitySource,
    score: row.score,
    achievedAt: row.achievedAt,
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

  const sorted: RankedScore[] = [...byPlayer.entries()]
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

  const identityCache = new Map<string, Promise<ResolvedIdentity>>();
  const top = await Promise.all(
    sorted
      .slice(0, 20)
      .map((entry, index) =>
        toLeaderboardEntry({ row: entry, rank: index + 1, chainId, cache: identityCache }),
      ),
  );

  const personalIndex = normalizedAddress
    ? sorted.findIndex((entry) => entry.address.toLowerCase() === normalizedAddress)
    : -1;
  const personalBest =
    personalIndex >= 0
      ? await toLeaderboardEntry({
          row: sorted[personalIndex],
          rank: personalIndex + 1,
          chainId,
          cache: identityCache,
        })
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
