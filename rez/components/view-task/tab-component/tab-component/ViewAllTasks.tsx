"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useTasksData } from "@/hooks/use-tasks-data";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  XCircleIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { formatRejectionReasons } from "@/utils/rejection-reasons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { TOOLTIP_TEXTS } from "@/data/tooltip-texts";
import { Button } from "@/components/ui/button";

const TASK_TYPE_LABELS: Record<string, string> = {
  fillAForm: "Survey",
  checkOutApp: "Product test",
  checkOutWebApp: "Product test",
  answerPoll: "Poll",
  doVideoInterview: "Video interview",
};

export default function ViewTasks() {
  const { tasks, taskCompletions, isLoading, error } = useTasksData({ autoFetch: false });
  const { rejectionReasonsTooltipViewed, rejectedTaskEditClicked } = useAmplitudeEvents();

  const getTaskTypeLabel = (type: string | null | undefined) =>
    (type && TASK_TYPE_LABELS[type]) || type || "—";

  const getReviewStatusDisplay = (status: string | null | undefined) => {
    const dotClass = "w-2 h-2 rounded-full shrink-0";
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <span className={`${dotClass} bg-amber-500`} />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <span className={`${dotClass} bg-emerald-500`} />
            Approved
          </span>
        );
      case "published":
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <span className={`${dotClass} bg-[#5C29A3]`} />
            Published
          </span>
        );
      case "archived":
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <span className={`${dotClass} bg-slate-400`} />
            Archived
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <span className={`${dotClass} bg-red-500`} />
            Rejected
          </span>
        );
      default:
        return <span className="text-sm text-muted-foreground">—</span>;
    }
  };

  const getTaskCompletionsCount = (taskId: string | null) => {
    if (!taskId) return 0;
    return taskCompletions.filter((completion) => completion.taskId === taskId).length;
  };

  const getTaskTime = (task: (typeof tasks)[number]) => {
    const ts = task.timeCreated as Record<string, unknown> | null | undefined;
    if (!ts) return 0;
    if (typeof ts.seconds === "number") return ts.seconds * 1000;
    if (typeof ts._seconds === "number") return ts._seconds * 1000;
    if (typeof ts.toDate === "function") return (ts.toDate as () => Date)().getTime();
    return 0;
  };

  const sortedTasks = [...tasks].sort((a, b) => getTaskTime(b) - getTaskTime(a));

  const formatTaskTimestamp = (timestamp: unknown) => {
    if (!timestamp) return "—";

    try {
      let date: Date;
      const ts = timestamp as Record<string, unknown>;

      if (typeof ts.seconds === "number") {
        date = new Date(ts.seconds * 1000);
      } else if (typeof ts._seconds === "number") {
        date = new Date(ts._seconds * 1000);
      } else if (typeof ts.toDate === "function") {
        date = (ts.toDate as () => Date)();
      } else {
        date = new Date(timestamp as string | number);
      }

      if (Number.isNaN(date.getTime())) return "—";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-3 rounded-full bg-destructive/10 mb-3">
          <XCircleIcon className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-destructive font-medium">Error loading tasks</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="font-medium text-foreground">No tasks yet</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
            <TableHead className="font-medium w-[44px] text-center">#</TableHead>
            <TableHead className="font-medium min-w-[200px]">Title</TableHead>
            <TableHead className="font-medium w-[100px]">Type</TableHead>
            <TableHead className="font-medium w-[90px]">Review</TableHead>
            <TableHead className="font-medium w-[90px]">Live</TableHead>
            <TableHead className="text-right font-medium w-[72px]">Done</TableHead>
            <TableHead className="font-medium w-[100px]">Created</TableHead>
            <TableHead className="text-right font-medium w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task, index) => (
            <TableRow key={task.id} className="hover:bg-muted/30">
              <TableCell className="text-muted-foreground text-center text-sm tabular-nums w-[44px]">
                {index + 1}
              </TableCell>
              <TableCell className="min-w-[200px] max-w-[320px]">
                <p className="font-medium text-foreground leading-snug line-clamp-2">
                  {task.title || "Untitled"}
                </p>
                {task.levelOfDifficulty && (
                  <p className="text-xs text-muted-foreground mt-0.5">{task.levelOfDifficulty}</p>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{getTaskTypeLabel(task.type)}</span>
              </TableCell>
              <TableCell>{getReviewStatusDisplay(task.reviewStatus)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    task.isAvailable
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-normal"
                      : "border-border bg-muted/50 text-muted-foreground font-normal"
                  }
                >
                  {task.isAvailable ? "Active" : "Inactive"}
                </Badge>
                {task.reviewStatus === "rejected" && task.reasonsForRejection?.length ? (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="destructive"
                          className="ml-1.5 text-[10px] px-1.5 py-0 cursor-help"
                          onMouseEnter={() =>
                            rejectionReasonsTooltipViewed({
                              task_id: task.id,
                              rejection_reasons_count: task.reasonsForRejection?.length || 0,
                            })
                          }
                        >
                          Why
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p className="font-medium mb-1 text-xs">{TOOLTIP_TEXTS.rejectionReasonsHeader}</p>
                        <p className="text-xs">{formatRejectionReasons(task.reasonsForRejection)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {getTaskCompletionsCount(task.id)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatTaskTimestamp(task.timeCreated)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {task.type === "answerPoll" && task.id && (
                    <Link href={`/insights/${task.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1">
                        <ChartBarIcon className="h-3.5 w-3.5" />
                        Insights
                      </Button>
                    </Link>
                  )}
                  {task.type === "answerPoll" && task.reviewStatus !== "rejected" && task.id && (
                    <Link href={`/tasks/edit/${task.id}?focus=poll`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1">
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>
                  )}
                  {task.reviewStatus === "rejected" && task.id && (
                    <Link
                      href={`/tasks/edit/${task.id}`}
                      onClick={() => rejectedTaskEditClicked({ task_id: task.id })}
                    >
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1">
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
