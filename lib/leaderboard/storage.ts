import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProfileRecord } from "@/lib/leaderboard/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILES_PATH = path.join(DATA_DIR, "profiles.json");
const SCORE_CLAIMS_PATH = path.join(DATA_DIR, "score-claims.json");

type ProfilesFile = Record<string, ProfileRecord>;

export type ScoreClaimRecord = {
  score: number;
  nonce: number;
  sessionId: string;
  createdAt: number;
};

type ScoreClaimsFile = Record<string, ScoreClaimRecord>;

async function ensureDataPath(filePath: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "{}\n", "utf8");
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  await ensureDataPath(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  await ensureDataPath(filePath);
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readProfiles(): Promise<ProfilesFile> {
  return readJsonFile<ProfilesFile>(PROFILES_PATH);
}

export async function writeProfiles(nextProfiles: ProfilesFile): Promise<void> {
  await writeJsonFile(PROFILES_PATH, nextProfiles);
}

export async function readScoreClaims(): Promise<ScoreClaimsFile> {
  return readJsonFile<ScoreClaimsFile>(SCORE_CLAIMS_PATH);
}

export async function writeScoreClaims(nextClaims: ScoreClaimsFile): Promise<void> {
  await writeJsonFile(SCORE_CLAIMS_PATH, nextClaims);
}

