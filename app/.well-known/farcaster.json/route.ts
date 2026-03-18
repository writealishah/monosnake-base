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
  const isProduction = process.env.NODE_ENV === "production";

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
      subtitle: baseAppConfig.subtitle,
      description: baseAppConfig.appDescription,
      tagline: baseAppConfig.tagline,
      iconUrl: `${origin}${baseAppConfig.iconPath}`,
      homeUrl: origin,
      screenshotUrls: baseAppConfig.screenshots.map((path) => `${origin}${path}`),
      splashImageUrl: `${origin}${baseAppConfig.iconPath}`,
      splashBackgroundColor: "#8faa17",
      primaryCategory: baseAppConfig.primaryCategory,
      tags: baseAppConfig.tags,
      heroImageUrl: `${origin}${baseAppConfig.heroImagePath}`,
      ogTitle: baseAppConfig.ogTitle,
      ogDescription: baseAppConfig.ogDescription,
      ogImageUrl: `${origin}${baseAppConfig.ogImagePath}`,
      noindex: !isProduction,
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
