"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { Task } from "@/firebase/firestore/models/Task";
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
  ShieldCheckIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithAuthRetry } from "@/lib/api-fetch";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

// Simple in-memory cache for completion counts per task ID set, keyed by
// a stable, comma-separated list of task IDs.
type CompletionCountsCacheEntry = {
  counts: Record<string, number>;
  fetchedAt: number;
};

const completionCountsCache = new Map<string, CompletionCountsCacheEntry>();
const COMPLETION_COUNTS_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default function AdminTaskCompletionsPage() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const {
    tasks,
    isLoadingTasks,
    isLoadingMoreTasks,
    hasMoreTasks,
    fetchAllTasks,
    loadMoreTasks,
    error,
  } = useAdminStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});

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

  const handleRefresh = async () => {
    try {
      await fetchAllTasks(true);
      toast.success("Tasks refreshed!");
    } catch {
      toast.error("Failed to refresh tasks");
    }
  };

  const handleRowClick = (task: Task) => {
    router.push(`/admin/task-completions/${task.id}`);
  };

  const getTaskTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case "fillAForm":
        return "Fill a Form";
      case "checkOutApp":
        return "Check Out App";
      case "answerPoll":
        return "Answer Poll";
      case "doVideoInterview":
        return "Video Interview";
      default:
        return type || "N/A";
    }
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return "N/A";
    try {
      const ts = timestamp as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds || ts._seconds;
      if (seconds) {
        return new Date(seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
      }
      return "N/A";
    } catch {
      return "N/A";
    }
  };

  const activeTasks = tasks.filter((t) => t.isAvailable === true);
  const filteredTasks = activeTasks.filter((task) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const title = (task.title || "").toLowerCase();
    const id = (task.id || "").toLowerCase();
    const creator = (task.rezTaskMasterEmailAddress || "").toLowerCase();
    return title.includes(query) || id.includes(query) || creator.includes(query);
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const getTime = (ts: unknown) => {
      const timestamp = ts as { seconds?: number; _seconds?: number };
      return (timestamp?.seconds || timestamp?._seconds || 0) * 1000;
    };
    return getTime(b.timeCreated) - getTime(a.timeCreated);
  });

  const taskIdsForCounts = useMemo(
    () => sortedTasks.map((t) => t.id).filter(Boolean).join(","),
    [sortedTasks]
  );

  useEffect(() => {
    if (!isAuthorized || !taskIdsForCounts) return;
    const taskIds = taskIdsForCounts.split(",").filter(Boolean);
    if (taskIds.length === 0) return;

    const cacheKey = taskIds.join(",");
    const now = Date.now();

    // Use cached counts if available and fresh
    const cached = completionCountsCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < COMPLETION_COUNTS_TTL_MS) {
      setCompletionCounts(cached.counts);
      return;
    }

    const loadCounts = async () => {
      try {
        const res = await fetchWithAuthRetry(
          `/api/admin/taskCompletionCounts?taskIds=${encodeURIComponent(taskIds.join(","))}`
        );
        const data = await res.json();
        if (data.counts && typeof data.counts === "object") {
          setCompletionCounts(data.counts);
          completionCountsCache.set(cacheKey, {
            counts: data.counts as Record<string, number>,
            fetchedAt: Date.now(),
          });
        }
      } catch {
        // Non-blocking: leave counts empty on error
      }
    };
    loadCounts();
  }, [isAuthorized, taskIdsForCounts]);

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

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Admin Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Task Completions
                </h1>
              </div>
              <p className="text-muted-foreground">
                Select an active task to validate or invalidate participant completions ({activeTasks.length} active tasks)
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoadingTasks}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingTasks ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, ID, or creator email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {isLoadingTasks && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        )}

        {!isLoadingTasks && sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {searchQuery ? "No active tasks match your search" : "No active tasks found"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Only tasks with isAvailable = true are shown here
            </p>
          </div>
        )}

        {!isLoadingTasks && sortedTasks.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[50px] font-semibold">#</TableHead>
                  <TableHead className="font-semibold min-w-[250px]">Title</TableHead>
                  <TableHead className="font-semibold">Creator</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold text-center w-[100px]">Completions</TableHead>
                  <TableHead className="font-semibold w-[100px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task, index) => (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => handleRowClick(task)}
                  >
                    <TableCell className="text-muted-foreground text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px] truncate font-medium" title={task.title || ""}>
                        {task.title || "Untitled Task"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={task.id || ""}>
                        {task.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]" title={task.rezTaskMasterEmailAddress || ""}>
                        {task.rezTaskMasterEmailAddress || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {getTaskTypeLabel(task.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {task.id != null && completionCounts[task.id] !== undefined
                        ? completionCounts[task.id]
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimestamp(task.timeCreated)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {hasMoreTasks && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMoreTasks()}
              disabled={isLoadingMoreTasks}
            >
              {isLoadingMoreTasks ? (
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
    </div>
  );
}
