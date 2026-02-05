"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useNewTaskStore } from "@/stores/new-task-store";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export const runtime = 'edge';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;
  const { user } = useTaskMasterStore();
  const { tasks, isLoading } = useTasksStore();
  const { loadTaskForEdit } = useNewTaskStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setError("Task ID is required");
      return;
    }

    if (!user?.emailAddress) {
      router.push("/sign-in");
      return;
    }

    if (isLoading) {
      return;
    }

    // Find the task
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      setError("Task not found");
      return;
    }

    // Verify task belongs to current user
    if (task.rezTaskMasterEmailAddress !== user.emailAddress) {
      setError("You don't have permission to edit this task");
      return;
    }

    // Verify task is rejected
    if (task.reviewStatus !== "rejected") {
      setError("Only rejected tasks can be edited");
      return;
    }

    // Load task into store and redirect to creation flow with create tab
    loadTaskForEdit(task);
    router.push("/tasks?tab=create");
  }, [taskId, user, tasks, isLoading, router, loadTaskForEdit]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Loading task...</p>
      </div>
    </div>
  );
}
