type NetworkSwitchModalProps = {
  isOpen: boolean;
  currentChainName?: string;
  targetChainName: string;
  isSwitching: boolean;
  onSwitch: () => void;
  onDismiss: () => void;
};

export function NetworkSwitchModal({
  isOpen,
  currentChainName,
  targetChainName,
  isSwitching,
  onSwitch,
  onDismiss,
}: NetworkSwitchModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#151d08]/44 px-4">
      <div className="w-full max-w-md rounded-md border-[3px] border-[#2b3b10] bg-[#e7e4d2] p-4 shadow-[0_9px_0_#6f7f41,0_18px_28px_rgba(40,52,12,0.26)] sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#3f4e1d]">Network Required</p>
        <h2 className="mt-1 text-lg text-[#1e2b0b]">Switch Wallet Network</h2>
        <p className="mt-2 font-['VT323'] text-2xl leading-tight text-[#2e3d13]">
          Connected: {currentChainName ?? "Unknown"}
        </p>
        <p className="font-['VT323'] text-2xl leading-tight text-[#2e3d13]">Needed: {targetChainName}</p>
        <p className="mt-2 text-xs text-[#455427]">
          To submit scores onchain, switch your wallet to {targetChainName}.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSwitch}
            disabled={isSwitching}
            className="rounded-sm border-2 border-[#27330e] bg-[#9cbc1e] px-3 py-2 text-[11px] text-[#1d250b] shadow-[3px_3px_0_#40531a] disabled:opacity-60"
          >
            {isSwitching ? "SWITCHING..." : `SWITCH TO ${targetChainName.toUpperCase()}`}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-sm border-2 border-[#38431a] bg-[#d8d5c2] px-3 py-2 text-[11px] text-[#1f240c] shadow-[3px_3px_0_#505b2a]"
          >
            NOT NOW
          </button>
        </div>
      </div>
    </div>
  );
}
