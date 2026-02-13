"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { TaskCompletion } from "@/firebase/firestore/models/TaskCompletion";

type TaskCompletionWithReward = TaskCompletion & {
  reward?: { txnHash: string };
  participantEmailAddress?: string | null;
  participantCountry?: string | null;
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import ParticipantDetailPanel from "@/components/admin/ParticipantDetailPanel";

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
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [completionToValidate, setCompletionToValidate] = useState<TaskCompletionWithReward | null>(null);
  const [validationDate, setValidationDate] = useState<Date | undefined>(undefined);
  const [validationTime, setValidationTime] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'valid' | 'invalid' | 'invalidated' | 'expired' | 'claimed'>('all');
  const [hasMoreCompletions, setHasMoreCompletions] = useState(false);
  const [lastDocIdForCursor, setLastDocIdForCursor] = useState<string | null>(null);
  const [totalCompletionsCount, setTotalCompletionsCount] = useState<number | null>(null);
  const [isLoadingMoreCompletions, setIsLoadingMoreCompletions] = useState(false);
  const [countdownTick, setCountdownTick] = useState(0);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantPanelOpen, setParticipantPanelOpen] = useState(false);

  const task = tasks.find((t) => t.id === taskId);
  const isTaskActive = task?.isAvailable === true;

  const isExpired = (screeningTimeCreated: unknown) => {
    if (!screeningTimeCreated) return false;
    try {
      const ts = screeningTimeCreated as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds ?? ts._seconds;
      if (seconds != null) {
        const screeningTime = seconds * 1000;
        const now = Date.now();
        const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        return (now - screeningTime) > twoHoursInMs;
      }
      return false;
    } catch {
      return false;
    }
  };

  const stats = useMemo(() => {
    const completed = taskCompletions.filter(c => c.timeCompleted != null).length;
    const invalidated = taskCompletions.filter(c => c.invalidatedAt != null).length;
    const claimed = taskCompletions.filter(c => c.reward?.txnHash != null).length;
    const valid = taskCompletions.filter(c => c.isValid === true && c.invalidatedAt == null).length;
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const now = Date.now();
    const expired = taskCompletions.filter(c => {
      // Only count invalid completions that have expired
      if (c.isValid) return false;
      const ts = c.screeningTimeCreated as { seconds?: number; _seconds?: number } | null | undefined;
      if (ts == null) return false;
      const sec = ts.seconds ?? ts._seconds;
      if (sec == null) return false;
      return (now - sec * 1000) > twoHoursInMs;
    }).length;
    const invalid = taskCompletions.filter(c => {
      // Invalid but not expired
      if (c.isValid) return false;
      const ts = c.screeningTimeCreated as { seconds?: number; _seconds?: number } | null | undefined;
      if (ts == null) return false;
      const sec = ts.seconds ?? ts._seconds;
      if (sec == null) return false;
      return (now - sec * 1000) <= twoHoursInMs;
    }).length;
    const totalInvalid = invalid + expired;
    return { completed, invalid, invalidated, claimed, expired, totalInvalid, valid };
  }, [taskCompletions]);

  const filteredCompletions = useMemo(() => {
    if (statusFilter === 'all') return taskCompletions;
    
    return taskCompletions.filter((completion) => {
      switch (statusFilter) {
        case 'complete':
          return completion.timeCompleted != null && completion.isValid === true;
        case 'valid':
          return completion.isValid === true && completion.invalidatedAt == null;
        case 'invalid':
          return !completion.isValid && completion.invalidatedAt == null;
        case 'invalidated':
          return completion.invalidatedAt != null;
        case 'expired':
          // Only show invalid completions that have expired
          if (completion.isValid) return false;
          return isExpired(completion.screeningTimeCreated);
        case 'claimed':
          return completion.reward?.txnHash != null;
        default:
          return true;
      }
    });
  }, [taskCompletions, statusFilter]);

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

  const loadCompletions = useCallback(async () => {
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
            participantCountry: c.participantCountry ?? null,
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
        setTotalCompletionsCount(data.totalCount ?? null);
      } else {
        setTaskCompletions([]);
        setHasMoreCompletions(false);
        setLastDocIdForCursor(null);
        setTotalCompletionsCount(null);
      }
    } catch {
      toast.error("Failed to load completions");
      setTaskCompletions([]);
      setHasMoreCompletions(false);
      setLastDocIdForCursor(null);
    } finally {
      setIsLoadingCompletions(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId || !isAuthorized || !task || !isTaskActive) return;
    loadCompletions();
  }, [taskId, isAuthorized, task, isTaskActive, loadCompletions]);

  useEffect(() => {
    // Set up interval if there are non-expired completions or completions waiting for cooldown
    const hasNonExpired = taskCompletions.some(c => !isExpired(c.screeningTimeCreated));
    // Check if there are completions that might be in cooldown (have timeCompleted and task has cooldown)
    const hasCooldownActive = taskCompletions.some(c => 
      c.timeCompleted != null && 
      task?.numberOfCooldownHours != null && 
      task.numberOfCooldownHours > 0
    );
    
    if (hasNonExpired || hasCooldownActive) {
      const interval = setInterval(() => {
        setCountdownTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [taskCompletions, task]);

  const openValidateDialog = (completion: TaskCompletionWithReward) => {
    setCompletionToValidate(completion);
    // Set default date/time to now
    setValidationDate(new Date());
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setValidationTime(`${hours}:${minutes}:${seconds}`);
    setValidateDialogOpen(true);
  };

  const handleValidate = async () => {
    if (!completionToValidate?.id) return;
    
    if (!validationDate) {
      toast.error("Please select a date");
      return;
    }

    if (!validationTime) {
      toast.error("Please select a time");
      return;
    }

    setUpdatingCompletionId(completionToValidate.id);
    
    // Combine date and time
    const [hours, minutes, seconds] = validationTime.split(':').map(Number);
    const completionDateTime = new Date(validationDate);
    completionDateTime.setHours(hours || 0, minutes || 0, seconds || 0, 0);

    try {
      const res = await fetchWithAuthRetry("/api/admin/updateTaskCompletion", {
        method: "PATCH",
        body: JSON.stringify({ 
          completionId: completionToValidate.id, 
          isValid: true,
          timeCompleted: completionDateTime.getTime()
        }),
      });
      if (res.ok) {
        setValidateDialogOpen(false);
        setCompletionToValidate(null);
        setValidationDate(undefined);
        setValidationTime("");
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

  const getCountryCode = (countryName: string | null | undefined): string | null => {
    if (!countryName) return null;
    const country = countries.all.find(
      (c) => c.name === countryName || c.name.toLowerCase() === countryName.toLowerCase()
    );
    return country?.alpha2?.toLowerCase() ?? null;
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

  const getTimeUntilExpiration = (screeningTimeCreated: unknown): string | null => {
    if (!screeningTimeCreated) return null;
    try {
      const ts = screeningTimeCreated as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds ?? ts._seconds;
      if (seconds != null) {
        const screeningTime = seconds * 1000;
        const now = Date.now();
        const twoHoursInMs = 2 * 60 * 60 * 1000;
        const timeRemainingMs = twoHoursInMs - (now - screeningTime);
        
        if (timeRemainingMs <= 0) return null; // Expired
        
        const hours = Math.floor(timeRemainingMs / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemainingMs % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((timeRemainingMs % (60 * 1000)) / 1000);
        
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          return `${minutes}m ${secs}s`;
        } else {
          return `${secs}s`;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const getTimeUntilCanClaim = (timeCompleted: unknown, numberOfCooldownHours: number | null): string | null => {
    if (!timeCompleted) return null;
    if (!numberOfCooldownHours || numberOfCooldownHours === 0) return null; // No cooldown, can claim immediately
    
    try {
      const ts = timeCompleted as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds ?? ts._seconds;
      if (seconds != null) {
        const completionTime = seconds * 1000;
        const now = Date.now();
        const cooldownMs = numberOfCooldownHours * 60 * 60 * 1000;
        const timeSinceCompletion = now - completionTime;
        const timeRemainingMs = cooldownMs - timeSinceCompletion;
        
        if (timeRemainingMs <= 0) return null; // Cooldown passed, can claim
        
        const hours = Math.floor(timeRemainingMs / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemainingMs % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((timeRemainingMs % (60 * 1000)) / 1000);
        
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          return `${minutes}m ${secs}s`;
        } else {
          return `${secs}s`;
        }
      }
      return null;
    } catch {
      return null;
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
            participantCountry: c.participantCountry ?? null,
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
              {taskId && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(taskId, "Task ID")}
                  className="group/copy inline-flex items-center gap-2 rounded px-1.5 -ml-1.5 py-1 hover:bg-muted/80 transition-colors text-left mb-1"
                  title={`Copy task ID: ${taskId}`}
                >
                  <span className="text-sm font-mono text-muted-foreground">
                    Task ID: {taskId}
                  </span>
                  <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                </button>
              )}
              <p className="text-muted-foreground">
                Validate or invalidate participant completions
                {hasMoreCompletions
                  ? ` (${taskCompletions.length} shown, load more for more - ${stats.completed} completed, ${stats.valid} valid, ${stats.totalInvalid} invalid, ${stats.invalidated} invalidated, ${stats.expired} expired, ${stats.claimed} claimed) [${totalCompletionsCount ?? taskCompletions.length} total]`
                  : ` (${taskCompletions.length} total, ${stats.completed} completed, ${stats.valid} valid, ${stats.totalInvalid} invalid, ${stats.invalidated} invalidated, ${stats.expired} expired, ${stats.claimed} claimed)`}
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

        {/* Filter Buttons */}
        {!isLoadingCompletions && taskCompletions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'complete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('complete')}
              className={statusFilter === 'complete' ? '' : 'text-green-700 border-green-300 hover:bg-green-50'}
            >
              Complete
            </Button>
            <Button
              variant={statusFilter === 'valid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('valid')}
              className={statusFilter === 'valid' ? '' : 'text-green-700 border-green-300 hover:bg-green-50'}
            >
              Valid
            </Button>
            <Button
              variant={statusFilter === 'invalid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('invalid')}
              className={statusFilter === 'invalid' ? '' : 'text-red-700 border-red-300 hover:bg-red-50'}
            >
              Invalid
            </Button>
            <Button
              variant={statusFilter === 'invalidated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('invalidated')}
              className={statusFilter === 'invalidated' ? '' : 'text-orange-700 border-orange-300 hover:bg-orange-50'}
            >
              Invalidated
            </Button>
            <Button
              variant={statusFilter === 'expired' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('expired')}
              className={statusFilter === 'expired' ? '' : 'text-red-700 border-red-300 hover:bg-red-50'}
            >
              Expired
            </Button>
            <Button
              variant={statusFilter === 'claimed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('claimed')}
              className={statusFilter === 'claimed' ? '' : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'}
            >
              Claimed
            </Button>
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

        {!isLoadingCompletions && taskCompletions.length > 0 && filteredCompletions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No completions match the selected filter</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try selecting a different filter
            </p>
          </div>
        )}

        {!isLoadingCompletions && taskCompletions.length > 0 && filteredCompletions.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
              <div className="min-w-max">
                <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[50px] font-semibold">#</TableHead>
                  <TableHead className="w-[40px] font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Participant ID</TableHead>
                  <TableHead className="font-semibold w-[80px]">Email</TableHead>
                  <TableHead className="font-semibold">Country</TableHead>
                  <TableHead className="font-semibold">Started at</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  {/* <TableHead className="font-semibold">Invalidated at</TableHead> */}
                  <TableHead className="font-semibold">Expired</TableHead>
                  <TableHead className="font-semibold">Claimed</TableHead>
                  <TableHead className="font-semibold">Completed at</TableHead>
                  <TableHead className="font-semibold">Can Claim</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompletions.map((completion, index) => (
                  <TableRow key={completion.id || completion.participantId || completion.screeningId || Math.random()} className="hover:bg-muted/20">
                    <TableCell className="text-muted-foreground text-center">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm align-middle w-[40px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(completion.id || "", "Completion ID");
                              }}
                              className="group/copy inline-flex items-center justify-center rounded px-1.5 py-1 hover:bg-muted/80 transition-colors disabled:pointer-events-none disabled:opacity-100"
                              disabled={!completion.id}
                            >
                              {completion.id && (
                                <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                              )}
                            </button>
                          </TooltipTrigger>
                          {completion.id && (
                            <TooltipContent>
                              <p>ID</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-mono text-sm align-middle">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(completion.participantId || "", "Participant ID");
                              }}
                              className="group/copy inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full disabled:pointer-events-none disabled:opacity-100"
                              disabled={!completion.participantId}
                            >
                              <span className="truncate min-w-0 flex-1">{truncateDisplay(completion.participantId, 12, "N/A")}</span>
                              {completion.participantId && (
                                <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                              )}
                            </button>
                          </TooltipTrigger>
                          {completion.participantId && (
                            <TooltipContent>
                              <p>Participant ID</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle">
                      {completion.participantId && completion.participantEmailAddress ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipantId(completion.participantId);
                            setParticipantPanelOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full cursor-pointer"
                        >
                          <span className="truncate min-w-0 flex-1">{truncateDisplay(completion.participantEmailAddress, 20, "—")}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm align-middle">
                      {completion.participantCountry ? (
                        getCountryCode(completion.participantCountry) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full cursor-help">
                                  <CircleFlag
                                    countryCode={getCountryCode(completion.participantCountry)!}
                                    height={20}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {completion.participantCountry}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{formatTimestamp(completion.screeningTimeCreated)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Started at</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              {completion.invalidatedAt != null ? (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                  Invalidated
                                </Badge>
                              ) : completion.isValid ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                                  Valid
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                  Invalid
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Status</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {/* <TableCell className="text-muted-foreground text-sm">
                      {completion.invalidatedAt ? (
                        formatTimestamp(completion.invalidatedAt)
                      ) : isExpired(completion.screeningTimeCreated) ? (
                        <span>N/A</span>
                      ) : completion.reward?.txnHash ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                          Not Invalidated
                        </Badge>
                      ) : (
                        <span>N/A</span>
                      )}
                    </TableCell> */}
                    <TableCell className="text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              {completion.invalidatedAt != null ? (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                  Yes
                                </Badge>
                              ) : completion.isValid && completion.timeCompleted != null ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                                  No
                                </Badge>
                              ) : isExpired(completion.screeningTimeCreated) ? (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                  Yes
                                </Badge>
                              ) : (() => {
                                const timeRemaining = getTimeUntilExpiration(completion.screeningTimeCreated);
                                return timeRemaining ? (
                                  <span className="text-muted-foreground text-sm">{timeRemaining}</span>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                                    No
                                  </Badge>
                                );
                              })()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Expired</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              {completion.invalidatedAt ? (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                  Cannot
                                </Badge>
                              ) : completion.reward?.txnHash ? (
                                <a
                                  href={`https://celoscan.io/tx/${completion.reward.txnHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-0">
                                    Yes
                                  </Badge>
                                  <span className="text-xs font-mono truncate max-w-[80px]">
                                    {completion.reward.txnHash.slice(0, 10)}…
                                  </span>
                                </a>
                              ) : completion.isValid && completion.timeCompleted ? (
                                (() => {
                                  const timeUntilCanClaim = getTimeUntilCanClaim(completion.timeCompleted, task?.numberOfCooldownHours ?? null);
                                  if (timeUntilCanClaim) {
                                    // Still in cooldown, show countdown
                                    return (
                                      <span className="text-muted-foreground text-sm">{timeUntilCanClaim}</span>
                                    );
                                  } else {
                                    // Cooldown passed but not claimed, show "Not yet" in orange
                                    return (
                                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-0">
                                        Not yet
                                      </Badge>
                                    );
                                  }
                                })()
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Claimed</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {completion.timeCompleted ? (
                              <span className="text-muted-foreground cursor-help">{formatTimestamp(completion.timeCompleted)}</span>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                Incomplete
                              </Badge>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Completed at</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              {completion.invalidatedAt ? (
                                <span className="text-muted-foreground">N/A</span>
                              ) : completion.reward?.txnHash ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                                  Done
                                </Badge>
                              ) : !completion.timeCompleted ? (
                                <span className="text-muted-foreground">N/A</span>
                              ) : (() => {
                                const timeUntilCanClaim = getTimeUntilCanClaim(completion.timeCompleted, task?.numberOfCooldownHours ?? null);
                                if (timeUntilCanClaim === null) {
                                  // Cooldown passed or no cooldown, can claim
                                  return (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                                      Yes
                                    </Badge>
                                  );
                                } else {
                                  // Still in cooldown, can't claim
                                  return (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                                      No
                                    </Badge>
                                  );
                                }
                              })()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Can Claim</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                            onClick={() => openValidateDialog(completion)}
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
                            title={completion.reward?.txnHash ? "Cannot invalidate: already claimed" : undefined}
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
              </div>
            </div>
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

        <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Validate completion</DialogTitle>
              <DialogDescription>
                Select the date and time when this completion was completed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="validation-date" className="text-sm font-medium mb-2 block">
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="validation-date"
                        className="w-full justify-between font-normal"
                      >
                        {validationDate ? format(validationDate, "PPP") : "Select date"}
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={validationDate}
                        captionLayout="dropdown"
                        defaultMonth={validationDate}
                        onSelect={(date) => {
                          setValidationDate(date);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-32">
                  <Label htmlFor="validation-time" className="text-sm font-medium mb-2 block">
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="validation-time"
                    step="1"
                    value={validationTime}
                    onChange={(e) => setValidationTime(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setValidateDialogOpen(false);
                  setCompletionToValidate(null);
                  setValidationDate(undefined);
                  setValidationTime("");
                }}
                disabled={!!updatingCompletionId}
              >
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={!validationDate || !validationTime || !!updatingCompletionId}
              >
                {updatingCompletionId ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <ParticipantDetailPanel
          participantId={selectedParticipantId}
          open={participantPanelOpen}
          onOpenChange={setParticipantPanelOpen}
          onUpdate={loadCompletions}
        />
      </div>
    </div>
  );
}
