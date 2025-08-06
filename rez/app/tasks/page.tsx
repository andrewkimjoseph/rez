"use client";

import React from "react";
import { TaskStep } from "@/stores/new-task-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import NewTask from "@/components/new-task/tab-component/NewTask";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock } from "lucide-react";
import { useTasksStore } from "@/stores/tasks-store";
import { useRefreshStore } from "@/stores/refresh-store";
import { useState, useEffect } from "react";
import ViewTasks from "@/components/view-task/tab-component/tab-component/ViewAllTasks";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";


export default function Tasks() {
  const [selectedTab, setSelectedTab] = React.useState("create");
  const { fetchTasksAndCompletions, isLoading } = useTasksStore();
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
        return "Create a new task.";
      case "view-tasks":
        return "View and manage all your created tasks.";
      default:
        return "";
    }
  };

  const handleRefresh = async () => {
    refreshClicked({
      route: "/tasks",
    });

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
    <div className="min-h-screen pb-20 sm:p-4 font-[family-name:var(--font-sen)] p-4">
      <Toaster />
      <div
        className={`w-full ${
          selectedTab === "view-tasks" ? "max-w-7xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground">{getSubtitle()}</p>
          </div>
          {selectedTab === "view-tasks" && (
            <Button
              onClick={handleRefresh}
              disabled={
                isLoading || (isHydrated && !tasksRefreshStatus.canRefresh)
              }
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              title={
                isHydrated && !tasksRefreshStatus.canRefresh
                  ? `Wait ${tasksRefreshStatus.formattedTime}`
                  : ""
              }
            >
              {isHydrated && !tasksRefreshStatus.canRefresh ? (
                <Clock className="h-4 w-4" />
              ) : (
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              )}
              {isHydrated && !tasksRefreshStatus.canRefresh
                ? `Refresh after ${tasksRefreshStatus.formattedTime}`
                : "Refresh"}
            </Button>
          )}
        </div>
        <Tabs
          defaultValue="create"
          className="w-full mb-6"
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
          <TabsList className="bg-white">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-[#363062] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#363062] px-6 py-2"
            >
              Create New Task
            </TabsTrigger>

            <TabsTrigger
              value="view-tasks"
              className="data-[state=active]:bg-[#363062] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#363062] px-6 py-2"
            >
              View Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <NewTask />
          </TabsContent>

          <TabsContent value="view-tasks">
            <ViewTasks />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
