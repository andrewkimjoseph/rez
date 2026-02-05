import { useMemo, useEffect } from 'react';
import { useAdminStore } from '@/stores/admin-store';
import { useTaskMasterStore } from '@/stores/taskmaster-store';

/**
 * Hook to get the count of pending tasks that need admin review
 */
export function usePendingTasksCount() {
  const { tasks, isLoadingTasks, fetchAllTasks } = useAdminStore();
  const { user } = useTaskMasterStore();

  // Fetch tasks if user is super admin
  useEffect(() => {
    if (user?.isSuperAdmin) {
      fetchAllTasks();
    }
  }, [user?.isSuperAdmin, fetchAllTasks]);

  const pendingCount = useMemo(() => {
    if (!user?.isSuperAdmin) return 0;
    
    return tasks.filter(
      (task) => task.reviewStatus === 'pending'
    ).length;
  }, [tasks, user?.isSuperAdmin]);

  return {
    count: pendingCount,
    isLoading: isLoadingTasks,
    hasPendingTasks: pendingCount > 0,
  };
}
