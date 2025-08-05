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
    isLoading, 
    error, 
    fetchTasksAndCompletions,
    clearTasksAndCompletions 
  } = useTasksStore();

  useEffect(() => {
    if (autoFetch && taskMaster?.emailAddress) {
      fetchTasksAndCompletions();
    } else if (!taskMaster?.emailAddress) {
      clearTasksAndCompletions();
    }
  }, [taskMaster?.emailAddress, fetchTasksAndCompletions, clearTasksAndCompletions, autoFetch]);

  return {
    tasks,
    taskCompletions,
    isLoading,
    error,
    taskMaster,
    refetch: fetchTasksAndCompletions,
  };
}; 