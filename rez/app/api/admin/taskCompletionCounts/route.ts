import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

const MAX_TASK_IDS = 100;

/**
 * Returns completion counts per task.
 * Query: ?taskIds=id1,id2,id3
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const taskIdsParam = searchParams.get('taskIds');
    if (!taskIdsParam) {
      return NextResponse.json(
        { error: 'taskIds is required (comma-separated)' },
        { status: 400 }
      );
    }

    const taskIds = taskIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, MAX_TASK_IDS);

    if (taskIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);

    const countPromises = taskIds.map(async (taskId) => {
      const snapshot = await completionsRef
        .where('taskId', '==', taskId)
        .count()
        .get();
      return { taskId, count: snapshot.data().count };
    });

    const results = await Promise.all(countPromises);
    const counts: Record<string, number> = {};
    results.forEach(({ taskId, count }) => {
      counts[taskId] = count;
    });

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Error fetching task completion counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completion counts' },
      { status: 500 }
    );
  }
}
