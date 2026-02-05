'use client';

type Props = {
  score: number;
  userVote?: number;
  onUpvote?: () => void;
  onDownvote?: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function VoteControls({
  score,
  userVote = 0,
  onUpvote,
  onDownvote,
  disabled,
  compact,
}: Props) {
  const canUpvote = Boolean(onUpvote) && !disabled;
  const canDownvote = Boolean(onDownvote) && !disabled;
  const sizeClass = compact ? 'h-7 w-7 text-sm' : 'h-8 w-8 text-base';
  const gapClass = compact ? 'gap-1' : 'gap-1.5';
  const scoreClass = compact ? 'text-xs' : 'text-sm';

  const buttonClass = (active: boolean, canVote: boolean) => {
    if (!canVote) return `inline-flex ${sizeClass} items-center justify-center rounded-md bg-slate-50 text-slate-400 cursor-default`;
    if (active) return `inline-flex ${sizeClass} items-center justify-center rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300`;
    return `inline-flex ${sizeClass} items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800`;
  };

  return (
    <div className={`flex flex-col items-center ${gapClass}`}>
      <button
        type="button"
        onClick={onUpvote}
        disabled={!canUpvote}
        aria-label="Upvote"
        className={buttonClass(userVote === 1, canUpvote)}
      >
        ↑
      </button>
      <span className={`${scoreClass} font-medium text-slate-700`}>{score}</span>
      <button
        type="button"
        onClick={onDownvote}
        disabled={!canDownvote}
        aria-label="Downvote"
        className={buttonClass(userVote === -1, canDownvote)}
      >
        ↓
      </button>
    </div>
  );
}
