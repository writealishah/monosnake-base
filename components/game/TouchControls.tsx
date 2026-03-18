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
      className="h-14 w-14 rounded-md border-2 border-[#38431a] bg-[#dbd8c4] text-sm text-[#1f240c] shadow-[2px_2px_0_#505b2a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`Move ${label}`}
    >
      {label}
    </button>
  );
}

export function TouchControls({ disabled, onDirection }: TouchControlsProps) {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[240px] flex-col items-center gap-2 md:hidden">
      <PadButton label="U" disabled={disabled} onPress={() => onDirection("up")} />
      <div className="flex w-full items-center justify-between">
        <PadButton label="L" disabled={disabled} onPress={() => onDirection("left")} />
        <PadButton label="R" disabled={disabled} onPress={() => onDirection("right")} />
      </div>
      <PadButton label="D" disabled={disabled} onPress={() => onDirection("down")} />
    </div>
  );
}

