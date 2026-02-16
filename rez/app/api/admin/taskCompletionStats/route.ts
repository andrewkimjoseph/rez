import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

/**
 * Returns total completion statistics for a specific task (admin only).
 * Uses efficient count queries and minimal document reads to minimize Firestore costs.
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

    const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    const rewardsRef = paxDB.collection(COLLECTIONS.REWARDS);

    // Fetch all completions with only the fields we need for stats calculation
    // Using select() reduces read size (but still counts as 1 read per document)
    const allCompletionsSnapshot = await completionsRef
      .where('taskId', '==', taskId)
      .select('isValid', 'screeningId', 'timeCompleted', 'invalidatedAt')
      .get();

    const totalCount = allCompletionsSnapshot.size;

    // Get completion IDs for claimed check
    const completionIds = allCompletionsSnapshot.docs.map((doc) => doc.id);

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

    // Get unique screening IDs for expired/invalid calculation
    const screeningIds = [
      ...new Set(
        allCompletionsSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return typeof data.screeningId === 'string' && data.screeningId.length > 0
              ? data.screeningId
              : null;
          })
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

    // Calculate all stats in memory
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const now = Date.now();
    let completed = 0;
    let invalidated = 0;
    let validated = 0;
    let expired = 0;
    let claimed = 0;

    allCompletionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const isValid = data.isValid === true;
      const timeCompleted = data.timeCompleted;
      const invalidatedAt = data.invalidatedAt;
      const screeningId = data.screeningId;
      const completionId = doc.id;

      // Completed: has timeCompleted
      if (timeCompleted != null) {
        completed++;
      }

      // Invalidated: has invalidatedAt
      if (invalidatedAt != null) {
        invalidated++;
      }

      // Validated: isValid === true AND invalidatedAt == null
      if (isValid && invalidatedAt == null) {
        validated++;
      }

      // Claimed: has reward with txnHash
      if (rewardsByCompletionId.has(completionId)) {
        claimed++;
      }

      // Expired: invalid expired completions (not invalidated)
      if (!isValid && invalidatedAt == null && typeof screeningId === 'string' && screeningId.length > 0) {
        const screeningTimeCreated = screeningTimeById.get(screeningId);
        if (screeningTimeCreated) {
          try {
            const ts = screeningTimeCreated as { seconds?: number; _seconds?: number };
            const seconds = ts.seconds ?? ts._seconds;
            if (seconds != null) {
              const screeningTime = seconds * 1000;
              const timeSinceScreening = now - screeningTime;
              if (timeSinceScreening > twoHoursInMs) {
                expired++;
              }
            }
          } catch {
            // Skip if timestamp parsing fails
          }
        }
      }
    });

    return NextResponse.json({
      totalCount,
      completed,
      validated,
      invalidated,
      expired,
      claimed,
    });
  } catch (error) {
    console.error('Error fetching task completion stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completion stats' },
      { status: 500 }
    );
  }
}
