import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { base, baseSepolia } from "wagmi/chains";
import { appNetworkConfig, enabledChains } from "@/config/networks";

const baseSepoliaRpcUrl =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0];
const baseMainnetRpcUrl =
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ?? base.rpcUrls.default.http[0];

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
    [base.id]: http(baseMainnetRpcUrl),
  },
  multiInjectedProviderDiscovery: true,
  ssr: true,
});

export const defaultChainId = appNetworkConfig.defaultChainId;
