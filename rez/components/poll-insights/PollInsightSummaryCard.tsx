import Link from "next/link";
import { ArrowRightIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { PollStatusBadge } from "@/components/poll-insights/PollStatusBadge";
import type { PublishedPollSummary } from "@/services/fetchPollInsightsData";

type PollInsightSummaryCardProps = {
  poll: PublishedPollSummary;
};

export function PollInsightSummaryCard({ poll }: PollInsightSummaryCardProps) {
  const completionPct =
    poll.targetParticipants && poll.targetParticipants > 0
      ? Math.min(100, Math.round((poll.responseCount / poll.targetParticipants) * 100))
      : null;

  const progressWidth =
    completionPct != null
      ? completionPct
      : poll.responseCount > 0
        ? 100
        : 0;

  return (
    <Link
      href={`/insights/${poll.taskId}`}
      className="group flex flex-col h-full enterprise-card rounded-lg border border-border/50 bg-card p-5 transition-all duration-200 hover:border-[#5C29A3]/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-[#5C29A3]/10 shrink-0 group-hover:scale-105 transition-transform">
            <ChartBarIcon className="w-4 h-4 text-[#5C29A3]" />
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
            {poll.questionCount} question{poll.questionCount === 1 ? "" : "s"}
          </Badge>
        </div>
        <PollStatusBadge
          isActive={poll.isActive}
          deadline={poll.deadline}
          reviewStatus={poll.reviewStatus}
        />
      </div>

      <h2 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-[#5C29A3] transition-colors">
        {poll.taskTitle}
      </h2>

      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 flex-1">
        {poll.questionText}
      </p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {poll.responseCount.toLocaleString()}
            </span>
            {poll.targetParticipants ? (
              <>
                {" "}
                /{" "}
                <span className="tabular-nums">
                  {poll.targetParticipants.toLocaleString()}
                </span>{" "}
                responses
              </>
            ) : (
              " responses"
            )}
          </span>
          {completionPct != null && (
            <span className="shrink-0 tabular-nums text-xs font-medium text-[#5C29A3]">
              {completionPct}%
            </span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#5C29A3] transition-all duration-500 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-[#5C29A3] mt-3 font-medium flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        View results <ArrowRightIcon className="h-3 w-3" />
      </p>
    </Link>
  );
}

export function PollInsightSummaryCardSkeleton() {
  return (
    <div className="enterprise-card rounded-lg border border-border/50 bg-card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent animate-pulse" />
          <div className="h-5 w-20 rounded-md bg-accent animate-pulse" />
        </div>
        <div className="h-5 w-12 rounded-md bg-accent animate-pulse" />
      </div>
      <div className="h-5 w-3/4 rounded-md bg-accent animate-pulse" />
      <div className="h-4 w-full rounded-md bg-accent animate-pulse mt-2" />
      <div className="h-4 w-2/3 rounded-md bg-accent animate-pulse mt-1" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-1/2 rounded-md bg-accent animate-pulse" />
        <div className="h-2.5 w-full rounded-full bg-accent animate-pulse" />
      </div>
    </div>
  );
}
