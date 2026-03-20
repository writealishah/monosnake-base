import { shortenAddress } from "@/lib/utils";

const identitySourceLabel: Record<"basename" | "ens" | "custom" | "address", string> = {
  basename: "Basename",
  ens: "ENS",
  custom: "Custom",
  address: "Address",
};

type WalletPanelProps = {
  isConnected: boolean;
  address?: string;
  displayName?: string | null;
  identitySource?: "basename" | "ens" | "custom" | "address" | null;
  avatarUrl?: string | null;
  chainName?: string;
  targetChainName: string;
  networkStatusText: string;
  networkWarning?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork?: () => void;
  isSwitchingNetwork: boolean;
  usernameInput: string;
  onUsernameInput: (value: string) => void;
  onSaveUsername: () => void;
  isSavingUsername: boolean;
  onchainBest: number | null;
};

export function WalletPanel({
  isConnected,
  address,
  displayName,
  identitySource,
  avatarUrl,
  chainName,
  targetChainName,
  networkStatusText,
  networkWarning,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  isSwitchingNetwork,
  usernameInput,
  onUsernameInput,
  onSaveUsername,
  isSavingUsername,
  onchainBest,
}: WalletPanelProps) {
  const normalizedUsername = usernameInput.trim();
  const hasUsername = normalizedUsername.length > 0;
  const normalizedDisplayName = displayName?.trim() ?? "";
  const hasResolvedDisplay = normalizedDisplayName.length > 0;
  const fallbackAddressLabel = shortenAddress(address);
  const profileName = isConnected
    ? hasResolvedDisplay
      ? identitySource === "custom" && !normalizedDisplayName.startsWith("@")
        ? `@${normalizedDisplayName}`
        : normalizedDisplayName
      : hasUsername
        ? `@${normalizedUsername}`
        : fallbackAddressLabel
    : "Guest mode active";
  const profileTitle = isConnected
    ? profileName
    : "Guest mode active";
  const avatarLetter = profileName.replace(/^@/, "").charAt(0).toUpperCase() || "?";
  const activeIdentitySource =
    isConnected && identitySource ? identitySourceLabel[identitySource] : "Guest";

  return (
    <div className="rounded-md border-2 border-[#435220] bg-[#ece9d8] p-2.5 shadow-[0_4px_0_#a8a483]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#334215]">Profile</p>
        {isConnected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="min-h-11 rounded-sm border border-[#556732] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[1px_1px_0_#7f8f5a]"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="min-h-11 rounded-sm border border-[#3f4b1f] bg-[#9cbc1e] px-3 py-2 text-[11px] text-[#1d250b] shadow-[1px_1px_0_#5f7620]"
          >
            Connect
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-sm border border-[#556732] bg-[#d8d5c2] font-['VT323'] text-2xl text-[#2f3f14]">
          {avatarUrl ? (
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${avatarUrl})`,
              }}
              aria-hidden="true"
            />
          ) : null}
          {!avatarUrl ? <span>{avatarLetter}</span> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-['VT323'] text-2xl leading-none text-[#27330e]">{profileTitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#5a6736]">Wallet {fallbackAddressLabel}</p>
            <span className="rounded-sm border border-[#6f7a45] bg-[#d8d5c2] px-1 py-0.5 text-[9px] uppercase tracking-[0.08em] text-[#4f5d2c]">
              {activeIdentitySource}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#4d5c2a]">{networkStatusText}</p>

      {isConnected ? (
        <>
          <p className="font-['VT323'] text-xl text-[#3f4b1f]">Network: {chainName ?? "Unknown"}</p>
          {networkWarning ? (
            <div className="mt-2 space-y-1 rounded-sm border border-[#7a1d1d] bg-[#f3d8d8] p-2 text-xs text-[#631313]">
              <p>{networkWarning}</p>
              {onSwitchNetwork ? (
                <button
                  type="button"
                  onClick={onSwitchNetwork}
                  disabled={isSwitchingNetwork}
                  className="min-h-11 rounded-sm border border-[#7a1d1d] bg-white px-3 py-2 text-[11px] disabled:opacity-70"
                >
                  {isSwitchingNetwork ? "Switching..." : `Switch to ${targetChainName}`}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2.5 space-y-1.5">
            <label htmlFor="username" className="block text-[10px] uppercase tracking-[0.13em] text-[#4c5a27]">
              Username
            </label>
            <div className="flex gap-2">
              <input
                id="username"
                value={usernameInput}
                onChange={(event) => onUsernameInput(event.target.value)}
                placeholder="retro_snake"
                className="min-h-11 w-full rounded-sm border border-[#4f5d2a] bg-[#f7f5eb] px-2 py-1.5 font-['VT323'] text-xl leading-none text-[#1f240c] outline-none focus:ring-2 focus:ring-[#95b615]"
              />
              <button
                type="button"
                onClick={onSaveUsername}
                disabled={isSavingUsername}
                className="min-h-11 rounded-sm border border-[#4f5d2a] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[1px_1px_0_#7f8f5a] disabled:opacity-60"
              >
                {isSavingUsername ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <p className="mt-2 font-['VT323'] text-xl leading-none text-[#314113]">
            Onchain best: {onchainBest === null ? "--" : onchainBest}
          </p>
        </>
      ) : (
        <p className="mt-1 font-['VT323'] text-xl text-[#3f4b1f]">
          Connect to save a username and submit your best run.
        </p>
      )}
    </div>
  );
}
