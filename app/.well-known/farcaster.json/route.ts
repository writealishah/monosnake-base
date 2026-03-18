import { NextRequest, NextResponse } from "next/server";
import { baseAppConfig } from "@/config/baseApp";

function resolveOrigin(request: NextRequest): string {
  const configured = baseAppConfig.websiteUrl;
  if (configured && configured.startsWith("http")) {
    return configured.replace(/\/+$/, "");
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return "https://monosnake.vercel.app";
}

export async function GET(request: NextRequest) {
  const origin = resolveOrigin(request);
  const canonicalDomain = origin.replace(/^https?:\/\//, "");

  const accountAssociationHeader = process.env.BASE_ACCOUNT_ASSOCIATION_HEADER ?? "";
  const accountAssociationPayload = process.env.BASE_ACCOUNT_ASSOCIATION_PAYLOAD ?? "";
  const accountAssociationSignature = process.env.BASE_ACCOUNT_ASSOCIATION_SIGNATURE ?? "";
  const hasAssociation =
    Boolean(accountAssociationHeader) &&
    Boolean(accountAssociationPayload) &&
    Boolean(accountAssociationSignature);

  const manifest: Record<string, unknown> = {
    miniapp: {
      version: "1",
      name: baseAppConfig.appName,
      subtitle: "Retro handheld Snake on Base",
      description: baseAppConfig.appDescription,
      iconUrl: `${origin}/favicon.svg`,
      homeUrl: origin,
      screenshotUrls: [
        `${origin}/assets/screenshots/home-placeholder.svg`,
        `${origin}/assets/screenshots/gameplay-placeholder.svg`,
        `${origin}/assets/screenshots/leaderboard-placeholder.svg`,
      ],
      splashImageUrl: `${origin}/favicon.svg`,
      splashBackgroundColor: "#8faa17",
      primaryCategory: "games",
      tags: ["retro", "snake", "base"],
      canonicalDomain,
    },
  };

  if (hasAssociation) {
    manifest.accountAssociation = {
      header: accountAssociationHeader,
      payload: accountAssociationPayload,
      signature: accountAssociationSignature,
    };
  }

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
