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

export const metadata: Metadata = {
  title: baseAppConfig.appName,
  description: baseAppConfig.appDescription,
  other: {
    "base:app_id": baseAppConfig.baseAppId,
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
        <meta name="base:app_id" content={baseAppConfig.baseAppId} />
      </head>
      <body className={`${pixelTitle.variable} ${pixelDisplay.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
