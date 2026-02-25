import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTaskMasterStore } from '@/stores/taskmaster-store';
import { fetchWithAuthRetry } from '@/lib/api-fetch';

/**
 * Hook to get the count of pending tasks that need admin review.
 * Uses dedicated /api/admin/pendingTasksCount endpoint (count aggregation)
 * instead of fetching all tasks to avoid excessive Firestore reads.
 * Refetches when the user visits the admin dashboard so the badge stays fresh.
 */
export function usePendingTasksCount() {
  const { user } = useTaskMasterStore();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    if (!user?.isSuperAdmin) {
      setCount(0);
      return;
    }

    const isAdminDashboard = pathname === '/admin' || pathname.startsWith('/admin/');
    if (!isAdminDashboard && hasFetchedInitial.current) return;

    let cancelled = false;
    setIsLoading(true);

    fetchWithAuthRetry('/api/admin/pendingTasksCount')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.count === 'number') {
          setCount(data.count);
          hasFetchedInitial.current = true;
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
  }, [user?.isSuperAdmin, pathname]);

  return {
    count,
    isLoading,
    hasPendingTasks: count > 0,
  };
}
