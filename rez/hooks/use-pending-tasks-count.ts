import { useEffect, useState, useCallback } from 'react';
import { useTaskMasterStore } from '@/stores/taskmaster-store';
import { fetchWithAuthRetry } from '@/lib/api-fetch';

/**
 * Hook to get the count of pending tasks that need admin review.
 * Uses dedicated /api/admin/pendingTasksCount endpoint (count aggregation)
 * instead of fetching all tasks to avoid excessive Firestore reads.
 * Exposes refetch() so callers (e.g. sidebar) can refresh when needed.
 */
export function usePendingTasksCount() {
  const { user } = useTaskMasterStore();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(() => {
    if (!user?.isSuperAdmin) return;
    setIsLoading(true);
    fetchWithAuthRetry('/api/admin/pendingTasksCount')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') setCount(data.count);
      })
      .catch(() => setCount(0))
      .finally(() => setIsLoading(false));
  }, [user?.isSuperAdmin]);

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
    refetch,
  };
}
