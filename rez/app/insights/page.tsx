"use client";

import Link from "next/link";
import { ChartBarIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { PollStatusBadge } from "@/components/poll-insights/PollStatusBadge";
import { usePollInsightsQuery } from "@/hooks/use-poll-insights-query";
import type { PublishedPollSummary } from "@/services/fetchPollInsightsData";

export default function InsightsPage() {
  const { data: polls, error, refreshError, isLoading, isRefreshing, refresh } =
    usePollInsightsQuery<PublishedPollSummary[]>("/api/pollInsights", {
      select: (body) => (body as { polls: PublishedPollSummary[] }).polls,
    });

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-[#5C29A3]" />
            <p className="text-sm uppercase tracking-wide text-[#5C29A3] font-medium">
              Canvassing Insights
            </p>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Poll insights
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Live poll results and demographic breakdowns from published polls answered by
            verified Pax participants. Available to all Rez task masters.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading || isRefreshing}
          className="self-start sm:self-auto"
        >
          <ArrowPathIcon
            className={`w-4 h-4 mr-2 ${isLoading || isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {refreshError && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2 mb-4">
          Couldn&apos;t refresh — showing last updated data.
        </p>
      )}

      {isLoading && !polls && (
        <p className="text-sm text-muted-foreground">Loading poll insights...</p>
      )}

      {!polls && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && polls && polls.length === 0 && (
        <div className="enterprise-card rounded-lg border border-border/50 bg-card p-8">
          <p className="text-muted-foreground">
            No published polls yet. Check back soon for live results.
          </p>
        </div>
      )}

      {polls && polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <Link
              key={poll.taskId}
              href={`/insights/${poll.taskId}`}
              className="block enterprise-card rounded-lg border border-border/50 bg-card p-6 hover:border-[#5C29A3]/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground min-w-0">{poll.taskTitle}</h2>
                <PollStatusBadge isActive={poll.isActive} deadline={poll.deadline} />
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {poll.questionCount > 1
                  ? `${poll.questionCount} questions · ${poll.questionText}`
                  : poll.questionText}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                <span className="font-medium text-foreground">{poll.responseCount}</span> responses
                {poll.targetParticipants ? ` of ${poll.targetParticipants} target` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
