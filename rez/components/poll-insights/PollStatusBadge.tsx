import { getInsightsCollectionStatus } from '@/lib/poll-publication-state';

type PollStatusBadgeProps = {
  isActive: boolean;
  deadline?: string | null;
  reviewStatus?: string | null;
  className?: string;
};

export function PollStatusBadge({
  isActive,
  deadline = null,
  reviewStatus = null,
  className = '',
}: PollStatusBadgeProps) {
  if (reviewStatus === 'archived') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}
        aria-label="Poll has ended"
      >
        <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/60" />
        <span className="text-sm font-medium text-muted-foreground">Ended</span>
      </span>
    );
  }

  const status = getInsightsCollectionStatus(isActive, deadline);

  if (!status) return null;

  if (status === 'ended') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}
        aria-label="Poll has ended"
      >
        <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/60" />
        <span className="text-sm font-medium text-muted-foreground">Ended</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}
      aria-label="Poll is live"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-sm font-medium text-emerald-600">Live</span>
    </span>
  );
}
