"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchWithAuthRetry } from "@/lib/api-fetch";

export type CompletionAnswersContext = {
  id: string | null;
  participantId: string | null;
  participantEmailAddress?: string | null;
  timeCompleted?: unknown;
};

type PollCompletionAnswer = {
  questionId: string;
  questionText: string;
  optionText: string;
  sortOrder: number;
  answeredAt: string;
};

type PollCompletionAnswersResponse = {
  taskId: string;
  completionId: string | null;
  participantId: string;
  answers: PollCompletionAnswer[];
};

type CompletionAnswersPanelProps = {
  taskId: string;
  completion: CompletionAnswersContext | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimestamp(timestamp: unknown): string | null {
  if (timestamp == null || timestamp === "") return null;

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : formatDate(timestamp);
  }

  if (typeof timestamp === "number") {
    const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : formatDate(d);
  }

  if (typeof timestamp === "string") {
    const d = new Date(timestamp);
    return Number.isNaN(d.getTime()) ? null : formatDate(d);
  }

  const ts = timestamp as {
    seconds?: number;
    _seconds?: number;
    toDate?: () => Date;
  };

  if (typeof ts.toDate === "function") {
    const d = ts.toDate();
    return Number.isNaN(d.getTime()) ? null : formatDate(d);
  }

  const seconds = ts.seconds ?? ts._seconds;
  if (seconds != null && Number.isFinite(seconds)) {
    const d = new Date(seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : formatDate(d);
  }

  return null;
}

function resolveAnsweredAt(
  completion: CompletionAnswersContext | null,
  answers: PollCompletionAnswer[],
): string | null {
  if (answers.length > 0) {
    const latest = answers.reduce(
      (max, answer) => (answer.answeredAt > max ? answer.answeredAt : max),
      answers[0].answeredAt,
    );
    const fromSupabase = formatTimestamp(latest);
    if (fromSupabase) return fromSupabase;
  }
  return formatTimestamp(completion?.timeCompleted ?? null);
}

export default function CompletionAnswersPanel({
  taskId,
  completion,
  open,
  onOpenChange,
}: CompletionAnswersPanelProps) {
  const [data, setData] = useState<PollCompletionAnswersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswers = useCallback(async () => {
    if (!completion?.id && !completion?.participantId) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ taskId });
      if (completion.id) params.set("completionId", completion.id);
      if (completion.participantId) params.set("participantId", completion.participantId);

      const res = await fetchWithAuthRetry(`/api/admin/pollCompletionAnswers?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch poll answers");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch poll answers";
      setError(message);
      setData(null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [completion?.id, completion?.participantId, taskId]);

  useEffect(() => {
    if (open && completion) {
      fetchAnswers();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, completion, fetchAnswers]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Failed to copy"),
    );
  };

  const participantLabel =
    completion?.participantEmailAddress?.trim() ||
    completion?.participantId ||
    "Participant";

  const answeredAtLabel = useMemo(
    () => resolveAnsweredAt(completion, data?.answers ?? []),
    [completion, data?.answers],
  );

  const answerCount = data?.answers.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:max-w-lg p-0 gap-0 border-r border-[#5C29A3]/10"
      >
        <div className="bg-gradient-to-br from-[#EFECFD] via-[#F8F6FF] to-white px-6 pt-6 pb-5 border-b border-[#5C29A3]/10">
          <SheetHeader className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5C29A3]/10 text-[#5C29A3]">
                <ClipboardDocumentListIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
                  Poll answers
                </SheetTitle>
                <SheetDescription className="text-sm mt-1">
                  Responses submitted by this participant
                </SheetDescription>
              </div>
              {answerCount > 0 && !isLoading && (
                <Badge className="shrink-0 bg-[#5C29A3] hover:bg-[#5C29A3] text-white border-0">
                  {answerCount} {answerCount === 1 ? "answer" : "answers"}
                </Badge>
              )}
            </div>
          </SheetHeader>
        </div>

        {completion && (
          <div className="mx-6 mt-5 rounded-xl border border-[#5C29A3]/15 bg-[#FAFAFE] p-4 space-y-3.5">
            <div className="flex items-start gap-3">
              <UserCircleIcon className="h-5 w-5 shrink-0 text-[#5C29A3]/70 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Participant
                </p>
                <p className="text-sm font-medium text-foreground break-all mt-0.5">
                  {participantLabel}
                </p>
              </div>
            </div>

            {completion.id && (
              <div className="flex items-start gap-3">
                <ClipboardDocumentIcon className="h-5 w-5 shrink-0 text-[#5C29A3]/70 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Completion ID
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(completion.id!, "Completion ID")}
                    className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-[#5C29A3] hover:text-[#4a2182] transition-colors group"
                  >
                    <span className="break-all text-left">{completion.id}</span>
                    <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <ClockIcon className="h-5 w-5 shrink-0 text-[#5C29A3]/70 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Answered at
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  {isLoading ? (
                    <span className="text-muted-foreground">Loading…</span>
                  ) : answeredAtLabel ?? (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECFD] mb-4">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-[#5C29A3]" />
              </div>
              <p className="text-sm font-medium text-foreground">Loading answers</p>
              <p className="text-xs text-muted-foreground mt-1">Fetching from Insights…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : data?.answers.length ? (
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Selected responses
              </p>
              {data.answers.map((answer, index) => (
                <div
                  key={answer.questionId}
                  className="relative overflow-hidden rounded-xl border border-[#5C29A3]/12 bg-white shadow-sm"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5C29A3]" />
                  <div className="p-4 pl-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#EFECFD] px-2 text-xs font-semibold text-[#5C29A3]">
                        {index + 1}
                      </span>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Question
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {answer.questionText}
                    </p>
                    <div className="flex items-start gap-2 rounded-lg bg-[#EFECFD]/60 px-3 py-2.5">
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#5C29A3] mt-0.5" />
                      <p className="text-sm text-[#5C29A3] font-medium leading-snug">
                        {answer.optionText}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <ClipboardDocumentListIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No answers found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                This completion has no matching responses in Insights yet.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
