import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { base, baseSepolia } from "wagmi/chains";
import { appNetworkConfig, enabledChains } from "@/config/networks";
import { baseAppConfig } from "@/config/baseApp";
import { Attribution } from "ox/erc8021";

const baseSepoliaRpcUrl =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0];
const baseMainnetRpcUrl =
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ?? base.rpcUrls.default.http[0];
const configuredBuilderCode =
  process.env.NEXT_PUBLIC_BASE_BUILDER_CODE?.trim() ?? baseAppConfig.builderCode.trim();
const isBuilderCodeConfigured =
  configuredBuilderCode.length > 3 && configuredBuilderCode !== "TODO_ADD_BASE_BUILDER_CODE";
const dataSuffix = isBuilderCodeConfigured
  ? Attribution.toDataSuffix({ codes: [configuredBuilderCode] })
  : undefined;
const wagmiStorage = createStorage({
  storage: cookieStorage,
});

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: [
    baseAccount({
      appName: baseAppConfig.appName,
    }),
    injected(),
  ],
  storage: wagmiStorage,
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
    [base.id]: http(baseMainnetRpcUrl),
  },
  multiInjectedProviderDiscovery: true,
  ssr: true,
  ...(dataSuffix ? { dataSuffix } : {}),
});

export const defaultChainId = appNetworkConfig.defaultChainId;
