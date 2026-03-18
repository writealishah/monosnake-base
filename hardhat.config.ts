import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const accounts = deployerPrivateKey ? [deployerPrivateKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    baseSepolia: {
      chainId: 84532,
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "",
      accounts,
    },
    baseMainnet: {
      chainId: 8453,
      url: process.env.BASE_MAINNET_RPC_URL ?? "",
      accounts,
    },
  },
};

export default config;
