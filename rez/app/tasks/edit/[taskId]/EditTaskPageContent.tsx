"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useNewTaskStore } from "@/stores/new-task-store";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function EditTaskPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = params?.taskId as string;
  const { user } = useTaskMasterStore();
  const { tasks, isLoading } = useTasksStore();
  const { loadTaskForEdit, hydratePollQuestions, setStep } = useNewTaskStore();
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

    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      setError("Task not found");
      return;
    }

    if (task.rezTaskMasterEmailAddress !== user.emailAddress) {
      setError("You don't have permission to edit this task");
      return;
    }

    const run = async () => {
      let canEdit = task.reviewStatus === "rejected";

      if (task.type === "answerPoll") {
        try {
          const response = await fetch(`/api/pollContent/${taskId}`);
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || "Failed to load poll content");
          }
          const content = await response.json();
          canEdit = canEdit || content.canEditQuestions === true;

          if (!canEdit) {
            setError(
              content.responseCount > 0
                ? "Poll questions can't be changed after responses have been received"
                : "This poll cannot be edited",
            );
            return;
          }

          loadTaskForEdit(task);
          hydratePollQuestions(content.pollQuestions);
          const focusPoll = searchParams.get("focus") === "poll";
          setStep(focusPoll || task.reviewStatus !== "rejected" ? 4 : 1);
          router.push("/tasks?tab=create");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load poll");
        }
        return;
      }

      if (!canEdit) {
        setError("Only rejected tasks can be edited");
        return;
      }

      loadTaskForEdit(task);
      router.push("/tasks?tab=create");
    };

    run();
  }, [
    taskId,
    user,
    tasks,
    isLoading,
    router,
    loadTaskForEdit,
    hydratePollQuestions,
    setStep,
    searchParams,
  ]);

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
