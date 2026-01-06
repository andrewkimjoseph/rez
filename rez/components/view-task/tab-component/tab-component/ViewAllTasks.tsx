"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task } from "@/firebase/firestore/models/Task";
import { useTasksStore } from "@/stores/tasks-store";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import {
  TrashIcon,
  XCircleIcon,
  ArrowPathIcon,
  PowerIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import EditTaskDialog from "../../EditTaskDialog";
import { toast } from "sonner";

export default function ViewTasks() {
  const { tasks, taskCompletions, isLoading, error, refetch } = useTasksData({ autoFetch: false });
  const { deleteTask, isDeleting, updateTaskStatus, isUpdatingStatus } = useTasksStore();
  const user = useTaskMasterStore((state) => state.user);
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [taskToToggle, setTaskToToggle] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = async () => {
    await refetch();
  };

  const handleStatusToggleClick = (task: Task) => {
    setTaskToToggle(task);
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!taskToToggle?.id) return;
    
    const newStatus = !taskToToggle.isAvailable;
    const success = await updateTaskStatus(taskToToggle.id, newStatus);
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

  const handleConfirmDelete = async () => {
    if (!taskToDelete?.id) return;
    
    const success = await deleteTask(taskToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      await refetch();
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

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
              <TableHead className="font-semibold min-w-[150px]">Title</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Target</TableHead>
              <TableHead className="text-right font-semibold">Completions</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="w-[120px] text-center font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task, index) => (
              <TableRow key={task.id} className="hover:bg-muted/20">
                <TableCell className="text-muted-foreground text-center">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="max-w-[180px]">
                    <div className="font-medium truncate" title={task.title || ''}>
                      {task.title || 'Untitled Task'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5" title={task.id || ''}>
                      {task.id || 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {task.category || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {getTaskTypeLabel(task.type)}
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
                <TableCell className="text-right tabular-nums font-medium">
                  {getTaskCompletionsCount(task.id)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTaskTimestamp(task.timeCreated)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => handleEditClick(task)}
                        title="Edit task"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${task.isAvailable 
                        ? 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10' 
                        : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
                      }`}
                      onClick={() => handleStatusToggleClick(task)}
                      title={task.isAvailable ? 'Deactivate task' : 'Activate task'}
                    >
                      <PowerIcon className={`h-4 w-4 ${task.isAvailable ? '' : 'opacity-50'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(task)}
                      title="Delete task"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant={taskToToggle?.isAvailable ? "secondary" : "default"}
              onClick={handleConfirmStatusToggle}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
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
      <EditTaskDialog
        task={taskToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
