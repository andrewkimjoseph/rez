"use client";

import { PlusIcon, FileIcon, RefreshCw, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCompletionsOverTime } from "@/components/task-completions-over-time";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTasksData } from "@/hooks/use-tasks-data";
import { useRefreshStore } from "@/stores/refresh-store";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function Dashboard() {
  const { tasks, taskCompletions, isLoading, error, refetch } = useTasksData();
  const { checkCanRefresh, updateRefreshTime } = useRefreshStore();
  const [, forceUpdate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const { refreshClicked } = useAmplitudeEvents();
  // Calculate counts
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(task => task.isAvailable === true).length;
  const totalTaskCompletions = taskCompletions.length;

  // Check if refresh is available (updated every second)
  const dashboardRefreshStatus = checkCanRefresh();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Force re-render every second when on cooldown
  useEffect(() => {
    if (isHydrated && !dashboardRefreshStatus.canRefresh) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isHydrated, dashboardRefreshStatus.canRefresh]);

  const handleRefresh = async () => {
    refreshClicked({
      route: "/dashboard",
    });
    if (!dashboardRefreshStatus.canRefresh) {
      toast.error(`Please wait ${dashboardRefreshStatus.formattedTime} before refreshing again.`);
      return;
    }
    try {
      await refetch();
      updateRefreshTime();
      toast.success("Dashboard data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh dashboard data");
    }
  };
  return (
    <div className="min-h-screen pb-20 sm:p-4 font-[family-name:var(--font-sen)] p-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold pb-2">Dashboard Overview</h1>
            <p>Monitor your tasks and task completions at a glance.</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading || (isHydrated && !dashboardRefreshStatus.canRefresh)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title={isHydrated && !dashboardRefreshStatus.canRefresh ? `Wait ${dashboardRefreshStatus.formattedTime}` : ''}
          >
            {isHydrated && !dashboardRefreshStatus.canRefresh ? (
              <Clock className="h-4 w-4" />
            ) : (
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            )}
            {isHydrated && !dashboardRefreshStatus.canRefresh 
              ? `Refresh after ${dashboardRefreshStatus.formattedTime}` 
              : 'Refresh'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading data: {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 w-4/6">

        <Card className="flex-1 min-w-[250px] basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1.333rem)] max-w-full">
            <CardHeader>
              <CardTitle>Total Tasks</CardTitle>
              <CardDescription>Ever created</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[32px] w-[60px]" />
              ) : (
                <p className="text-2xl font-bold">{totalTasks}</p>
              )}
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[250px] basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1.333rem)] max-w-full">
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>Marked as available</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[32px] w-[60px]" />
              ) : (
                <p className="text-2xl font-bold">{activeTasks}</p>
              )}
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[250px] basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1.333rem)] max-w-full">
            <CardHeader>
              <CardTitle>Total Task Completions</CardTitle>
              <CardDescription>Across all tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[32px] w-[60px]" />
              ) : (
                <p className="text-2xl font-bold">{totalTaskCompletions}</p>
              )}
            </CardContent>
          </Card>
  
        </div>

        <p className="text-2xl py-4">Quick Actions</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          {/* Create New Survey */}

          <Link href="/tasks">
            <Card className="flex-1 min-w-[180px] max-w-full sm:max-w-[220px] cursor-pointer transition-shadow hover:shadow-lg hover:ring-2 hover:ring-blue-200 hover:bg-blue-50">
              <CardContent className="flex flex-col items-start gap-2 py-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-1">
                  <PlusIcon className="text-blue-600" size={20} />
                </span>
                <div>
                  <div className="font-semibold text-sm mb-1">
                    Create New Task
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    Launch a new task with custom questions
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          {/* Manage Surveys */}
          {/* <Card className="flex-1 min-w-[180px] max-w-full sm:max-w-[220px] cursor-pointer transition-shadow hover:shadow-lg hover:ring-2 hover:ring-purple-200 hover:bg-purple-50">
            <CardContent className="flex flex-col items-start gap-2 py-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 mb-1">
                <FileIcon className="text-purple-600" size={20} />
              </span>
              <div>
                  <div className="font-semibold text-sm mb-1">Manage Tasks</div>
                <div className="text-xs text-muted-foreground leading-tight">Edit, duplicate or archive existing tasks</div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* <p className="text-2xl">Task Completions Over Time</p>
        <div className="h-[200px]">
          <TaskCompletionsOverTime />
        </div> */}
      </div>
    </div>
  );
}
