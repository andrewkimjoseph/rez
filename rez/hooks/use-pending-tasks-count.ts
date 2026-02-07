import { useEffect, useState } from 'react';
import { useTaskMasterStore } from '@/stores/taskmaster-store';
import { fetchWithAuthRetry } from '@/lib/api-fetch';

/**
 * Hook to get the count of pending tasks that need admin review.
 * Uses dedicated /api/admin/pendingTasksCount endpoint (count aggregation)
 * instead of fetching all tasks to avoid excessive Firestore reads.
 */
export function usePendingTasksCount() {
  const { user } = useTaskMasterStore();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.isSuperAdmin) {
      setCount(0);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchWithAuthRetry('/api/admin/pendingTasksCount')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.count === 'number') {
          setCount(data.count);
        }
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.isSuperAdmin]);

  return {
    count,
    isLoading,
    hasPendingTasks: count > 0,
  };
}
