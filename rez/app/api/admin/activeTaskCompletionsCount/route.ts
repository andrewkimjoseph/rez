import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

const MAX_ACTIVE_TASKS = 500;
const CHUNK_SIZE = 30;

/**
 * Returns the total count of task completions across active tasks only.
 * Used for the admin dashboard card.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const activeTasksSnapshot = await tasksRef
      .where('isAvailable', '==', true)
      .limit(MAX_ACTIVE_TASKS)
      .get();

    const activeTaskIds: string[] = [];
    activeTasksSnapshot.forEach((doc) => {
      activeTaskIds.push(doc.id);
    });

    if (activeTaskIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    let totalCount = 0;

    for (let i = 0; i < activeTaskIds.length; i += CHUNK_SIZE) {
      const chunk = activeTaskIds.slice(i, i + CHUNK_SIZE);
      const countQuery = completionsRef.where('taskId', 'in', chunk);
      const countSnapshot = await countQuery.count().get();
      totalCount += countSnapshot.data().count;
    }

    return NextResponse.json({ count: totalCount });
  } catch (error) {
    console.error('Error fetching active task completions count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active task completions count' },
      { status: 500 }
    );
  }
}
