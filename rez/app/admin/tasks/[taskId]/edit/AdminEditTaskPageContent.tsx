"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { useSelectedTaskStore } from "@/stores/selected-task-store";
import { Task } from "@/firebase/firestore/models/Task";
import AdminEditTaskForm from "@/components/admin/AdminEditTaskForm";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { ArrowLeftIcon, ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

const VALID_TABS = new Set(["basic", "content", "rewards", "settings"]);

export default function AdminEditTaskPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = params?.taskId as string;
  const fromDetail = searchParams.get("from") === "detail";
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "basic";

  const { user } = useTaskMasterStore();
  const { tasks, isLoadingTasks, fetchAllTasks } = useAdminStore();
  const { setTask } = useSelectedTaskStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [task, setLocalTask] = useState<Task | null>(null);

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

  useEffect(() => {
    if (tasks.length > 0 && taskId) {
      const foundTask = tasks.find((t) => t.id === taskId) ?? null;
      setLocalTask(foundTask);
      if (foundTask) {
        setTask(foundTask);
      }
    }
  }, [tasks, taskId, setTask]);

  const handleCancel = () => {
    if (fromDetail) {
      router.push(`/admin/tasks/${taskId}`);
    } else {
      router.push("/admin/tasks");
    }
  };

  const handleSuccess = async (updatedTask?: Task) => {
    if (updatedTask) {
      setTask(updatedTask);
    }
    await fetchAllTasks(true, true);
    toast.success("Task updated successfully");
    router.push(`/admin/tasks/${taskId}`);
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

  if (isLoadingTasks && !task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Link
            href={fromDetail ? `/admin/tasks/${taskId}` : "/admin/tasks"}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">
              {fromDetail ? "Back to task" : "Back to all tasks"}
            </span>
          </Link>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Task not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              The task you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-4">
        <Link
          href={fromDetail ? `/admin/tasks/${taskId}` : "/admin/tasks"}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm">
            {fromDetail ? "Back to task" : "Back to all tasks"}
          </span>
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Edit task
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{task.id}</p>
        </div>

        <AdminEditTaskForm
          task={task}
          defaultTab={defaultTab}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
