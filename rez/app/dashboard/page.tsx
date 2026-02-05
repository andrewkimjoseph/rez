"use client";

import {
  ArrowPathIcon,
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTasksData } from "@/hooks/use-tasks-data";
import { useRefreshStore } from "@/stores/refresh-store";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function Dashboard() {
  const router = useRouter();
  const { tasks, taskCompletions, isLoading, error, refetch } = useTasksData({ autoFetch: false });
  const { checkCanRefresh, updateRefreshTime } = useRefreshStore();
  const [, forceUpdate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [resourceLoading, setResourceLoading] = useState<'playbook' | 'guide' | null>(null);
  const { refreshClicked, playbookDownloadClicked, guideDownloadClicked } = useAmplitudeEvents();

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
                className={`enterprise-card border-0 ${stat.href ? 'transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer' : ''}`}
              >
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
            );
          })}
        </div>

        {/* Resources Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={async (e) => {
                e.preventDefault();
                if (resourceLoading) return;
                playbookDownloadClicked({ file_name: "rez-playbook.pdf", file_size_mb: 77 });
                setResourceLoading('playbook');
                const toastId = 'open-playbook';
                toast.loading('Opening playbook…', { id: toastId });
                try {
                  const { downloadFileFromStorage } = await import('@/lib/client-storage');
                  await downloadFileFromStorage('website_assets/playbook.pdf', 'rez-playbook.pdf');
                  toast.success('Opened in new tab', { id: toastId, duration: 2500 });
                } catch (error) {
                  console.error('Failed to download playbook:', error);
                  toast.error(error instanceof Error ? error.message : 'Failed to open playbook', { id: toastId });
                } finally {
                  setResourceLoading(null);
                }
              }}
              className={`text-left group cursor-pointer ${resourceLoading === 'playbook' ? 'pointer-events-none opacity-70' : ''}`}
            >
              <Card className="enterprise-card border-0 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer relative">
                <CardContent className="p-5 flex items-start gap-4">
                  {resourceLoading === 'playbook' && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 z-10">
                      <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Image
                      src="/covers/playbook.png"
                      alt="African Digital Finance Insights"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      African Digital Finance Insights
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Perspectives on mobile money, blockchain, and financial inclusion across Kenya and Nigeria
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div
              onClick={async (e) => {
                e.preventDefault();
                if (resourceLoading) return;
                guideDownloadClicked({ file_name: "rez-user-guide.pdf", file_size_mb: 9 });
                setResourceLoading('guide');
                const toastId = 'open-guide';
                toast.loading('Opening guide…', { id: toastId });
                try {
                  const { downloadFileFromStorage } = await import('@/lib/client-storage');
                  await downloadFileFromStorage('website_assets/guide.pdf', 'rez-user-guide.pdf');
                  toast.success('Opened in new tab', { id: toastId, duration: 2500 });
                } catch (error) {
                  console.error('Failed to download guide:', error);
                  toast.error(error instanceof Error ? error.message : 'Failed to open guide', { id: toastId });
                } finally {
                  setResourceLoading(null);
                }
              }}
              className={`text-left group cursor-pointer ${resourceLoading === 'guide' ? 'pointer-events-none opacity-70' : ''}`}
            >
              <Card className="enterprise-card border-0 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer relative">
                <CardContent className="p-5 flex items-start gap-4">
                  {resourceLoading === 'guide' && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 z-10">
                      <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Image
                      src="/covers/guide.png"
                      alt="How to Design Surveys for Quality Responses"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      How to Design Surveys for Quality Responses
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A 6-section practical guide for researchers using The Mom Test methodology
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
