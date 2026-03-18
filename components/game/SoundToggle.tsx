type SoundToggleProps = {
  isMuted: boolean;
  onToggle: () => void;
  className?: string;
};

export function SoundToggle({ isMuted, onToggle, className }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        className ??
        "rounded-sm border border-[#5f7b17] bg-[#95b41b]/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#1e3006]"
      }
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? "SND OFF" : "SND ON"}
    </button>
  );
}
