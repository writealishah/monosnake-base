import { baseAppConfig } from "@/config/baseApp";

export default function Head() {
  const baseAppId =
    (baseAppConfig as { baseAppId?: string }).baseAppId ?? "69ba1e3d5b0dee671be77e7b";
  return <meta name="base:app_id" content={baseAppId} />;
}
