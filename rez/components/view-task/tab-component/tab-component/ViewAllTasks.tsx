"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
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
import { Trash2 } from "lucide-react";

export default function ViewTasks() {
  const { tasks, taskCompletions, isLoading, error, refetch } = useTasksData({ autoFetch: false });
  const { deleteTask, isDeleting } = useTasksStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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
      // Refresh tasks data from server
      await refetch();
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  // Format task type for display
  const getTaskTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'fillAForm':
        return 'Fill a Form';
      case 'checkOutApp':
        return 'Check Out App';
      case 'doVideoInterview':
        return 'Do Video Interview';
      default:
        return type || 'N/A';
    }
  };

  // Calculate task completions for each task
  const getTaskCompletionsCount = (taskId: string | null) => {
    if (!taskId) return 0;
    return taskCompletions.filter(completion => completion.taskId === taskId).length;
  };

  // Check if task is complete based on target participants
  const isTaskComplete = (task: Task) => {
    const completionsCount = getTaskCompletionsCount(task.id);
    const target = task.targetNumberOfParticipants || 0;
    return target > 0 && completionsCount >= target;
  };

  // Sort tasks by deadline (latest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    // Handle Firestore timestamp with _seconds
    const getDeadlineTime = (deadline: any) => {
      if (!deadline) return 0;
      if (deadline._seconds && typeof deadline._seconds === 'number') {
        return deadline._seconds * 1000;
      } else if (deadline.seconds && typeof deadline.seconds === 'number') {
        return deadline.seconds * 1000;
      } else if (deadline.toDate && typeof deadline.toDate === 'function') {
        return deadline.toDate().getTime();
      }
      return 0;
    };
    
    const deadlineA = getDeadlineTime(a.deadline);
    const deadlineB = getDeadlineTime(b.deadline);
    return deadlineB - deadlineA; // Latest first
  });

  // Simple timestamp formatter
  const formatTaskTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firestore timestamp with seconds (with or without underscore)
      if (timestamp.seconds && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp._seconds && typeof timestamp._seconds === 'number') {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-500">No tasks found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      
      <Table>
        <TableCaption>A list of all your tasks.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">#</TableHead>
            <TableHead className="w-[350px]">Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[200px]">Time Created</TableHead>
            <TableHead className="text-right">Target Participants</TableHead>
            <TableHead className="text-right">Total Completions</TableHead>
            <TableHead>Complete</TableHead>
            <TableHead className="w-[80px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task, index) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium text-center">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">
                <div className="max-w-[350px] truncate" title={task.title || ''}>
                  {task.title || 'Untitled Task'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {getTaskTypeLabel(task.type)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={task.isAvailable ? "default" : "destructive"}
                  className="text-xs"
                >
                  {task.isAvailable ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {formatTaskTimestamp(task.timeCreated)}
              </TableCell>
              <TableCell className="text-right">
                {task.targetNumberOfParticipants || 0}
              </TableCell>
              <TableCell className="text-right">
                {getTaskCompletionsCount(task.id)}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={isTaskComplete(task) ? "default" : "secondary"}
                  className="text-xs"
                >
                  {isTaskComplete(task) ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(task)}
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 