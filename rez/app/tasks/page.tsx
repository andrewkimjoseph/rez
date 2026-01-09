"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import NewTask from "@/components/new-task/tab-component/NewTask";
import { Button } from "@/components/ui/button";
import {
  ArrowPathIcon,
  ClockIcon,
  PlusIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useTasksStore } from "@/stores/tasks-store";
import { useRefreshStore } from "@/stores/refresh-store";
import { useState, useEffect } from "react";
import ViewTasks from "@/components/view-task/tab-component/tab-component/ViewAllTasks";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function Tasks() {
  const [selectedTab, setSelectedTab] = React.useState("create");
  const { fetchTasksAndCompletions, isLoading, tasks } = useTasksStore();
  const { checkCanRefresh, updateRefreshTime } = useRefreshStore();
  const [, forceUpdate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const { viewTasksTabClicked, createNewTaskTabClicked, refreshClicked } = useAmplitudeEvents();

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
      await fetchTasksAndCompletions();
      updateRefreshTime();
      toast.success("Tasks data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh tasks data");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className={selectedTab === "view-tasks" ? "" : "max-w-3xl"}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground mt-1">{getSubtitle()}</p>
          </div>
          {selectedTab === "view-tasks" && (
            <Button
              onClick={handleRefresh}
              disabled={isLoading || (isHydrated && !tasksRefreshStatus.canRefresh)}
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
            >
              {isHydrated && !tasksRefreshStatus.canRefresh ? (
                <ClockIcon className="h-4 w-4 mr-2" />
              ) : (
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
          <TabsList className="bg-card border border-border/50 p-1 rounded-lg h-auto mb-6">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Task
            </TabsTrigger>
            <TabsTrigger
              value="view-tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
            >
              <ListBulletIcon className="h-4 w-4 mr-2" />
              View Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-0">
            <div className="enterprise-card bg-card rounded-lg border border-border/50 p-6">
              <NewTask />
            </div>
          </TabsContent>

          <TabsContent value="view-tasks" className="mt-0">
            <div className="enterprise-card bg-card rounded-lg border border-border/50">
              <ViewTasks />
            </div>
            {selectedTab === "view-tasks" && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
