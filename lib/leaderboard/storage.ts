import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProfileRecord } from "@/lib/leaderboard/types";

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "monosnake-data") : path.join(process.cwd(), "data");
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

let useMemoryFallback = false;
let inMemoryProfiles: ProfilesFile = {};
let inMemoryClaims: ScoreClaimsFile = {};

async function ensureDataPath(filePath: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "{}\n", "utf8");
  }
}

async function readJsonFromDisk<T>(filePath: string): Promise<T> {
  await ensureDataPath(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonToDisk<T>(filePath: string, value: T): Promise<void> {
  await ensureDataPath(filePath);
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function markStorageFallback(error: unknown): void {
  useMemoryFallback = true;
  console.error("[storage] Falling back to in-memory mode:", error);
}

export async function readProfiles(): Promise<ProfilesFile> {
  if (useMemoryFallback) {
    return { ...inMemoryProfiles };
  }

  try {
    const diskProfiles = await readJsonFromDisk<ProfilesFile>(PROFILES_PATH);
    inMemoryProfiles = diskProfiles;
    return { ...diskProfiles };
  } catch (error) {
    markStorageFallback(error);
    return { ...inMemoryProfiles };
  }
}

export async function writeProfiles(nextProfiles: ProfilesFile): Promise<void> {
  inMemoryProfiles = { ...nextProfiles };
  if (useMemoryFallback) {
    return;
  }

  try {
    await writeJsonToDisk(PROFILES_PATH, inMemoryProfiles);
  } catch (error) {
    markStorageFallback(error);
  }
}

export async function readScoreClaims(): Promise<ScoreClaimsFile> {
  if (useMemoryFallback) {
    return { ...inMemoryClaims };
  }

  try {
    const diskClaims = await readJsonFromDisk<ScoreClaimsFile>(SCORE_CLAIMS_PATH);
    inMemoryClaims = diskClaims;
    return { ...diskClaims };
  } catch (error) {
    markStorageFallback(error);
    return { ...inMemoryClaims };
  }
}

export async function writeScoreClaims(nextClaims: ScoreClaimsFile): Promise<void> {
  inMemoryClaims = { ...nextClaims };
  if (useMemoryFallback) {
    return;
  }

  try {
    await writeJsonToDisk(SCORE_CLAIMS_PATH, inMemoryClaims);
  } catch (error) {
    markStorageFallback(error);
  }
}
