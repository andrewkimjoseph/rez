"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { TaskCompletion } from "@/firebase/firestore/models/TaskCompletion";

type TaskCompletionWithReward = TaskCompletion & {
  reward?: { txnHash: string };
  participantEmailAddress?: string | null;
  screeningTimeCreated?: unknown | null;
};
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  XCircleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchWithAuthRetry } from "@/lib/api-fetch";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export default function AdminTaskCompletionsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId as string;

  const { user } = useTaskMasterStore();
  const { tasks, isLoadingTasks, fetchAllTasks } = useAdminStore();

  const [taskCompletions, setTaskCompletions] = useState<TaskCompletionWithReward[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [updatingCompletionId, setUpdatingCompletionId] = useState<string | null>(null);
  const [invalidateDialogOpen, setInvalidateDialogOpen] = useState(false);
  const [completionToInvalidate, setCompletionToInvalidate] = useState<TaskCompletionWithReward | null>(null);
  const [hasMoreCompletions, setHasMoreCompletions] = useState(false);
  const [lastDocIdForCursor, setLastDocIdForCursor] = useState<string | null>(null);
  const [isLoadingMoreCompletions, setIsLoadingMoreCompletions] = useState(false);

  const task = tasks.find((t) => t.id === taskId);
  const isTaskActive = task?.isAvailable === true;

  const stats = useMemo(() => {
    const completed = taskCompletions.filter(c => c.timeCompleted != null).length;
    const invalidated = taskCompletions.filter(c => !c.isValid || c.invalidatedAt != null).length;
    const paid = taskCompletions.filter(c => c.reward?.txnHash != null).length;
    return { completed, invalidated, paid };
  }, [taskCompletions]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      if (user.isSuperAdmin) {
        setIsAuthorized(true);
        fetchAllTasks();
      } else {
        setIsAuthorized(false);
      }
    } else if (isHydrated && !user) {
      router.push("/sign-in");
    }
  }, [isHydrated, user, router, fetchAllTasks]);

  const loadCompletions = async () => {
    if (!taskId) return;
    setIsLoadingCompletions(true);
    try {
      const res = await fetchWithAuthRetry(`/api/admin/taskCompletions?taskId=${encodeURIComponent(taskId)}`);
      const data = await res.json();
      if (data.taskCompletions) {
        setTaskCompletions(
          data.taskCompletions.map((c: any) => ({
            ...c,
            id: c.id ?? null,
            isValid: c.isValid === true,
            participantId: c.participantId ?? null,
            participantEmailAddress: c.participantEmailAddress ?? null,
            screeningId: c.screeningId ?? null,
            screeningTimeCreated: c.screeningTimeCreated ?? null,
            invalidatedAt: c.invalidatedAt ?? null,
            invalidatedBy: c.invalidatedBy ?? null,
            taskId: c.taskId ?? null,
            timeCompleted: c.timeCompleted ?? null,
            timeCreated: c.timeCreated ?? null,
            timeUpdated: c.timeUpdated ?? null,
            reward: c.reward ?? undefined,
          }))
        );
        setHasMoreCompletions(data.hasMore === true);
        setLastDocIdForCursor(
          data.nextCursor?.startAfterDocId ?? null
        );
      } else {
        setTaskCompletions([]);
        setHasMoreCompletions(false);
        setLastDocIdForCursor(null);
      }
    } catch {
      toast.error("Failed to load completions");
      setTaskCompletions([]);
      setHasMoreCompletions(false);
      setLastDocIdForCursor(null);
    } finally {
      setIsLoadingCompletions(false);
    }
  };

  useEffect(() => {
    if (!taskId || !isAuthorized || !task || !isTaskActive) return;
    loadCompletions();
  }, [taskId, isAuthorized, task, isTaskActive]);

  const handleValidate = async (completion: TaskCompletionWithReward) => {
    if (!completion.id) return;
    setUpdatingCompletionId(completion.id);
    try {
      const res = await fetchWithAuthRetry("/api/admin/updateTaskCompletion", {
        method: "PATCH",
        body: JSON.stringify({ completionId: completion.id, isValid: true }),
      });
      if (res.ok) {
        await loadCompletions();
        toast.success("Completion validated");
      } else {
        toast.error("Failed to validate completion");
      }
    } catch {
      toast.error("Failed to validate completion");
    } finally {
      setUpdatingCompletionId(null);
    }
  };

  const handleInvalidate = async (completion: TaskCompletionWithReward) => {
    if (!completion.id) return;
    setUpdatingCompletionId(completion.id);
    setInvalidateDialogOpen(false);
    setCompletionToInvalidate(null);
    try {
      const res = await fetchWithAuthRetry("/api/admin/updateTaskCompletion", {
        method: "PATCH",
        body: JSON.stringify({ completionId: completion.id, isValid: false }),
      });
      if (res.ok) {
        await loadCompletions();
        toast.success("Completion invalidated");
      } else {
        toast.error("Failed to invalidate completion");
      }
    } catch {
      toast.error("Failed to invalidate completion");
    } finally {
      setUpdatingCompletionId(null);
    }
  };

  const openInvalidateDialog = (completion: TaskCompletionWithReward) => {
    setCompletionToInvalidate(completion);
    setInvalidateDialogOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === "—" || text === "N/A") return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Failed to copy")
    );
  };

  const truncateDisplay = (value: string | null | undefined, maxLen: number, fallback: string) => {
    if (value == null || value === "") return fallback;
    return value.length <= maxLen ? value : `${value.slice(0, maxLen)}…`;
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return "N/A";
    try {
      const ts = timestamp as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds ?? ts._seconds;
      if (seconds != null) {
        return new Date(seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "N/A";
    } catch {
      return "N/A";
    }
  };


  const loadMoreCompletions = () => {
    if (!taskId || !lastDocIdForCursor || isLoadingMoreCompletions) return;
    setIsLoadingMoreCompletions(true);
    fetchWithAuthRetry(
      `/api/admin/taskCompletions?taskId=${encodeURIComponent(taskId)}&startAfterDocId=${encodeURIComponent(lastDocIdForCursor)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.taskCompletions?.length) {
          const mapped = data.taskCompletions.map((c: any) => ({
            ...c,
            id: c.id ?? null,
            isValid: c.isValid === true,
            participantId: c.participantId ?? null,
            participantEmailAddress: c.participantEmailAddress ?? null,
            screeningId: c.screeningId ?? null,
            screeningTimeCreated: c.screeningTimeCreated ?? null,
            invalidatedAt: c.invalidatedAt ?? null,
            invalidatedBy: c.invalidatedBy ?? null,
            taskId: c.taskId ?? null,
            timeCompleted: c.timeCompleted ?? null,
            timeCreated: c.timeCreated ?? null,
            timeUpdated: c.timeUpdated ?? null,
            reward: c.reward ?? undefined,
          }));
          setTaskCompletions((prev) => [...prev, ...mapped]);
          setHasMoreCompletions(data.hasMore === true);
          setLastDocIdForCursor(data.nextCursor?.startAfterDocId ?? null);
        } else {
          setHasMoreCompletions(false);
          setLastDocIdForCursor(null);
        }
      })
      .catch(() => toast.error("Failed to load more"))
      .finally(() => setIsLoadingMoreCompletions(false));
  };

  if (!isHydrated || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AdminAccessDenied />;
  }

  if (!isLoadingTasks && task && !isTaskActive) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="p-3 rounded-full bg-amber-500/10 mb-3">
          <NoSymbolIcon className="h-6 w-6 text-amber-600" />
        </div>
        <p className="font-medium text-foreground">This task is not active</p>
        <p className="text-sm text-muted-foreground mt-1">
          Only completions for active tasks can be managed
        </p>
        <Link href="/admin/task-completions">
          <Button variant="outline" className="mt-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Task Completions
          </Button>
        </Link>
      </div>
    );
  }

  if (!isLoadingTasks && !task && taskId) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="p-3 rounded-full bg-muted mb-3">
          <XCircleIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Task not found</p>
        <Link href="/admin/task-completions">
          <Button variant="outline" className="mt-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Task Completions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/admin/task-completions"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Task Completions</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Completions for {task?.title || "Task"}
                </h1>
              </div>
              <p className="text-muted-foreground">
                Validate or invalidate participant completions
                {hasMoreCompletions
                  ? ` (${taskCompletions.length} shown, load more for more)`
                  : ` (${taskCompletions.length} total, ${stats.completed} completed, ${stats.invalidated} invalidated, ${stats.paid} paid)`}
              </p>
            </div>
            <Button
              onClick={loadCompletions}
              disabled={isLoadingCompletions}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingCompletions ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoadingCompletions && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading completions...</p>
          </div>
        )}

        {!isLoadingCompletions && taskCompletions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No completions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Participants have not completed this task
            </p>
          </div>
        )}

        {!isLoadingCompletions && taskCompletions.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Participant ID</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Screening time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Invalidated at</TableHead>
                  <TableHead className="font-semibold">Paid</TableHead>
                  <TableHead className="font-semibold">Completed</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskCompletions.map((completion) => (
                  <TableRow key={completion.id || completion.participantId || completion.screeningId || Math.random()} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-sm align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(completion.participantId || "", "Participant ID");
                        }}
                        className="group/copy inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full disabled:pointer-events-none disabled:opacity-100"
                        title={completion.participantId ? String(completion.participantId) : undefined}
                        disabled={!completion.participantId}
                      >
                        <span className="truncate min-w-0 flex-1">{truncateDisplay(completion.participantId, 12, "N/A")}</span>
                        {completion.participantId && (
                          <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(completion.participantEmailAddress || "", "Email");
                        }}
                        className="group/copy inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full disabled:pointer-events-none disabled:opacity-100"
                        title={completion.participantEmailAddress ? String(completion.participantEmailAddress) : undefined}
                        disabled={!completion.participantEmailAddress}
                      >
                        <span className="truncate min-w-0 flex-1">{truncateDisplay(completion.participantEmailAddress, 20, "—")}</span>
                        {completion.participantEmailAddress && (
                          <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTimestamp(completion.screeningTimeCreated)}
                    </TableCell>
                    <TableCell>
                      {completion.isValid ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                          Valid
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {completion.invalidatedAt ? formatTimestamp(completion.invalidatedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {completion.reward?.txnHash ? (
                        <a
                          href={`https://celoscan.io/tx/${completion.reward.txnHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-0">
                            Paid
                          </Badge>
                          <span className="text-xs font-mono truncate max-w-[80px]">
                            {completion.reward.txnHash.slice(0, 10)}…
                          </span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTimestamp(completion.timeCompleted)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={!!updatingCompletionId}
                          >
                            {updatingCompletionId === completion.id ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleValidate(completion)}
                            className="cursor-pointer text-green-700"
                            disabled={completion.isValid}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Validate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openInvalidateDialog(completion)}
                            className="cursor-pointer text-red-700"
                            disabled={!completion.isValid || !!completion.reward?.txnHash}
                            title={completion.reward?.txnHash ? "Cannot invalidate: already paid out" : undefined}
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Invalidate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMoreCompletions && (
              <div className="flex justify-center py-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreCompletions}
                  disabled={isLoadingMoreCompletions}
                >
                  {isLoadingMoreCompletions ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <Dialog open={invalidateDialogOpen} onOpenChange={setInvalidateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invalidate completion?</DialogTitle>
              <DialogDescription>
                This completion will be invalidated and the participant will not be able to claim the reward.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setInvalidateDialogOpen(false);
                  setCompletionToInvalidate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => completionToInvalidate && handleInvalidate(completionToInvalidate)}
                disabled={!completionToInvalidate}
              >
                Invalidate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
