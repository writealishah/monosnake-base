export const baseAppConfig = {
  appName: "MonoSnake Base",
  baseAppId: "69ba1e3d5b0dee671be77e7b",
  subtitle: "Retro Snake on Base",
  tagline: "Score. Grow. Climb.",
  appDescription:
    "Retro monochrome Snake with instant guest play and optional onchain best-score tracking on Base.",
  iconPath: "/assets/icon-1024.png",
  screenshots: [
    "/assets/screenshots/home-upload.png",
    "/assets/screenshots/gameplay-upload.png",
    "/assets/screenshots/leaderboard-upload.png",
  ],
  heroImagePath: "/assets/screenshots/gameplay-upload.png",
  ogTitle: "MonoSnake Base",
  ogDescription: "Retro handheld Snake with onchain best scores on Base.",
  ogImagePath: "/assets/screenshots/gameplay-upload.png",
  primaryCategory: "games",
  tags: ["retro", "snake", "arcade", "base"],
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://monosnake.vercel.app",
  social: {
    x: "https://x.com/0xAlishah",
    farcaster: "",
    github: "https://github.com/writealishah/monosnake-base",
  },
  builderCode: "bc_i0hk66fs",
};
