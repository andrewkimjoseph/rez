"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ArrowPathIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
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

function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return "—";
  try {
    const ts = timestamp as { seconds?: number; _seconds?: number };
    const seconds = ts.seconds ?? ts._seconds;
    if (seconds != null) {
      return new Date(seconds * 1000).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (typeof timestamp === "string") {
      const d = new Date(timestamp);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    return "—";
  } catch {
    return "—";
  }
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Poll answers</SheetTitle>
          <SheetDescription>
            Responses submitted by this participant
          </SheetDescription>
        </SheetHeader>

        {completion && (
          <div className="mt-4 space-y-3 px-1 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Participant</p>
              <p className="font-medium break-all">{participantLabel}</p>
            </div>
            {completion.id && (
              <div>
                <p className="text-xs text-muted-foreground">Completion ID</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(completion.id!, "Completion ID")}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="break-all text-left">{completion.id}</span>
                  <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Answered at</p>
              <p className="text-muted-foreground">{formatTimestamp(completion.timeCompleted)}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading answers...</p>
          </div>
        ) : error ? (
          <p className="py-8 text-sm text-destructive px-1">{error}</p>
        ) : data?.answers.length ? (
          <div className="mt-6 space-y-3 px-1">
            {data.answers.map((answer, index) => (
              <div
                key={answer.questionId}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Question {index + 1}
                </p>
                <p className="text-sm font-medium text-foreground leading-snug">
                  {answer.questionText}
                </p>
                <Badge
                  variant="secondary"
                  className="bg-[#EFECFD] text-[#5C29A3] hover:bg-[#EFECFD]/80 border-0 font-normal text-left whitespace-normal h-auto py-1.5 px-2.5"
                >
                  {answer.optionText}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-muted-foreground px-1">
            No answers found for this completion.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
