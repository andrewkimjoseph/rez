"use client";

import { ChartBarIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  PollInsightSummaryCard,
  PollInsightSummaryCardSkeleton,
} from "@/components/poll-insights/PollInsightSummaryCard";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PollInsightSummaryCardSkeleton />
          <PollInsightSummaryCardSkeleton />
          <PollInsightSummaryCardSkeleton />
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {polls.map((poll) => (
            <PollInsightSummaryCard key={poll.taskId} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}
