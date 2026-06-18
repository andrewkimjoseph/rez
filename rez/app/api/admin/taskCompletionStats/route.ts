import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

const HITS_PER_PAGE = 1000;

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

type CompletionRecord = { id: string; participantId?: string | null; isValid?: boolean; invalidatedAt?: unknown; screeningId?: string | null };

/**
 * Returns total completion statistics for a specific task (admin only).
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const taskDoc = await tasksRef.doc(taskId).get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();
    if (taskData?.isAvailable !== true) {
      return NextResponse.json(
        { error: 'Task is not active. Only stats for active tasks can be fetched.' },
        { status: 403 }
      );
    }

    const rewardsRef = paxDB.collection(COLLECTIONS.REWARDS);
    let completionRecords: CompletionRecord[] = [];

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const filter = `taskId:"${escapeAlgoliaFilterValue(taskId)}"`;
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
              attributesToRetrieve: ['objectID', 'participantId', 'isValid', 'screeningId', 'invalidatedAt'],
            },
          });
          const hits = (response.hits ?? []) as Record<string, unknown>[];
          for (const hit of hits) {
            const id = (hit.objectID ?? hit.id) as string;
            completionRecords.push({
              id,
              participantId: typeof hit.participantId === 'string' ? hit.participantId : null,
              isValid: hit.isValid === true,
              invalidatedAt: hit.invalidatedAt ?? undefined,
              screeningId: typeof hit.screeningId === 'string' ? hit.screeningId : null,
            });
          }
          const nbPages = response.nbPages ?? 0;
          hasMore = page + 1 < nbPages;
          page += 1;
        }
      } catch (algoliaError) {
        console.warn('Algolia task completion stats failed, falling back to Firestore:', algoliaError);
        completionRecords = [];
      }
    }

    if (completionRecords.length > 0) {
      const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
      const verifiedRecords: CompletionRecord[] = [];
      const VERIFY_BATCH_SIZE = 30;
      for (let i = 0; i < completionRecords.length; i += VERIFY_BATCH_SIZE) {
        const batch = completionRecords.slice(i, i + VERIFY_BATCH_SIZE);
        const docRefs = batch.map((c) => completionsRef.doc(c.id));
        const snaps = await paxDB.getAll(...docRefs);
        snaps.forEach((snap, idx) => {
          if (snap.exists) verifiedRecords.push(batch[idx]);
        });
      }
      completionRecords = verifiedRecords;
    }

    if (completionRecords.length === 0) {
      const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
      const allCompletionsSnapshot = await completionsRef
        .where('taskId', '==', taskId)
        .select('participantId', 'isValid', 'screeningId', 'timeCompleted', 'invalidatedAt')
        .get();
      completionRecords = allCompletionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          participantId: typeof data.participantId === 'string' ? data.participantId : null,
          isValid: data.isValid === true,
          invalidatedAt: data.invalidatedAt,
          screeningId: typeof data.screeningId === 'string' ? data.screeningId : null,
        };
      });
    }

    const uniqueParticipantIds = [
      ...new Set(
        completionRecords
          .map((c) => c.participantId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    ];
    const countryByParticipantId = new Map<string, string | null>();
    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    const PARTICIPANT_BATCH_SIZE = 30;
    for (let i = 0; i < uniqueParticipantIds.length; i += PARTICIPANT_BATCH_SIZE) {
      const batch = uniqueParticipantIds.slice(i, i + PARTICIPANT_BATCH_SIZE);
      const docRefs = batch.map((id) => participantsRef.doc(id));
      const snaps = await paxDB.getAll(...docRefs);
      snaps.forEach((snap, idx) => {
        const participantId = batch[idx];
        if (participantId) {
          const country = snap.exists ? (snap.data()?.country ?? null) : null;
          countryByParticipantId.set(participantId, typeof country === 'string' ? country : null);
        }
      });
    }

    const totalCount = completionRecords.length;
    const completionIds = completionRecords.map((c) => c.id);

    // Fetch rewards to determine claimed status
    // Batch rewards query (Firestore 'in' query limit is 10, so we need to chunk)
    const rewardsByCompletionId = new Map<string, boolean>();
    const REWARDS_BATCH_SIZE = 10;
    for (let i = 0; i < completionIds.length; i += REWARDS_BATCH_SIZE) {
      const batch = completionIds.slice(i, i + REWARDS_BATCH_SIZE);
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

    const screeningIds = [
      ...new Set(
        completionRecords
          .map((c) => (c.screeningId && c.screeningId.length > 0 ? c.screeningId : null))
          .filter((id): id is string => id !== null)
      ),
    ];

    // Batch fetch screening times
    const screeningsRef = paxDB.collection('screenings');
    const BATCH_SIZE = 10;
    const screeningTimeById = new Map<string, unknown>();

    for (let i = 0; i < screeningIds.length; i += BATCH_SIZE) {
      const batch = screeningIds.slice(i, i + BATCH_SIZE);
      const docRefs = batch.map((id) => screeningsRef.doc(id));
      const screeningSnaps = await paxDB.getAll(...docRefs);
      screeningSnaps.forEach((snap, idx) => {
        const screeningId = batch[idx];
        if (snap.exists && screeningId) {
          const data = snap.data();
          const timeCreated = data?.timeCreated ?? null;
          screeningTimeById.set(screeningId, timeCreated);
        }
      });
    }

    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const now = Date.now();
    let invalidated = 0;
    let validated = 0;
    let expired = 0;
    let pending = 0;
    let claimed = 0;

    type StatusBucket = 'all' | 'validated' | 'invalidated' | 'expired' | 'pending' | 'claimed';
    const countryByBucket: Record<StatusBucket, Record<string, number>> = {
      all: {}, validated: {}, invalidated: {}, expired: {}, pending: {}, claimed: {},
    };

    const addCountry = (bucket: StatusBucket, countryKey: string) => {
      countryByBucket[bucket][countryKey] = (countryByBucket[bucket][countryKey] ?? 0) + 1;
    };

    completionRecords.forEach((rec) => {
      const { id: completionId, isValid, invalidatedAt, screeningId, participantId } = rec;
      const rawCountry = participantId != null ? (countryByParticipantId.get(participantId) ?? null) : null;
      const countryKey = typeof rawCountry === 'string' && rawCountry.length > 0 ? rawCountry : '—';

      addCountry('all', countryKey);

      if (rewardsByCompletionId.has(completionId)) {
        claimed++;
        addCountry('claimed', countryKey);
      }

      if (invalidatedAt != null) {
        invalidated++;
        addCountry('invalidated', countryKey);
      } else if (isValid) {
        validated++;
        addCountry('validated', countryKey);
      } else if (screeningId && screeningId.length > 0) {
        const screeningTimeCreated = screeningTimeById.get(screeningId);
        if (screeningTimeCreated) {
          try {
            const ts = screeningTimeCreated as { seconds?: number; _seconds?: number };
            const seconds = ts.seconds ?? ts._seconds;
            if (seconds != null) {
              const screeningTime = seconds * 1000;
              const timeSinceScreening = now - screeningTime;
              if (timeSinceScreening > sixHoursInMs) {
                expired++;
                addCountry('expired', countryKey);
              } else {
                pending++;
                addCountry('pending', countryKey);
              }
            } else {
              pending++;
              addCountry('pending', countryKey);
            }
          } catch {
            pending++;
            addCountry('pending', countryKey);
          }
        } else {
          pending++;
          addCountry('pending', countryKey);
        }
      } else {
        pending++;
        addCountry('pending', countryKey);
      }
    });

    return NextResponse.json({
      totalCount,
      validated,
      invalidated,
      expired,
      pending,
      claimed,
      countryTotalsByStatus: countryByBucket,
    });
  } catch (error) {
    console.error('Error fetching task completion stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completion stats' },
      { status: 500 }
    );
  }
}
