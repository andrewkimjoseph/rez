import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireAuth } from '@/lib/api-auth';
import { canAccessPollInsights, getPollInsightsActor } from '@/lib/poll-insights-access';
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

    const actor = await getPollInsightsActor(authResult);
    const canAccess = await canAccessPollInsights(actor, taskId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const view = request.nextUrl.searchParams.get('view') ?? 'summary';
    const summary = await getCachedPollInsightsSummaryByPaxTaskId(taskId);
    if (!summary) {
      return NextResponse.json({ error: 'Poll not found in Insights' }, { status: 404 });
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
