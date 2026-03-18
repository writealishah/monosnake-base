import hre from "hardhat";
import { promises as fs } from "node:fs";
import path from "node:path";

async function main() {
  const { ethers, network } = hre;
  const contractFactory = await ethers.getContractFactory("SnakeScore");
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const chainId = network.config.chainId ?? 0;

  const outputPath = path.join(process.cwd(), "config", "contract-addresses.json");
  let currentJson: Record<string, string> = {};

  try {
    const raw = await fs.readFile(outputPath, "utf8");
    currentJson = JSON.parse(raw) as Record<string, string>;
  } catch {
    currentJson = {};
  }

  currentJson[String(chainId)] = address;
  await fs.writeFile(outputPath, `${JSON.stringify(currentJson, null, 2)}\n`, "utf8");

  console.log("SnakeScore deployed");
  console.log(`Network: ${network.name} (chainId ${chainId})`);
  console.log(`Address: ${address}`);
  console.log(`Saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
