"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ageBucket,
  aggregateCounts,
  aggregatePollResults,
  allInsightRows,
  capCountryBuckets,
  completedParticipantCount,
  orderAgeBuckets,
  toCsv,
  type PollInsightsData,
} from "@/lib/poll-insights";
import {
  AgeOrderedChart,
  CountryHorizontalChart,
  GenderDonutChart,
  PollResultsChart,
} from "@/components/poll-insights/PollCharts";
import { PollStatusBadge } from "@/components/poll-insights/PollStatusBadge";

type PollInsightsPanelProps = {
  taskId: string;
};

export default function PollInsightsPanel({ taskId }: PollInsightsPanelProps) {
  const [data, setData] = useState<PollInsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const publicInsightsUrl = `https://thecanvassing.xyz/insights/${taskId}`;

  const loadInsights = async () => {
    try {
      const response = await fetch(`/api/pollInsights/${taskId}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load poll insights");
      }
      const payload = (await response.json()) as PollInsightsData;
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load poll insights");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 30_000);
    return () => clearInterval(interval);
  }, [taskId]);

  const demographicRows = useMemo(() => (data ? allInsightRows(data) : []), [data]);
  const completedCount = useMemo(
    () => (data ? completedParticipantCount(data) : 0),
    [data],
  );

  const genderData = useMemo(
    () => aggregateCounts(demographicRows, (row) => row.gender ?? "Unknown"),
    [demographicRows],
  );
  const countryData = useMemo(
    () =>
      capCountryBuckets(
        aggregateCounts(demographicRows, (row) => row.country ?? "Unknown"),
      ),
    [demographicRows],
  );
  const ageData = useMemo(
    () =>
      orderAgeBuckets(
        aggregateCounts(demographicRows, (row) => ageBucket(row.age)),
      ),
    [demographicRows],
  );

  const handleExport = () => {
    if (!data) return;
    const csv = toCsv(data, genderData, countryData, ageData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `poll-insights-${taskId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading poll insights...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!data) {
    return null;
  }

  const completionRate =
    data.targetParticipants && data.targetParticipants > 0
      ? Math.round((completedCount / data.targetParticipants) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">{data.taskTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {data.questions.length} question{data.questions.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium">{completedCount}</span> completed responses
            {data.targetParticipants ? ` of ${data.targetParticipants} target` : ""}
            {completionRate != null ? ` (${completionRate}% complete)` : ""}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
          <PollStatusBadge isActive={data.isActive} deadline={data.deadline} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={publicInsightsUrl} target="_blank" rel="noopener noreferrer">
                Share public summary
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The public link shows poll results only. Demographics and export are available here in Rez.
      </p>

      {data.questions.map((question, index) => {
        const pollResults = aggregatePollResults(question.rows, question.options);
        return (
          <section
            key={question.questionId}
            className="enterprise-card rounded-lg border border-border/50 bg-card p-5"
          >
            <h3 className="text-lg font-semibold mb-1">
              Question {index + 1}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{question.questionText}</p>
            <PollResultsChart data={pollResults} />
          </section>
        );
      })}

      {completedCount > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Demographic breakdown</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="enterprise-card rounded-lg border border-border/50 bg-card p-5">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Gender</h4>
              <GenderDonutChart data={genderData} />
            </div>
            <div className="enterprise-card rounded-lg border border-border/50 bg-card p-5">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Country</h4>
              <CountryHorizontalChart data={countryData} />
            </div>
            <div className="enterprise-card rounded-lg border border-border/50 bg-card p-5 md:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Age</h4>
              <AgeOrderedChart data={ageData} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
