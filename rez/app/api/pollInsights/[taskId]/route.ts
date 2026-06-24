import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireAuth } from '@/lib/api-auth';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { fetchPollInsightsByPaxTaskId } from '@/services/fetchPollInsightsData';

export const maxDuration = 30;

function getCachedPollInsightsByPaxTaskId(paxTaskId: string) {
  return unstable_cache(
    async () => fetchPollInsightsByPaxTaskId(paxTaskId),
    ['poll-insights-detail', paxTaskId],
    { revalidate: 30, tags: [`poll-insights-${paxTaskId}`] },
  )();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const payload = await getCachedPollInsightsByPaxTaskId(taskId);
    if (!payload) {
      return NextResponse.json({ error: 'Poll not found in Insights' }, { status: 404 });
    }

    if (!payload.isPublished) {
      const taskDoc = await paxDB.collection(COLLECTIONS.TASKS).doc(taskId).get();
      if (!taskDoc.exists) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const taskData = taskDoc.data();
      const userDoc = await rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(authResult.uid).get();
      const userEmail = (authResult.email || userDoc.data()?.emailAddress)?.toLowerCase().trim();
      const taskMasterEmail = taskData?.rezTaskMasterEmailAddress?.toLowerCase().trim();
      const isSuperAdmin = userDoc.data()?.isSuperAdmin === true;

      if (!isSuperAdmin && userEmail !== taskMasterEmail) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching poll insights:', error);
    return NextResponse.json({ error: 'Failed to fetch poll insights' }, { status: 500 });
  }
}
