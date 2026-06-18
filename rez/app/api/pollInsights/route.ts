import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { fetchAllPublishedPollSummaries } from '@/services/fetchPollInsightsData';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const polls = await fetchAllPublishedPollSummaries();
    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Error fetching poll insights list:', error);
    return NextResponse.json({ error: 'Failed to fetch poll insights' }, { status: 500 });
  }
}
