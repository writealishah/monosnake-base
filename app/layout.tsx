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

const BASE_APP_ID =
  (baseAppConfig as { baseAppId?: string }).baseAppId ?? "69ba1e3d5b0dee671be77e7b";
const APP_URL = baseAppConfig.websiteUrl.replace(/\/+$/, "");
const fcMiniAppPayload = JSON.stringify({
  version: "1",
  imageUrl: `${APP_URL}${baseAppConfig.ogImagePath}`,
  button: {
    title: "Play MonoSnake",
    action: {
      type: "launch_miniapp",
      name: baseAppConfig.appName,
      url: APP_URL,
      splashImageUrl: `${APP_URL}${baseAppConfig.iconPath}`,
      splashBackgroundColor: "#8faa17",
    },
  },
});

export const metadata: Metadata = {
  title: baseAppConfig.appName,
  description: baseAppConfig.appDescription,
  other: {
    "base:app_id": BASE_APP_ID,
    "fc:miniapp": fcMiniAppPayload,
    "fc:frame": fcMiniAppPayload,
  },
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
      <head>
        <meta name="base:app_id" content={BASE_APP_ID} />
        <meta name="fc:miniapp" content={fcMiniAppPayload} />
        <meta name="fc:frame" content={fcMiniAppPayload} />
      </head>
      <body className={`${pixelTitle.variable} ${pixelDisplay.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
