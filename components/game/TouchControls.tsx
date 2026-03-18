import type { Direction } from "@/game/types";

type TouchControlsProps = {
  disabled?: boolean;
  onDirection: (direction: Direction) => void;
};

function PadButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="h-12 w-12 touch-manipulation rounded-md border-2 border-[#38431a] bg-[#dbd8c4] text-sm text-[#1f240c] shadow-[2px_2px_0_#505b2a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
      aria-label={`Move ${label}`}
    >
      {label}
    </button>
  );
}

export function TouchControls({ disabled, onDirection }: TouchControlsProps) {
  return (
    <div className="mx-auto mt-2 flex w-full max-w-[220px] touch-none flex-col items-center gap-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] md:hidden">
      <PadButton label="U" disabled={disabled} onPress={() => onDirection("up")} />
      <div className="flex w-full items-center justify-between">
        <PadButton label="L" disabled={disabled} onPress={() => onDirection("left")} />
        <PadButton label="R" disabled={disabled} onPress={() => onDirection("right")} />
      </div>
      <PadButton label="D" disabled={disabled} onPress={() => onDirection("down")} />
    </div>
  );
}
