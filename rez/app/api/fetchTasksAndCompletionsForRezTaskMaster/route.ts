import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireAuth } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

const HITS_PER_PAGE = 1000;
const TASK_IDS_PER_ALGOLIA_FILTER = 25;
const REWARDS_BATCH_SIZE = 10;
const SCREENINGS_BATCH_SIZE = 10;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

type CompletionRecord = {
  id: string;
  taskId: string | null;
  isValid?: boolean;
  invalidatedAt?: unknown;
  screeningId?: string | null;
};

function computeCompletionStats(
  completionRecords: CompletionRecord[],
  rewardsRef: ReturnType<typeof paxDB.collection>,
  screeningsRef: ReturnType<typeof paxDB.collection>
): Promise<{
  totalCount: number;
  validated: number;
  invalidated: number;
  expired: number;
  pending: number;
  claimed: number;
}> {
  const totalCount = completionRecords.length;
  const completionIds = completionRecords.map((c) => c.id);

  const rewardsByCompletionId = new Map<string, boolean>();
  const taskIdToCompletionIds = new Map<string, string[]>();
  completionRecords.forEach((rec) => {
    const tid = rec.taskId ?? '';
    if (!taskIdToCompletionIds.has(tid)) {
      taskIdToCompletionIds.set(tid, []);
    }
    taskIdToCompletionIds.get(tid)!.push(rec.id);
  });

  return (async () => {
    for (const [taskId, ids] of taskIdToCompletionIds) {
      if (!taskId) continue;
      for (let i = 0; i < ids.length; i += REWARDS_BATCH_SIZE) {
        const batch = ids.slice(i, i + REWARDS_BATCH_SIZE);
        const rewardsSnapshot = await rewardsRef
          .where('taskId', '==', taskId)
          .where('isPaidOutToPaxAccount', '==', true)
          .where('taskCompletionId', 'in', batch)
          .get();
        rewardsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const taskCompletionId = data?.taskCompletionId;
          if (typeof taskCompletionId === 'string') {
            rewardsByCompletionId.set(taskCompletionId, true);
          }
        });
      }
    }

    const screeningIds = [
      ...new Set(
        completionRecords
          .map((c) => (c.screeningId && c.screeningId.length > 0 ? c.screeningId : null))
          .filter((id): id is string => id !== null)
      ),
    ];

    const screeningTimeById = new Map<string, unknown>();
    for (let i = 0; i < screeningIds.length; i += SCREENINGS_BATCH_SIZE) {
      const batch = screeningIds.slice(i, i + SCREENINGS_BATCH_SIZE);
      const docRefs = batch.map((id) => screeningsRef.doc(id));
      const screeningSnaps = await paxDB.getAll(...docRefs);
      screeningSnaps.forEach((snap, idx) => {
        const screeningId = batch[idx];
        if (snap.exists && screeningId) {
          const data = snap.data();
          screeningTimeById.set(screeningId, data?.timeCreated ?? null);
        }
      });
    }

    const now = Date.now();
    let invalidated = 0;
    let validated = 0;
    let expired = 0;
    let pending = 0;
    let claimed = 0;

    completionRecords.forEach((rec) => {
      const { id: completionId, isValid, invalidatedAt, screeningId } = rec;

      if (rewardsByCompletionId.has(completionId)) {
        claimed++;
      }

      if (invalidatedAt != null) {
        invalidated++;
      } else if (isValid) {
        validated++;
      } else if (screeningId && screeningId.length > 0) {
        const screeningTimeCreated = screeningTimeById.get(screeningId);
        if (screeningTimeCreated) {
          try {
            const ts = screeningTimeCreated as { seconds?: number; _seconds?: number };
            const seconds = ts.seconds ?? ts._seconds;
            if (seconds != null) {
              const screeningTime = seconds * 1000;
              if (now - screeningTime > SIX_HOURS_MS) {
                expired++;
              } else {
                pending++;
              }
            } else {
              pending++;
            }
          } catch {
            pending++;
          }
        } else {
          pending++;
        }
      } else {
        pending++;
      }
    });

    return {
      totalCount,
      validated,
      invalidated,
      expired,
      pending,
      claimed,
    };
  })();
}

const emptyCompletionStats = {
  totalCount: 0,
  validated: 0,
  invalidated: 0,
  expired: 0,
  pending: 0,
  claimed: 0,
};

