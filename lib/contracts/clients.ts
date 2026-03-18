import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { appNetworkConfig, scoreContractAddresses } from "@/config/networks";

export function resolveChain(chainId?: number) {
  if (chainId === base.id) {
    return base;
  }
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }
  return appNetworkConfig.targetChainId === base.id ? base : baseSepolia;
}

export function resolveRpcUrl(chainId: number): string {
  if (chainId === base.id) {
    return process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ?? base.rpcUrls.default.http[0];
  }
  if (chainId === baseSepolia.id) {
    return process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0];
  }
  return appNetworkConfig.targetChainId === base.id
    ? process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ?? base.rpcUrls.default.http[0]
    : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0];
}

export function resolveContractAddress(chainId: number): `0x${string}` | undefined {
  return scoreContractAddresses[chainId];
}

export function createScorePublicClient(chainId: number) {
  const chain = resolveChain(chainId);
  const rpcUrl = resolveRpcUrl(chainId);
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}
