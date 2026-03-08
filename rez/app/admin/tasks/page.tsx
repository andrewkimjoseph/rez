"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { useSelectedTaskStore } from "@/stores/selected-task-store";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheckIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  XCircleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PowerIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import AdminEditTaskDialog from "@/components/admin/AdminEditTaskDialog";
import AdminRejectTaskDialog from "@/components/admin/AdminRejectTaskDialog";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { getTokenInfo } from "@/utils/currencies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { AlgoliaAttribution } from "@/components/algolia-attribution";

export default function AdminTasksPage() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const {
    tasks,
    isLoadingTasks,
    isLoadingMoreTasks,
    hasMoreTasks,
    isDeleting,
    isUpdating,
    fetchAllTasks,
    loadMoreTasks,
    deleteTask,
    updateTask,
    error
  } = useAdminStore();
  const { setTask } = useSelectedTaskStore();
  const {
    adminTasksPageViewed,
    adminTaskViewDetailsClicked,
    adminTaskEditClicked,
    adminTaskActivateClicked,
    adminTaskActivateComplete,
    adminTaskActivateFailed,
    adminTaskDeactivateClicked,
    adminTaskDeactivateComplete,
    adminTaskDeactivateFailed,
    adminTaskDeleteClicked,
    adminTaskDeleteComplete,
    adminTaskDeleteFailed,
    adminTaskDeleteCancelled,
    adminTasksRefreshClicked,
    adminTasksSearchPerformed,
    adminTaskApproveClicked,
    adminTaskApproveComplete,
    adminTaskApproveFailed,
    adminTaskRejectClicked,
    adminTaskRejectComplete,
    adminTaskRejectFailed,
    adminTaskPublishClicked,
    adminTaskPublishComplete,
    adminTaskPublishFailed,
  } = useAmplitudeEvents();
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [taskToToggle, setTaskToToggle] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'published' | 'archived'>('all');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [taskToReview, setTaskToReview] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

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

  // Track page view when authorized
  const hasTrackedPageView = useRef(false);
  useEffect(() => {
    if (isAuthorized && !isLoadingTasks && !hasTrackedPageView.current) {
      adminTasksPageViewed({ total_tasks: tasks.length });
      hasTrackedPageView.current = true;
    }
  }, [isAuthorized, isLoadingTasks, tasks.length, adminTasksPageViewed]);

  const handleRefresh = async () => {
    adminTasksRefreshClicked();
    try {
      await fetchAllTasks(true);
      toast.success("Tasks refreshed!");
    } catch {
      toast.error("Failed to refresh tasks");
    }
  };

  const handleDeleteClick = (task: Task) => {
    adminTaskDeleteClicked({ task_id: task.id, task_title: task.title });
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete?.id) return;

    const success = await deleteTask(taskToDelete.id);
    if (success) {
      adminTaskDeleteComplete({ task_id: taskToDelete.id, task_title: taskToDelete.title });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast.success("Task deleted successfully");
    } else {
      adminTaskDeleteFailed({ task_id: taskToDelete.id, error_message: "Failed to delete task" });
      toast.error("Failed to delete task");
    }
  };

  const handleCancelDelete = () => {
    if (taskToDelete?.id) {
      adminTaskDeleteCancelled({ task_id: taskToDelete.id });
    }
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleViewDetails = (task: Task) => {
    adminTaskViewDetailsClicked({ task_id: task.id, task_title: task.title });
    setTask(task);
    router.push(`/admin/tasks/${task.id}`);
  };

  const handleEditClick = (task: Task) => {
    adminTaskEditClicked({ task_id: task.id, task_title: task.title });
    setTaskToEdit(task);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    toast.success("Task updated successfully");
  };

  const handleStatusToggleClick = (task: Task) => {
    if (task.isAvailable) {
      adminTaskDeactivateClicked({ task_id: task.id, task_title: task.title });
    } else {
      adminTaskActivateClicked({ task_id: task.id, task_title: task.title });
    }
    setTaskToToggle(task);
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!taskToToggle?.id) return;

    const isCurrentlyActive = taskToToggle.isAvailable;
    // Activate = set to Published (only for approved tasks). Deactivate = set to Approved and isAvailable false.
    const payload = isCurrentlyActive
      ? { reviewStatus: 'approved' as const, isAvailable: false }
      : { reviewStatus: 'published' as const };
    
    if (!isCurrentlyActive) {
      adminTaskPublishClicked({ task_id: taskToToggle.id, task_title: taskToToggle.title });
    }
    
    const success = await updateTask(taskToToggle.id, payload);
    if (success) {
      if (!isCurrentlyActive) {
        adminTaskPublishComplete({ 
          task_id: taskToToggle.id,
          task_title: taskToToggle.title,
        });
        adminTaskActivateComplete({ task_id: taskToToggle.id });
      } else {
        adminTaskDeactivateComplete({ task_id: taskToToggle.id });
      }
      setStatusDialogOpen(false);
      setTaskToToggle(null);
      toast.success(isCurrentlyActive ? 'Task unpublished' : 'Task published');
    } else {
      if (!isCurrentlyActive) {
        adminTaskPublishFailed({ 
          task_id: taskToToggle.id,
          task_title: taskToToggle.title,
          error_message: "Failed to publish task",
        });
        adminTaskActivateFailed({ task_id: taskToToggle.id, error_message: "Failed to publish task" });
      } else {
        adminTaskDeactivateFailed({ task_id: taskToToggle.id, error_message: "Failed to unpublish task" });
      }
      toast.error('Failed to update task status');
    }
  };

  const handleCancelStatusToggle = () => {
    setStatusDialogOpen(false);
    setTaskToToggle(null);
  };

  const handleReviewClick = (task: Task, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      adminTaskApproveClicked({ task_id: task.id, task_title: task.title });
    } else {
      adminTaskRejectClicked({ task_id: task.id, task_title: task.title });
    }
    setTaskToReview(task);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = async (rejectionReasons?: number[]) => {
    if (!taskToReview?.id || !reviewAction) return;

    const updateData: any = { reviewStatus: reviewAction === 'approve' ? 'approved' : 'rejected' };
    
    // Include rejection reasons if rejecting
    if (reviewAction === 'reject' && rejectionReasons && rejectionReasons.length > 0) {
      updateData.reasonsForRejection = rejectionReasons;
    }
    
    // Clear rejection reasons if approving
    if (reviewAction === 'approve') {
      updateData.reasonsForRejection = [];
    }

    const success = await updateTask(taskToReview.id, updateData);
    if (success) {
      if (reviewAction === 'approve') {
        adminTaskApproveComplete({ 
          task_id: taskToReview.id, 
          task_title: taskToReview.title,
        });
      } else {
        adminTaskRejectComplete({ 
          task_id: taskToReview.id, 
          task_title: taskToReview.title,
          rejection_reasons_count: rejectionReasons?.length || 0,
        });
      }
      setReviewDialogOpen(false);
      setTaskToReview(null);
      setReviewAction(null);
      toast.success(`Task ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
    } else {
      if (reviewAction === 'approve') {
        adminTaskApproveFailed({ 
          task_id: taskToReview.id, 
          task_title: taskToReview.title,
          error_message: "Failed to approve task",
        });
      } else {
        adminTaskRejectFailed({ 
          task_id: taskToReview.id, 
          task_title: taskToReview.title,
          error_message: "Failed to reject task",
        });
      }
      toast.error(`Failed to ${reviewAction} task`);
    }
  };

  const handleCancelReview = () => {
    setReviewDialogOpen(false);
    setTaskToReview(null);
    setReviewAction(null);
  };

  const getReviewStatusBadge = (reviewStatus: string | null | undefined) => {
    switch (reviewStatus) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-0">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">Approved</Badge>;
      case 'published':
        return <Badge className="bg-[#5C29A3]/10 text-[#5C29A3] hover:bg-[#5C29A3]/20 border-0">Published</Badge>;
      case 'archived':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-0">Archived</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">Rejected</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  const getTaskTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'fillAForm': return 'Fill a Form';
      case 'checkOutApp': return 'Check Out App';
      case 'doVideoInterview': return 'Video Interview';
      default: return type || 'N/A';
    }
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return 'N/A';
    try {
      const ts = timestamp as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds || ts._seconds;
      if (seconds) {
        return new Date(seconds * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        });
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  // Track search with debouncing
  useEffect(() => {
    if (searchQuery.length > 0) {
      const timeoutId = setTimeout(() => {
        adminTasksSearchPerformed({ search_query: searchQuery });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, adminTasksSearchPerformed]);

  // Filter tasks based on search query and review status
  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (task.title?.toLowerCase().includes(query)) ||
      (task.id?.toLowerCase().includes(query)) ||
      (task.category?.toLowerCase().includes(query)) ||
      (task.rezTaskMasterEmailAddress?.toLowerCase().includes(query))
    );
    const matchesReviewFilter = reviewFilter === 'all' || task.reviewStatus === reviewFilter;
    return matchesSearch && matchesReviewFilter;
  });

  // Sort by creation date (newest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const getTime = (ts: unknown) => {
      const timestamp = ts as { seconds?: number; _seconds?: number };
      return (timestamp?.seconds || timestamp?._seconds || 0) * 1000;
    };
    return getTime(b.timeCreated) - getTime(a.timeCreated);
  });

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
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Admin Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  All Tasks
                </h1>
              </div>
              <p className="text-muted-foreground">
                View and manage all tasks in the system ({tasks.length} total)
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoadingTasks}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingTasks ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex gap-2 items-center flex-wrap max-w-md flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, ID, or creator email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant={reviewFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReviewFilter('all')}
            >
              All
            </Button>
            <Button
              variant={reviewFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReviewFilter('pending')}
              className={reviewFilter === 'pending' ? '' : 'text-yellow-700 border-yellow-300 hover:bg-yellow-50'}
            >
              Pending
            </Button>
            <Button
              variant={reviewFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReviewFilter('approved')}
              className={reviewFilter === 'approved' ? '' : 'text-green-700 border-green-300 hover:bg-green-50'}
            >
              Approved
            </Button>
            <Button
              variant={reviewFilter === 'published' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReviewFilter('published')}
              className={reviewFilter === 'published' ? '' : 'text-[#5C29A3] border-[#5C29A3]/40 hover:bg-[#5C29A3]/5'}
            >
              Published
            </Button>
            <Button
              variant={reviewFilter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReviewFilter('archived')}
              className={reviewFilter === 'archived' ? '' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}
            >
              Archived
            </Button>
            <Button
              variant={reviewFilter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReviewFilter('rejected')}
              className={reviewFilter === 'rejected' ? '' : 'text-red-700 border-red-300 hover:bg-red-50'}
            >
              Rejected
            </Button>
            <AlgoliaAttribution />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingTasks && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingTasks && sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {searchQuery ? "No tasks match your search" : "No tasks found"}
            </p>
          </div>
        )}

        {/* Tasks Table */}
        {!isLoadingTasks && sortedTasks.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[50px] font-semibold">#</TableHead>
                  <TableHead className="font-semibold min-w-[250px]">Title</TableHead>
                  <TableHead className="font-semibold">Creator</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Review</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Target</TableHead>
                  <TableHead className="text-right font-semibold">Reward</TableHead>
                  <TableHead className="font-semibold w-[100px]">Created</TableHead>
                  <TableHead className="font-semibold w-[100px]">Expires on</TableHead>
                  <TableHead className="w-[100px] text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task, index) => (
                  <TableRow key={task.id} className="hover:bg-muted/20">
                    <TableCell className="text-muted-foreground text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewDetails(task)}
                        className="text-left group"
                      >
                        <div className="max-w-[250px] truncate font-medium group-hover:text-primary transition-colors" title={task.title || ''}>
                          {task.title || 'Untitled Task'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={task.id || ''}>
                          {task.id}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]" title={task.rezTaskMasterEmailAddress || ''}>
                        {task.rezTaskMasterEmailAddress || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {getTaskTypeLabel(task.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getReviewStatusBadge(task.reviewStatus)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={task.isAvailable ? "default" : "secondary"}
                        className={task.isAvailable ? "bg-[#EFECFD] text-[#5C29A3] hover:bg-[#EFECFD]/80 border-0" : ""}
                      >
                        {task.isAvailable ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {task.targetNumberOfParticipants || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const token = getTokenInfo(task.rewardCurrencyId);
                        const amount = task.rewardAmountPerParticipant || 0;
                        return (
                          <div className="flex items-center justify-end gap-1.5">
                            {token?.imagePath && (
                              <Image
                                src={token.imagePath}
                                alt={token.name}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            )}
                            <span className="tabular-nums">
                              {token ? `${token.symbol} ${amount}` : `$${amount}`}
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimestamp(task.timeCreated)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.deadline != null ? formatTimestamp(task.deadline) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(task)}
                            className="cursor-pointer"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditClick(task)}
                            className="cursor-pointer"
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {task.reviewStatus === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleReviewClick(task, 'approve')}
                                className="cursor-pointer text-green-700"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReviewClick(task, 'reject')}
                                className="cursor-pointer text-red-700"
                              >
                                <XMarkIcon className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusToggleClick(task)}
                            className="cursor-pointer"
                            disabled={task.reviewStatus === 'archived' || (task.reviewStatus !== 'approved' && task.reviewStatus !== 'published')}
                          >
                            <PowerIcon className={`h-4 w-4 mr-2 ${task.isAvailable ? '' : 'opacity-50'}`} />
                            {task.isAvailable ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(task)}
                            variant="destructive"
                            className="cursor-pointer"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Showing {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
            {hasMoreTasks && ' (more available)'}
          </p>
          {hasMoreTasks && (
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
                'Load more'
              )}
            </Button>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{taskToDelete?.title || 'this task'}&quot;? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Toggle Confirmation Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {taskToToggle?.isAvailable ? 'Unpublish Task' : 'Publish Task'}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {taskToToggle?.isAvailable ? 'unpublish' : 'publish'} &quot;{taskToToggle?.title || 'this task'}&quot;?
                {taskToToggle?.isAvailable
                  ? ' The task will move back to Approved and no longer be active for participants.'
                  : ' The task will be marked as Published. This does not automatically activate the task or change its availability.'
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelStatusToggle}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant={taskToToggle?.isAvailable ? "secondary" : "default"}
                onClick={handleConfirmStatusToggle}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : taskToToggle?.isAvailable ? 'Unpublish' : 'Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <AdminEditTaskDialog
          task={taskToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />

        {/* Review Confirmation Dialog */}
        {reviewAction === 'approve' ? (
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Task</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve &quot;{taskToReview?.title || 'this task'}&quot;?
                  The task will be marked as Approved. It will not be visible to participants until it is published.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCancelReview}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleConfirmReview()}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : 'Approve'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <AdminRejectTaskDialog
            task={taskToReview}
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            onConfirm={(reasons) => handleConfirmReview(reasons)}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </div>
  );
}

