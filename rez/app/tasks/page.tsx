"use client";

import React from "react";
import { useNewTaskStore, TaskStep } from "@/stores/new-task-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Step1TaskType from "@/components/new-task/Step1TaskType";
import Step2TaskDetails from "@/components/new-task/Step2TaskDetails";
import Step4QuestionsTasks from "@/components/new-task/Step3QuestionsTasks";
import Step5Review from "@/components/new-task/Step4Review";
import { toast, Toaster } from "sonner";
import NewTask from "@/components/new-task/tab-component/NewTask";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock } from "lucide-react";
import { useTasksStore } from "@/stores/tasks-store";
import { useRefreshStore } from "@/stores/refresh-store";
import { useState, useEffect } from "react";
import ViewTasks from "@/components/view-components/tab-component/ViewAllTasks";

const stepTitles = [
  "Task Type",
  "Task Details",
  // "Targeting", // commented out
  "Questions & Tasks",
  "Review",
];

function Stepper({ step }: { step: TaskStep }) {
  // Only show 4 steps in the stepper
  return (
    <div className="flex items-center justify-between mb-6">
      {[0, 1, 2, 3].map((idx) => {
        const current = idx + 1 === step;
        const completed = idx + 1 < step;
        return (
          <div
            key={stepTitles[idx]}
            className="flex flex-col items-center flex-1"
          >
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${
                current
                  ? "bg-[#363062] text-white border-[#363062]"
                  : completed
                  ? "bg-[#ececec] text-[#363062] border-[#363062]"
                  : "bg-white text-[#363062] border-[#ececec]"
              }`}
            >
              {idx + 1}
            </div>
            <span className="text-xs mt-2 text-center whitespace-nowrap">
              {stepTitles[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TaskStepContent({ step }: { step: TaskStep }) {
  switch (step) {
    case 1:
      return <Step1TaskType />;
    case 2:
      return <Step2TaskDetails />;
    // case 3:
    //   return <Step3Targeting />;
    case 3:
      return <Step4QuestionsTasks />;
    case 4:
      return <Step5Review />;
    default:
      return null;
  }
}

export default function Tasks() {
  const [selectedTab, setSelectedTab] = React.useState("create");
  const { fetchTasksAndCompletions, isLoading } = useTasksStore();
  const { checkCanRefresh, updateRefreshTime } = useRefreshStore();
  const [, forceUpdate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Check if refresh is available for tasks (updated every second)
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
    // Check refresh status at the time of click
    const currentRefreshStatus = checkCanRefresh();
    
    if (!currentRefreshStatus.canRefresh) {
      toast.error(`Please wait ${currentRefreshStatus.formattedTime} before refreshing again.`);
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
      <div className={`w-full ${selectedTab === "view-tasks" ? "max-w-7xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">{getTitle()}</h1>
            <p className="text-muted-foreground">
              {getSubtitle()}
            </p>
          </div>
          {selectedTab === "view-tasks" && (
            <Button
              onClick={handleRefresh}
              disabled={isLoading || (isHydrated && !tasksRefreshStatus.canRefresh)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              title={isHydrated && !tasksRefreshStatus.canRefresh ? `Wait ${tasksRefreshStatus.formattedTime}` : ''}
            >
              {isHydrated && !tasksRefreshStatus.canRefresh ? (
                <Clock className="h-4 w-4" />
              ) : (
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              )}
              {isHydrated && !tasksRefreshStatus.canRefresh 
                ? `Refresh after ${tasksRefreshStatus.formattedTime}` 
                : 'Refresh'}
            </Button>
          )}
        </div>
        <Tabs 
          defaultValue="create" 
          className="w-full mb-6"
          value={selectedTab}
          onValueChange={setSelectedTab}
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
