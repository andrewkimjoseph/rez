"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithAuthRetry } from "@/lib/api-fetch";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const { 
    tasks, 
    taskMasters, 
    isLoadingTasks, 
    isLoadingTaskMasters,
    fetchAllTasks,
    fetchAllTaskMasters,
    error 
  } = useAdminStore();
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [taskCompletionsCount, setTaskCompletionsCount] = useState<number | null>(null);
  const [isLoadingCompletionsCount, setIsLoadingCompletionsCount] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      if (user.isSuperAdmin) {
        setIsAuthorized(true);
        // Short delay so AuthHydrator can set cookie before first fetch (avoids race on load)
        const t = setTimeout(() => {
          fetchAllTasks();
          fetchAllTaskMasters();
          setIsLoadingCompletionsCount(true);
          fetchWithAuthRetry('/api/admin/activeTaskCompletionsCount')
            .then((res) => res.json())
            .then((data) => {
              if (typeof data.count === 'number') setTaskCompletionsCount(data.count);
            })
            .catch(() => {})
            .finally(() => setIsLoadingCompletionsCount(false));
        }, 150);
        return () => clearTimeout(t);
      } else {
        setIsAuthorized(false);
      }
    } else if (isHydrated && !user) {
      router.push("/sign-in");
    }
  }, [isHydrated, user, router, fetchAllTasks, fetchAllTaskMasters]);

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchAllTasks(true), fetchAllTaskMasters(true)]);
      toast.success("Data refreshed successfully!");
    } catch {
      toast.error("Failed to refresh data");
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AdminAccessDenied />;
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = isLoadingTasks || isLoadingTaskMasters;

  // Calculate stats
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.isAvailable === true).length;
  const totalTaskMasters = taskMasters.length;
  const superAdmins = taskMasters.filter(tm => (tm as TaskMaster & { isSuperAdmin?: boolean }).isSuperAdmin === true).length;

  interface TaskMaster {
    isSuperAdmin?: boolean;
  }

  const stats = [
    {
      title: "Total Tasks",
      description: "All tasks in the system",
      value: totalTasks,
      icon: ClipboardDocumentListIcon,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
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
      title: "Task Masters",
      description: "Registered researchers",
      value: totalTaskMasters,
      icon: UsersIcon,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      title: "Super Admins",
      description: "System administrators",
      value: superAdmins,
      icon: ShieldCheckIcon,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheckIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage all tasks and task masters across the platform.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
          <h2 className="text-lg font-semibold text-foreground">Admin Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/admin/tasks" className="group">
              <Card className="enterprise-card border-0 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Manage All Tasks
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      View, edit, and delete any task in the system with full field access
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/task-masters" className="group">
              <Card className="enterprise-card border-0 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/15 transition-colors">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      Manage Task Masters
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      View and edit task master profiles, manage admin permissions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/task-completions" className="group">
              <Card className="enterprise-card border-0 h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/15 transition-colors">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors">
                      Manage Task Completions
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Validate or invalidate participant completions for active tasks
                    </p>
                    {isLoadingCompletionsCount ? (
                      <Skeleton className="h-6 w-12 mt-1" />
                    ) : taskCompletionsCount != null ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {taskCompletionsCount.toLocaleString()} total
                      </p>
                    ) : null}
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

