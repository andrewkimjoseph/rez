import { useMemo } from 'react';
import { useTasksStore } from '@/stores/tasks-store';
import { useTaskMasterStore } from '@/stores/taskmaster-store';

/**
 * Hook to get the count of rejected tasks for the current user
 */
export function useRejectedTasksCount() {
  const { tasks, isLoading } = useTasksStore();
  const { user } = useTaskMasterStore();

  const rejectedCount = useMemo(() => {
    if (!user?.emailAddress) return 0;
    
    return tasks.filter(
      (task) =>
        task.reviewStatus === 'rejected' &&
        task.rezTaskMasterEmailAddress === user.emailAddress
    ).length;
  }, [tasks, user?.emailAddress]);

  return {
    count: rejectedCount,
    isLoading,
    hasRejectedTasks: rejectedCount > 0,
  };
}
