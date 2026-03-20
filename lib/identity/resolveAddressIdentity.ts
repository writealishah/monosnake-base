import { createPublicClient, http, toCoinType } from "viem";
import { mainnet } from "viem/chains";
import type { LeaderboardIdentitySource } from "@/lib/leaderboard/types";

const ENS_LOOKUP_TIMEOUT_MS = 1_300;
const ensLookupClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_MAINNET_RPC_URL ?? mainnet.rpcUrls.default.http[0]),
});

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

async function lookupEnsAvatar(name: string): Promise<string | null> {
  return withTimeout(
    ensLookupClient.getEnsAvatar({
      name,
    }),
    ENS_LOOKUP_TIMEOUT_MS,
  );
}

function fromCustomUsername(username: string | null | undefined) {
  const normalized = username?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

type IdentityResult = {
  displayName: string;
  identitySource: LeaderboardIdentitySource;
  avatarUrl: string | null;
};

export async function resolveAddressIdentity({
  address,
  chainId,
  username,
}: {
  address: `0x${string}`;
  chainId: number;
  username?: string | null;
}): Promise<IdentityResult> {
  const basenameCoinType = resolveCoinType(chainId);
  const basenameName = await lookupEnsName(address, basenameCoinType);
  if (basenameName && basenameName.toLowerCase().endsWith(".base.eth")) {
    return {
      displayName: basenameName,
      identitySource: "basename",
      avatarUrl: await lookupEnsAvatar(basenameName),
    };
  }

  const ensName = basenameCoinType === 60n ? basenameName : await lookupEnsName(address, 60n);
  if (ensName) {
    return {
      displayName: ensName,
      identitySource: ensName.toLowerCase().endsWith(".base.eth") ? "basename" : "ens",
      avatarUrl: await lookupEnsAvatar(ensName),
    };
  }

  const customUsername = fromCustomUsername(username);
  if (customUsername) {
    return {
      displayName: customUsername,
      identitySource: "custom",
      avatarUrl: null,
    };
  }

  return {
    displayName: shortenAddress(address),
    identitySource: "address",
    avatarUrl: null,
  };
}
