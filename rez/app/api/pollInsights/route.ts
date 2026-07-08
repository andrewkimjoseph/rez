import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireAuth } from '@/lib/api-auth';
import { fetchAllPublishedPollSummaries } from '@/services/fetchPollInsightsData';

export const maxDuration = 30;

const getCachedPublishedPollSummaries = unstable_cache(
  async () => fetchAllPublishedPollSummaries(),
  ['poll-insights-list-v2'],
  { revalidate: 120, tags: ['poll-insights-list-v2'] },
);

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const polls = await getCachedPublishedPollSummaries();
    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Error fetching poll insights list:', error);
    return NextResponse.json({ error: 'Failed to fetch poll insights' }, { status: 500 });
  }
}
