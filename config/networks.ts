import { base, baseSepolia } from "wagmi/chains";

export type AppNetworkMode = "mainnet" | "sepolia";

function resolveMode(): AppNetworkMode {
  const raw = process.env.NEXT_PUBLIC_APP_NETWORK_MODE?.toLowerCase();
  if (raw === "mainnet" || raw === "sepolia") {
    return raw;
  }

  return process.env.NODE_ENV === "production" ? "mainnet" : "sepolia";
}

export const appNetworkMode = resolveMode();
export const targetChain = appNetworkMode === "mainnet" ? base : baseSepolia;
export const secondaryChain = appNetworkMode === "mainnet" ? baseSepolia : base;

export const enabledChains = [targetChain, secondaryChain] as const;

export const appNetworkConfig = {
  mode: appNetworkMode,
  defaultChainId: targetChain.id,
  targetChainId: targetChain.id,
  targetChainName: targetChain.name,
  supportedChainIds: enabledChains.map((chain) => chain.id),
  namesById: Object.fromEntries(enabledChains.map((chain) => [chain.id, chain.name])),
} as const;

export const scoreContractAddresses: Record<number, `0x${string}` | undefined> = {
  [baseSepolia.id]:
    process.env.NEXT_PUBLIC_SCORE_CONTRACT_ADDRESS_BASE_SEPOLIA as `0x${string}` | undefined,
  [base.id]:
    process.env.NEXT_PUBLIC_SCORE_CONTRACT_ADDRESS_BASE_MAINNET as `0x${string}` | undefined,
};