/**
 * Fetches all tasks and their completions for the authenticated Rez task master.
 * Tasks and completions use Algolia when configured; otherwise Firestore.
 * Returns completionStats (same buckets as admin taskCompletionStats) for the dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!authResult.email) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    let tasks: unknown[] = [];
    const taskIds: string[] = [];

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const filter = `rezTaskMasterEmailAddress:"${escapeAlgoliaFilterValue(authResult.email)}"`;
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: { query: '', filters: filter, hitsPerPage: 1000 },
        });
        const hits = response.hits ?? [];
        tasks = hits.map((hit: Record<string, unknown>) => {
          const { objectID, ...rest } = hit;
          return { id: objectID ?? null, ...rest };
        });
        taskIds.push(...(tasks as { id: string }[]).map((t) => t.id).filter(Boolean));
      } catch (algoliaError) {
        console.warn('Algolia fetch failed, falling back to Firestore for tasks:', algoliaError);
      }
    }

    if (tasks.length === 0) {
      const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
      const tasksSnapshot = await tasksRef
        .where('rezTaskMasterEmailAddress', '==', authResult.email)
        .get();
      tasksSnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
        taskIds.push(doc.id);
      });
    } else if (taskIds.length === 0) {
      taskIds.push(...(tasks as { id: string }[]).map((t) => t.id).filter(Boolean));
    }

    if (taskIds.length === 0) {
      return NextResponse.json({
        tasks,
        taskCompletions: [],
        completionStats: emptyCompletionStats,
      });
    }

    let taskCompletions: unknown[] = [];
    let completionRecords: CompletionRecord[] = [];

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        for (let t = 0; t < taskIds.length; t += TASK_IDS_PER_ALGOLIA_FILTER) {
          const chunk = taskIds.slice(t, t + TASK_IDS_PER_ALGOLIA_FILTER);
          const filter =
            chunk.map((id) => `taskId:"${escapeAlgoliaFilterValue(id)}"`).join(' OR ');
          let page = 0;
          let hasMore = true;
          while (hasMore) {
            const response = await client.searchSingleIndex({
              indexName: COLLECTIONS.TASK_COMPLETIONS,
              searchParams: {
                query: '',
                filters: filter,
                hitsPerPage: HITS_PER_PAGE,
                page,
              },
            });
            const hits = (response.hits ?? []) as Record<string, unknown>[];
            for (const hit of hits) {
              const id = (hit.objectID ?? hit.id) as string;
              const taskId = (hit.taskId as string) ?? null;
              taskCompletions.push({ id, ...hit });
              completionRecords.push({
                id,
                taskId,
                isValid: hit.isValid === true,
                invalidatedAt: hit.invalidatedAt ?? undefined,
                screeningId:
                  typeof hit.screeningId === 'string' ? hit.screeningId : null,
              });
            }
            const nbPages = response.nbPages ?? 0;
            hasMore = page + 1 < nbPages;
            page += 1;
          }
        }
      } catch (algoliaError) {
        console.warn(
          'Algolia completions fetch failed, falling back to Firestore:',
          algoliaError
        );
        taskCompletions = [];
        completionRecords = [];
      }
    }

    if (taskCompletions.length === 0) {
      const taskCompletionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
      const chunkSize = 30;
      for (let i = 0; i < taskIds.length; i += chunkSize) {
        const chunk = taskIds.slice(i, i + chunkSize);
        const snapshot = await taskCompletionsRef
          .where('taskId', 'in', chunk)
          .get();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          taskCompletions.push({ id: doc.id, ...data });
          completionRecords.push({
            id: doc.id,
            taskId: (data.taskId as string) ?? null,
            isValid: data.isValid === true,
            invalidatedAt: data.invalidatedAt,
            screeningId:
              typeof data.screeningId === 'string' ? data.screeningId : null,
          });
        });
      }
    }

    const rewardsRef = paxDB.collection(COLLECTIONS.REWARDS);
    const screeningsRef = paxDB.collection('screenings');
    const completionStats =
      completionRecords.length > 0
        ? await computeCompletionStats(
            completionRecords,
            rewardsRef,
            screeningsRef
          )
        : emptyCompletionStats;

    return NextResponse.json({
      tasks,
      taskCompletions,
      completionStats,
    });
  } catch (error) {
    console.error('Error fetching tasks and completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks and completions' },
      { status: 500 }
    );
  }
}
