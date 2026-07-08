import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireAuth } from '@/lib/api-auth';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import {
  fetchPollInsightsDemographicsByPaxTaskId,
  fetchPollInsightsSummaryByPaxTaskId,
} from '@/services/fetchPollInsightsData';

export const maxDuration = 30;

function getCachedPollInsightsSummaryByPaxTaskId(paxTaskId: string) {
  return unstable_cache(
    async () => fetchPollInsightsSummaryByPaxTaskId(paxTaskId),
    ['poll-insights-detail-summary', paxTaskId],
    { revalidate: 120, tags: [`poll-insights-${paxTaskId}`, `poll-insights-summary-${paxTaskId}`] },
  )();
}

function getCachedPollInsightsDemographicsByPaxTaskId(paxTaskId: string) {
  return unstable_cache(
    async () => fetchPollInsightsDemographicsByPaxTaskId(paxTaskId),
    ['poll-insights-detail-demographics', paxTaskId],
    { revalidate: 120, tags: [`poll-insights-${paxTaskId}`, `poll-insights-demographics-${paxTaskId}`] },
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

    const view = request.nextUrl.searchParams.get('view') ?? 'summary';
    const summary = await getCachedPollInsightsSummaryByPaxTaskId(taskId);
    if (!summary) {
      return NextResponse.json({ error: 'Poll not found in Insights' }, { status: 404 });
    }

    if (!summary.isPublished) {
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

    if (view === 'demographics') {
      const demographics = await getCachedPollInsightsDemographicsByPaxTaskId(taskId);
      return NextResponse.json(demographics);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching poll insights:', error);
    return NextResponse.json({ error: 'Failed to fetch poll insights' }, { status: 500 });
  }
}
