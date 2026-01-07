"use client";

import { useEffect, useState } from "react";
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
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import AdminEditTaskDialog from "@/components/admin/AdminEditTaskDialog";
import { getTokenInfo } from "@/utils/currencies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AdminTasksPage() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const { 
    tasks, 
    isLoadingTasks,
    isDeleting,
    isUpdating,
    fetchAllTasks,
    deleteTask,
    updateTask,
    error 
  } = useAdminStore();
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [taskToToggle, setTaskToToggle] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        router.push("/dashboard");
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

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete?.id) return;
    
    const success = await deleteTask(taskToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast.success("Task deleted successfully");
    } else {
      toast.error("Failed to delete task");
    }
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    toast.success("Task updated successfully");
  };

  const handleStatusToggleClick = (task: Task) => {
    setTaskToToggle(task);
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!taskToToggle?.id) return;
    
    const newStatus = !taskToToggle.isAvailable;
    const success = await updateTask(taskToToggle.id, { isAvailable: newStatus });
    if (success) {
      setStatusDialogOpen(false);
      setTaskToToggle(null);
      toast.success(`Task ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } else {
      toast.error('Failed to update task status');
    }
  };

  const handleCancelStatusToggle = () => {
    setStatusDialogOpen(false);
    setTaskToToggle(null);
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

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase();
    return (
      (task.title?.toLowerCase().includes(query)) ||
      (task.id?.toLowerCase().includes(query)) ||
      (task.category?.toLowerCase().includes(query)) ||
      (task.rezTaskMasterEmailAddress?.toLowerCase().includes(query))
    );
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
    return null; // Will redirect
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

        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, ID, category, or creator email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                  <TableHead className="font-semibold min-w-[150px]">Title</TableHead>
                  <TableHead className="font-semibold">Creator</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Target</TableHead>
                  <TableHead className="text-right font-semibold">Reward</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
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
                      <div className="max-w-[180px] truncate font-medium" title={task.title || ''}>
                        {task.title || 'Untitled Task'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={task.id || ''}>
                        {task.id}
                      </div>
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
                      <Badge variant="outline" className="font-normal">
                        {task.category || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={task.isAvailable ? "default" : "secondary"}
                        className={task.isAvailable ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-0" : ""}
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
                            onClick={() => handleEditClick(task)}
                            className="cursor-pointer"
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusToggleClick(task)}
                            className="cursor-pointer"
                          >
                            <PowerIcon className={`h-4 w-4 mr-2 ${task.isAvailable ? '' : 'opacity-50'}`} />
                            {task.isAvailable ? 'Deactivate' : 'Activate'}
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

        <p className="text-sm text-muted-foreground text-center">
          Showing {sortedTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>

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
                onClick={() => setDeleteDialogOpen(false)}
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
                {taskToToggle?.isAvailable ? 'Deactivate Task' : 'Activate Task'}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {taskToToggle?.isAvailable ? 'deactivate' : 'activate'} &quot;{taskToToggle?.title || 'this task'}&quot;?
                {taskToToggle?.isAvailable 
                  ? ' Users will no longer be able to complete this task.'
                  : ' This task will become available for users to complete.'
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
                ) : taskToToggle?.isAvailable ? 'Deactivate' : 'Activate'}
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
      </div>
    </div>
  );
}

