import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Fetches task completions for a specific task (admin only).
 * Task must exist and be active (isAvailable === true).
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
        { error: 'Task is not active. Only completions for active tasks can be fetched.' },
        { status: 403 }
      );
    }

    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const startAfterDocId = searchParams.get('startAfterDocId') || undefined;

    const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    const rewardsRef = paxDB.collection(COLLECTIONS.REWARDS);

    let completionsQuery = completionsRef
      .where('taskId', '==', taskId)
      .orderBy('timeCreated', 'desc')
      .limit(limit);

    if (startAfterDocId) {
      const lastDoc = await completionsRef.doc(startAfterDocId).get();
      if (lastDoc.exists) {
        completionsQuery = completionsQuery.startAfter(lastDoc);
      }
    }

    const [completionsSnapshot, rewardsSnapshot] = await Promise.all([
      completionsQuery.get(),
      rewardsRef
        .where('taskId', '==', taskId)
        .where('isPaidOutToPaxAccount', '==', true)
        .limit(500)
        .get(),
    ]);

    const rewardsByCompletionId = new Map<string, { txnHash: string }>();
    rewardsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const taskCompletionId = data?.taskCompletionId;
      const txnHash = data?.txnHash;
      if (typeof taskCompletionId === 'string' && typeof txnHash === 'string') {
        rewardsByCompletionId.set(taskCompletionId, { txnHash });
      }
    });

    type CompletionData = Record<string, unknown> & {
      participantId?: string | null;
      screeningId?: string | null;
    };
    const rawCompletions = completionsSnapshot.docs.map((doc) => {
      const data = doc.data() as CompletionData;
      const completionId = doc.id;
      const reward = rewardsByCompletionId.get(completionId);
      return {
        id: completionId,
        ...data,
        ...(reward && { reward }),
      };
    });

    const uniqueParticipantIds = [
      ...new Set(
        rawCompletions
          .map((c) => c.participantId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    ];

    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    const BATCH_SIZE = 10;
    const emailByParticipantId = new Map<string, string | null>();
    const countryByParticipantId = new Map<string, string | null>();

    for (let i = 0; i < uniqueParticipantIds.length; i += BATCH_SIZE) {
      const batch = uniqueParticipantIds.slice(i, i + BATCH_SIZE);
      const docRefs = batch.map((id) => participantsRef.doc(id));
      const participantSnaps = await paxDB.getAll(...docRefs);
      participantSnaps.forEach((snap, idx) => {
        const participantId = batch[idx];
        if (snap.exists && participantId) {
          const data = snap.data();
          const email = data?.emailAddress ?? null;
          const country = data?.country ?? null;
          emailByParticipantId.set(participantId, typeof email === 'string' ? email : null);
          countryByParticipantId.set(participantId, typeof country === 'string' ? country : null);
        }
      });
    }

    const screeningIds = [
      ...new Set(
        rawCompletions
          .map((c) => c.screeningId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    ];

    const screeningsRef = paxDB.collection('screenings');
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

    const taskCompletions = rawCompletions.map((c) => {
      const participantId = c.participantId;
      const participantEmailAddress =
        participantId != null && participantId !== ''
          ? (emailByParticipantId.get(participantId) ?? null)
          : null;
      const participantCountry =
        participantId != null && participantId !== ''
          ? (countryByParticipantId.get(participantId) ?? null)
          : null;
      const screeningId = c.screeningId;
      const screeningTimeCreated =
        screeningId != null && screeningId !== ''
          ? screeningTimeById.get(screeningId) ?? null
          : null;
      return {
        ...c,
        participantEmailAddress,
        participantCountry,
        screeningTimeCreated,
      };
    });

    const lastDoc = completionsSnapshot.docs[completionsSnapshot.docs.length - 1];
    const hasMore = completionsSnapshot.docs.length === limit;
    const nextCursor = hasMore && lastDoc ? { startAfterDocId: lastDoc.id } : null;

    return NextResponse.json({ taskCompletions, hasMore, nextCursor });
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completions' },
      { status: 500 }
    );
  }
}
