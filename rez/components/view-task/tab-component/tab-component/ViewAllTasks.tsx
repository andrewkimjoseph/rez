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
import { Button } from "@/components/ui/button";
import { Task } from "@/firebase/firestore/models/Task";
import {
  XCircleIcon,
  ArrowPathIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { formatRejectionReasons } from "@/utils/rejection-reasons";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function ViewTasks() {
  const { tasks, taskCompletions, isLoading, error } = useTasksData({ autoFetch: false });
  const { rejectedTaskEditClicked, rejectionReasonsTooltipViewed } = useAmplitudeEvents();

  const getTaskTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'fillAForm':
        return 'Fill a Form';
      case 'checkOutApp':
        return 'Check Out App';
      case 'doVideoInterview':
        return 'Video Interview';
      default:
        return type || 'N/A';
    }
  };

  const getTaskCompletionsCount = (taskId: string | null) => {
    if (!taskId) return 0;
    return taskCompletions.filter(completion => completion.taskId === taskId).length;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const getDeadlineTime = (deadline: unknown) => {
      if (!deadline) return 0;
      const d = deadline as Record<string, unknown>;
      if (d._seconds && typeof d._seconds === 'number') {
        return d._seconds * 1000;
      } else if (d.seconds && typeof d.seconds === 'number') {
        return d.seconds * 1000;
      } else if (d.toDate && typeof d.toDate === 'function') {
        return (d.toDate as () => Date)().getTime();
      }
      return 0;
    };
    
    const deadlineA = getDeadlineTime(a.deadline);
    const deadlineB = getDeadlineTime(b.deadline);
    return deadlineB - deadlineA;
  });

  const formatTaskTimestamp = (timestamp: unknown) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      const ts = timestamp as Record<string, unknown>;
      
      if (ts.seconds && typeof ts.seconds === 'number') {
        date = new Date(ts.seconds * 1000);
      } else if (ts._seconds && typeof ts._seconds === 'number') {
        date = new Date(ts._seconds * 1000);
      } else if (ts.toDate && typeof ts.toDate === 'function') {
        date = (ts.toDate as () => Date)();
      } else {
        date = new Date(timestamp as string | number);
      }
      
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-3 rounded-full bg-destructive/10 mb-3">
          <XCircleIcon className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-destructive font-medium">Error loading tasks</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-3 rounded-full bg-muted mb-3">
          <XCircleIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">No tasks found</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[50px] font-semibold">#</TableHead>
              <TableHead className="font-semibold min-w-[380px]">Title</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Target</TableHead>
              <TableHead className="text-right font-semibold">Completions</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task, index) => (
              <TableRow key={task.id} className="hover:bg-muted/20">
                <TableCell className="text-muted-foreground text-center">
                  {index + 1}
                </TableCell>
                <TableCell className="min-w-[380px] max-w-[480px]">
                  <div className="font-medium break-words min-w-0">
                    {task.title || 'Untitled Task'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5 min-w-0" title={task.id || ''}>
                    {task.id || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {getTaskTypeLabel(task.type)}
                  </Badge>
                </TableCell>
                <TableCell className="min-w-[200px] whitespace-nowrap">
                  <div className="flex flex-nowrap items-center gap-2">
                    <Badge 
                      variant={task.isAvailable ? "default" : "secondary"}
                      className={task.isAvailable ? "bg-[#EFECFD] text-[#5C29A3] hover:bg-[#EFECFD]/80 border-0 shrink-0" : "shrink-0"}
                    >
                      {task.isAvailable ? 'Active' : 'Inactive'}
                    </Badge>
                    {task.reviewStatus === 'rejected' && task.reasonsForRejection && task.reasonsForRejection.length > 0 && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="destructive" 
                              className="text-[10px] px-1.5 py-0.5 cursor-help shrink-0"
                              onMouseEnter={() => rejectionReasonsTooltipViewed({ 
                                task_id: task.id,
                                rejection_reasons_count: task.reasonsForRejection?.length || 0,
                              })}
                            >
                              Rejected
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[300px]">
                            <p className="font-medium mb-1">Rejection Reasons:</p>
                            <p className="text-xs">{formatRejectionReasons(task.reasonsForRejection)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {task.targetNumberOfParticipants || 0}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {getTaskCompletionsCount(task.id)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTaskTimestamp(task.timeCreated)}
                </TableCell>
                <TableCell>
                  {task.reviewStatus === 'rejected' && (
                    <Link 
                      href={`/tasks/edit/${task.id}`}
                      onClick={() => rejectedTaskEditClicked({ 
                        task_id: task.id,
                        task_title: task.title,
                        rejection_reasons_count: task.reasonsForRejection?.length || 0,
                      })}
                    >
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
