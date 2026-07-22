"use client";

import React, { Suspense, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import NewTask from "@/components/new-task/tab-component/NewTask";
import { Button } from "@/components/ui/button";
import {
  ArrowPathIcon,
  ClockIcon,
  PlusIcon,
  ListBulletIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useTasksStore } from "@/stores/tasks-store";
import { useRefreshStore } from "@/stores/refresh-store";
import { useState, useEffect } from "react";
import ViewTasks from "@/components/view-task/tab-component/tab-component/ViewAllTasks";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { useRejectedTasksCount } from "@/hooks/use-rejected-tasks-count";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function TasksContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') || 'create';
  const [selectedTab, setSelectedTab] = React.useState(tabParam);
  
  // Update selected tab when URL param changes
  useEffect(() => {
    if (tabParam) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  const { fetchTasksForList, fetchTasksAndCompletions, isLoading, isRefreshing, tasks } = useTasksStore();
  const { checkCanRefresh, updateRefreshTime } = useRefreshStore();
  const [, forceUpdate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const { 
    viewTasksTabClicked, 
    createNewTaskTabClicked, 
    refreshClicked,
    rejectionBannerDismissed,
    rejectionBannerViewTasksClicked,
    rejectedTaskEditClicked,
  } = useAmplitudeEvents();
  const { count: rejectedTasksCount, hasRejectedTasks } = useRejectedTasksCount();
  const [dismissedRejectionBanner, setDismissedRejectionBanner] = useState(false);

  const firstRejectedTaskId = useMemo(() => {
    if (rejectedTasksCount !== 1) return null;
    const rejected = tasks.find((t) => t.reviewStatus === "rejected");
    return rejected?.id ?? null;
  }, [tasks, rejectedTasksCount]);

  // Check localStorage for dismissed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('rejection-banner-dismissed') === 'true';
      setDismissedRejectionBanner(dismissed);
    }
  }, []);

  const handleDismissRejectionBanner = () => {
    setDismissedRejectionBanner(true);
    rejectionBannerDismissed({ rejected_tasks_count: rejectedTasksCount });
    if (typeof window !== 'undefined') {
      localStorage.setItem('rejection-banner-dismissed', 'true');
    }
  };

  const tasksRefreshStatus = checkCanRefresh();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Force re-render every second when on cooldown
  useEffect(() => {
    if (isHydrated && !tasksRefreshStatus.canRefresh) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isHydrated, tasksRefreshStatus.canRefresh]);

  // Fast task-list sync when opening the view tab (skips heavy completion stats)
  useEffect(() => {
    if (selectedTab === "view-tasks") {
      void fetchTasksForList();
    }
  }, [selectedTab, fetchTasksForList]);

  const tasksBusy = isLoading || isRefreshing;

  const getTitle = () => {
    switch (selectedTab) {
      case "create":
        return "Create New Task";
      case "view-tasks":
        return "View All Tasks";
      default:
        return "Create New Task";
    }
  };

  const getSubtitle = () => {
    switch (selectedTab) {
      case "create":
        return "Set up a new task with custom questions and targeting options.";
      case "view-tasks":
        return "View, manage, and track all your created tasks.";
      default:
        return "";
    }
  };

  const handleRefresh = async () => {
    refreshClicked({ route: "/tasks" });
    const currentRefreshStatus = checkCanRefresh();

    if (!currentRefreshStatus.canRefresh) {
      toast.error(
        `Please wait ${currentRefreshStatus.formattedTime} before refreshing again.`
      );
      return;
    }

    try {
      if (selectedTab === "view-tasks") {
        await fetchTasksForList(true);
      } else {
        await fetchTasksAndCompletions(true);
      }
      updateRefreshTime();
      toast.success("Tasks refreshed");
    } catch (error) {
      toast.error("Failed to refresh tasks data");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Rejection Alert Banner */}
      {hasRejectedTasks && !dismissedRejectionBanner && (
        <div className="page-column-narrow mb-6 p-4 rounded-lg border border-red-200 bg-red-50 relative">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                {rejectedTasksCount} Task{rejectedTasksCount !== 1 ? 's' : ''} Rejected
              </h3>
              <p className="text-sm text-red-700 mb-2">
                You have {rejectedTasksCount} rejected task{rejectedTasksCount !== 1 ? 's' : ''} that need{rejectedTasksCount === 1 ? 's' : ''} to be updated. 
                Please review the rejection reasons and make the necessary changes.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/tasks?tab=view-tasks" onClick={() => rejectionBannerViewTasksClicked({ rejected_tasks_count: rejectedTasksCount })}>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100">
                    View Rejected Tasks
                  </Button>
                </Link>
                {firstRejectedTaskId && (
                  <Link
                    href={`/tasks/edit/${firstRejectedTaskId}`}
                    onClick={() => rejectedTaskEditClicked({ task_id: firstRejectedTaskId })}
                  >
                    <Button size="sm" className="h-8 text-xs bg-red-600 text-white hover:bg-red-700">
                      Edit task
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={handleDismissRejectionBanner}
              className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${
          selectedTab === "view-tasks" ? "" : "page-column-narrow"
        }`}
      >
        <div className="text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground mt-1">{getSubtitle()}</p>
        </div>
        {selectedTab === "view-tasks" && (
          <Button
            onClick={handleRefresh}
            disabled={tasksBusy || (isHydrated && !tasksRefreshStatus.canRefresh)}
            variant="outline"
            size="sm"
            className="self-center sm:self-auto shrink-0"
          >
            {isHydrated && !tasksRefreshStatus.canRefresh ? (
              <ClockIcon className="h-4 w-4 mr-2" />
            ) : (
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${tasksBusy ? "animate-spin" : ""}`} />
            )}
            {isHydrated && !tasksRefreshStatus.canRefresh
              ? `${tasksRefreshStatus.formattedTime}`
              : "Refresh"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="create"
        className="w-full"
        value={selectedTab}
        onValueChange={(value) => {
          setSelectedTab(value);
          if (value === "view-tasks") {
            viewTasksTabClicked();
          } else {
            createNewTaskTabClicked();
          }
        }}
      >
        <div className="flex justify-center mb-6">
          <TabsList className="bg-card border border-border/50 p-1 rounded-lg h-auto w-fit">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Task
            </TabsTrigger>
            <TabsTrigger
              value="view-tasks"
              className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium relative"
            >
              <ListBulletIcon className="h-4 w-4 mr-2" />
              View Tasks
              {rejectedTasksCount > 0 && (
                <Badge className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full">
                  {rejectedTasksCount > 9 ? '9+' : rejectedTasksCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="create" className="mt-0">
          <div className="page-column-narrow">
            <div className="enterprise-card bg-card rounded-lg border border-border/50 p-6">
              <NewTask />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="view-tasks" className="mt-0">
          <div className="enterprise-card bg-card rounded-lg border border-border/50 overflow-hidden">
            <ViewTasks />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Tasks() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 md:p-8">
        <div className="page-column-narrow">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <TasksContent />
    </Suspense>
  );
}
