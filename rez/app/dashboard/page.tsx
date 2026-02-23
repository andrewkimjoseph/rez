"use client";

import {
  ArrowPathIcon,
  ArrowRightIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

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
import { useRouter } from "next/navigation";
import { useTasksData } from "@/hooks/use-tasks-data";
import { useRefreshStore } from "@/stores/refresh-store";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { ResourceCard } from "@/components/resource-card";
import { resources, type Resource } from "@/data/resources";
import { downloadResourceBySlug } from "@/lib/client-storage";

export default function Dashboard() {
  const router = useRouter();
  const { tasks, taskCompletions, completionStats, isLoading, error, refetch } = useTasksData({ autoFetch: false });
  const { checkCanRefresh, updateRefreshTime } = useRefreshStore();
  const [, forceUpdate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [resourceLoading, setResourceLoading] = useState<string | null>(null);
  const { refreshClicked, playbookDownloadClicked, guideDownloadClicked } = useAmplitudeEvents();

  // Calculate counts (Total Completions uses same definition as admin task-completions filter "All")
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(task => task.isAvailable === true).length;
  const totalTaskCompletions = completionStats?.totalCount ?? taskCompletions.length;

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
      await refetch(true);
      updateRefreshTime();
      toast.success("Dashboard data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh dashboard data");
    }
  };

  const handleResourceDownload = async (resource: Resource) => {
    if (resourceLoading) return;
    setResourceLoading(resource.id);
    const toastId = `download-${resource.id}`;
    toast.loading("Downloading…", { id: toastId });
    try {
      if (resource.downloadSlug === "playbook") {
        playbookDownloadClicked({
          file_name: resource.downloadFilename,
          file_size_mb: 77,
          source: "dashboard",
        });
      } else {
        guideDownloadClicked({
          file_name: resource.downloadFilename,
          file_size_mb: 9,
          source: "dashboard",
        });
      }
      await downloadResourceBySlug(resource.downloadSlug, resource.downloadFilename);
      toast.success("Download started", { id: toastId, duration: 2500 });
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error(error instanceof Error ? error.message : "Failed to download", { id: toastId });
    } finally {
      setResourceLoading(null);
    }
  };

  const stats = [
    {
      title: "Total Tasks",
      description: "All time created",
      value: totalTasks,
      icon: ClipboardDocumentListIcon,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      href: "/tasks?tab=view-tasks",
    },
    {
      title: "Active Tasks",
      description: "Currently available",
      value: activeTasks,
      icon: ChartBarIcon,
      iconBg: "bg-[#EFECFD]",
      iconColor: "text-[#5C29A3]",
    },
    {
      title: "Total Completions",
      description: "Across all tasks",
      value: totalTaskCompletions,
      icon: CheckCircleIcon,
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
              <ClockIcon className="h-4 w-4 mr-2" />
            ) : (
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
          {stats.map((stat) => {
            const handleClick = stat.href ? () => {
              router.push(stat.href!);
            } : undefined;

            return (
              <Card
                key={stat.title}
                onClick={handleClick}
                className={`enterprise-card border border-border/50 ${stat.href ? "transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer group" : ""}`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {stat.description}
                    </CardDescription>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.iconBg} shrink-0 ${stat.href ? "group-hover:scale-105 transition-transform" : ""}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-10 w-24 rounded" />
                  ) : (
                    <p className="text-3xl font-semibold tracking-tight text-foreground">
                      {stat.value.toLocaleString()}
                    </p>
                  )}
                  {stat.href && (
                    <p className="text-xs text-primary mt-2 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View tasks <ArrowRightIcon className="h-3 w-3" />
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resources Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Resources</h2>
            <Link
              href="/resources"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1 w-fit"
            >
              View all resources <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.slice(0, 3).map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onDownload={handleResourceDownload}
                isLoading={resourceLoading === resource.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
