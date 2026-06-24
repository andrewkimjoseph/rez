'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithAuthRetry } from '@/lib/api-fetch';

const POLL_INTERVAL_MS = 30_000;

const inFlightByUrl = new Map<string, Promise<void>>();

type UsePollInsightsQueryOptions<T> = {
  select?: (body: unknown) => T;
  enabled?: boolean;
};

type UsePollInsightsQueryResult<T> = {
  data: T | null;
  error: string | null;
  refreshError: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

export function usePollInsightsQuery<T>(
  url: string | null,
  options: UsePollInsightsQueryOptions<T> = {},
): UsePollInsightsQueryResult<T> {
  const { select, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasDataRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const selectRef = useRef(select);
  selectRef.current = select;

  const load = useCallback(
    async (isBackground = false) => {
      if (!url || !enabled) return;

      const existing = inFlightByUrl.get(url);
      if (existing) {
        await existing.catch(() => undefined);
        return;
      }

      if (isBackground) {
        if (!hasDataRef.current) return;
        setIsRefreshing(true);
      } else if (!hasDataRef.current) {
        setIsLoading(true);
      }

      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const run = (async () => {
        try {
          const response = await fetchWithAuthRetry(url, {
            method: 'GET',
            signal: abortController.signal,
            retryOnNetworkError: true,
          });
          const body = await response.json();
          if (abortController.signal.aborted) return;

          const next = selectRef.current ? selectRef.current(body) : (body as T);
          setData(next);
          setError(null);
          setRefreshError(null);
          hasDataRef.current = true;
        } catch (err) {
          if (abortController.signal.aborted) return;
          const message =
            err instanceof Error ? err.message : 'Failed to load poll insights';
          if (hasDataRef.current) {
            setRefreshError(message);
          } else {
            setError(message);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        }
      })();

      inFlightByUrl.set(url, run);
      try {
        await run;
      } finally {
        if (inFlightByUrl.get(url) === run) {
          inFlightByUrl.delete(url);
        }
      }
    },
    [url, enabled],
  );

  const refresh = useCallback(async () => {
    await load(hasDataRef.current);
  }, [load]);

  useEffect(() => {
    if (!url || !enabled) {
      setIsLoading(false);
      return;
    }

    hasDataRef.current = false;
    setData(null);
    setError(null);
    setRefreshError(null);
    setIsLoading(true);

    void load(false);

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          void load(true);
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load(true);
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      abortRef.current?.abort();
    };
  }, [url, enabled, load]);

  return {
    data,
    error,
    refreshError,
    isLoading,
    isRefreshing,
    refresh,
  };
}
