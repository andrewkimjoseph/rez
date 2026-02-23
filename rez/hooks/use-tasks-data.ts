import { useEffect } from 'react';
import { useTaskMasterStore } from '@/stores/taskmaster-store';
import { useTasksStore } from '@/stores/tasks-store';

interface UseTasksDataOptions {
  autoFetch?: boolean;
}

export const useTasksData = (options: UseTasksDataOptions = {}) => {
  const { autoFetch = true } = options;
  const taskMaster = useTaskMasterStore((state) => state.user);
  const { 
    tasks, 
    taskCompletions, 
    completionStats,
    isLoading, 
    error, 
    fetchTasksAndCompletions
  } = useTasksStore();

  useEffect(() => {
    if (autoFetch && taskMaster?.emailAddress) {
      fetchTasksAndCompletions();
    }
  }, [taskMaster?.emailAddress, fetchTasksAndCompletions, autoFetch]);

  return {
    tasks,
    taskCompletions,
    completionStats,
    isLoading,
    error,
    taskMaster,
    refetch: fetchTasksAndCompletions,
  };
}; 