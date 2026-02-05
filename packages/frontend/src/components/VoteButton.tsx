'use client';

type Props = {
  count: number;
  voted?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function VoteButton({ count, voted, onClick, disabled, compact }: Props) {
  const canVote = !disabled && onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1 font-medium transition-colors
        ${compact ? 'px-2 py-1 text-sm' : 'px-3 py-1.5'}
        rounded-md
        ${canVote
          ? voted
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
          : 'bg-gray-50 text-gray-400 cursor-default'
        }
      `}
    >
      <span className="text-lg leading-none">↑</span>
      <span>{count}</span>
    </button>
  );
}
