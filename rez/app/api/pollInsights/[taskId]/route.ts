import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { canAccessPollInsights, getPollInsightsActor } from '@/lib/poll-insights-access';
import { insightsApiResponse } from '@/lib/insights-api';

export const maxDuration = 30;

async function streamInsights(path: string, missingMessage: string) {
  const upstream = await insightsApiResponse(path);
  if (upstream.status === 404) {
    await upstream.body?.cancel();
    return NextResponse.json({ error: missingMessage }, { status: 404 });
  }
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel();
    return NextResponse.json({ error: 'Failed to fetch poll insights' }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    },
  });
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
    const path =
      view === 'demographics'
        ? `/admin/polls/${encodeURIComponent(taskId)}/demographics`
        : `/admin/polls/${encodeURIComponent(taskId)}/summary`;
    return streamInsights(path, 'Poll not found in Insights');
  } catch (error) {
    console.error('Error fetching poll insights:', error);
    return NextResponse.json({ error: 'Failed to fetch poll insights' }, { status: 500 });
  }
}
