"use client";

import { PlusIcon, FileIcon, RefreshCw } from "lucide-react";

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

export default function Dashboard() {
  const { tasks, taskCompletions, isLoading, error, refetch } = useTasksData({ autoFetch: false });

  // Calculate counts
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(task => task.isAvailable === true).length;
  const totalTaskCompletions = taskCompletions.length;

  return (
    <div className="min-h-screen pb-20 sm:p-4 font-[family-name:var(--font-sen)] p-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold pb-2">Dashboard Overview</h1>
            <p>Monitor your research projects and analytics at a glance.</p>
          </div>
          <Button
            onClick={refetch}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
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
