"use client";

import { PlusIcon, RefreshCw, Clock, TrendingUp, CheckCircle2, ListTodo } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTasksData } from "@/hooks/use-tasks-data";
import { useRefreshStore } from "@/stores/refresh-store";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function Dashboard() {
  const { tasks, taskCompletions, isLoading, error, refetch } = useTasksData({ autoFetch: false });
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
    refreshClicked({ route: "/dashboard" });
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

  const stats = [
    {
      title: "Total Tasks",
      description: "All time created",
      value: totalTasks,
      icon: ListTodo,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Active Tasks",
      description: "Currently available",
      value: activeTasks,
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Completions",
      description: "Across all tasks",
      value: totalTaskCompletions,
      icon: CheckCircle2,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor your tasks and completions at a glance.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading || (isHydrated && !dashboardRefreshStatus.canRefresh)}
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
          >
            {isHydrated && !dashboardRefreshStatus.canRefresh ? (
              <Clock className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            )}
            {isHydrated && !dashboardRefreshStatus.canRefresh 
              ? `${dashboardRefreshStatus.formattedTime}` 
              : 'Refresh'}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error loading data: {error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="enterprise-card border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {stat.description}
                  </CardDescription>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-semibold text-foreground">
                    {stat.value.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/tasks" className="group">
              <Card className="enterprise-card border-0 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <PlusIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Create New Task
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Launch a new task with custom questions and targeting
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
