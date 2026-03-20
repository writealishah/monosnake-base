import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { baseAppConfig } from "@/config/baseApp";

const pixelTitle = Press_Start_2P({
  variable: "--font-pixel-title",
  weight: "400",
  subsets: ["latin"],
});

const pixelDisplay = VT323({
  variable: "--font-pixel-display",
  weight: "400",
  subsets: ["latin"],
});

const BASE_APP_ID = baseAppConfig.baseAppId?.trim() ?? "";
const APP_URL = baseAppConfig.websiteUrl;
const OG_IMAGE_PATH = baseAppConfig.coverImagePath ?? baseAppConfig.ogImagePath;
const METADATA_BASE_URL = (() => {
  try {
    return new URL(APP_URL);
  } catch {
    return new URL("https://monosnake.vercel.app");
  }
})();

export const metadata: Metadata = {
  metadataBase: METADATA_BASE_URL,
  title: baseAppConfig.appName,
  description: baseAppConfig.appDescription,
  applicationName: baseAppConfig.appName,
  keywords: baseAppConfig.tags,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: baseAppConfig.ogTitle,
    description: baseAppConfig.ogDescription,
    type: "website",
    url: APP_URL,
    siteName: baseAppConfig.appName,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "MonoSnake Base gameplay preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: baseAppConfig.ogTitle,
    description: baseAppConfig.ogDescription,
    images: [OG_IMAGE_PATH],
  },
  other: BASE_APP_ID
    ? {
        "base:app_id": BASE_APP_ID,
      }
    : undefined,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelTitle.variable} ${pixelDisplay.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
