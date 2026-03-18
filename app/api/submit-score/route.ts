import { NextRequest, NextResponse } from "next/server";
import { isAddress, recoverMessageAddress } from "viem";
import { createScoreClaimMessage } from "@/lib/leaderboard/messages";
import { readScoreClaims, writeScoreClaims } from "@/lib/leaderboard/storage";

// This route only verifies wallet ownership for score claims.
// The authoritative global leaderboard is still derived from onchain ScoreUpdated events.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = String(body.address ?? "");
    const score = Number(body.score ?? 0);
    const nonce = Number(body.nonce ?? 0);
    const sessionId = String(body.sessionId ?? "");
    const signature = String(body.signature ?? "");

    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    if (!Number.isInteger(score) || score < 0) {
      return NextResponse.json({ error: "Invalid score." }, { status: 400 });
    }
    if (!sessionId || !signature || !Number.isFinite(nonce)) {
      return NextResponse.json({ error: "Missing signature payload." }, { status: 400 });
    }

    const message = createScoreClaimMessage(address, score, nonce, sessionId);
    const recovered = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
    }

    const key = address.toLowerCase();
    const claims = await readScoreClaims();
    const currentBest = claims[key]?.score ?? 0;

    if (score > currentBest) {
      claims[key] = {
        score,
        nonce,
        sessionId,
        createdAt: Date.now(),
      };
      await writeScoreClaims(claims);
    }

    return NextResponse.json({
      ok: true,
      accepted: score > currentBest,
      currentBestClaim: Math.max(score, currentBest),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Score claim service failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
