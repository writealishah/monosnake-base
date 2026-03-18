import { NextRequest, NextResponse } from "next/server";
import { isAddress, recoverMessageAddress } from "viem";
import { createUsernameMessage } from "@/lib/leaderboard/messages";
import { readProfiles, writeProfiles } from "@/lib/leaderboard/storage";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{2,20}$/;

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return NextResponse.json({ username: null });
    }

    const profiles = await readProfiles();
    const profile = profiles[address.toLowerCase()];
    return NextResponse.json({
      username: profile?.username ?? null,
      updatedAt: profile?.updatedAt ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile lookup failed.";
    return NextResponse.json({ error: message, username: null }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = String(body.address ?? "");
    const username = String(body.username ?? "").trim();
    const signature = String(body.signature ?? "");
    const nonce = Number(body.nonce ?? 0);

    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { error: "Username must be 2-20 chars (letters, numbers, underscore)." },
        { status: 400 },
      );
    }
    if (!signature || !Number.isFinite(nonce)) {
      return NextResponse.json({ error: "Missing signature payload." }, { status: 400 });
    }

    const message = createUsernameMessage(address, username, nonce);
    const recovered = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
    }

    const profiles = await readProfiles();
    profiles[address.toLowerCase()] = {
      username,
      updatedAt: Date.now(),
    };
    await writeProfiles(profiles);

    return NextResponse.json({ ok: true, username });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
