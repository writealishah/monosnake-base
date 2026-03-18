import { baseAppConfig } from "@/config/baseApp";

export default function Head() {
  const baseAppId =
    (baseAppConfig as { baseAppId?: string }).baseAppId ?? "69ba1e3d5b0dee671be77e7b";
  const appUrl = baseAppConfig.websiteUrl.replace(/\/+$/, "");
  const miniappPayload = JSON.stringify({
    version: "1",
    imageUrl: `${appUrl}${baseAppConfig.ogImagePath}`,
    button: {
      title: "Play MonoSnake",
      action: {
        type: "launch_miniapp",
        name: baseAppConfig.appName,
        url: appUrl,
        splashImageUrl: `${appUrl}${baseAppConfig.iconPath}`,
        splashBackgroundColor: "#8faa17",
      },
    },
  });

  return (
    <>
      <meta name="base:app_id" content={baseAppId} />
      <meta name="fc:miniapp" content={miniappPayload} />
      <meta name="fc:frame" content={miniappPayload} />
    </>
  );
}
