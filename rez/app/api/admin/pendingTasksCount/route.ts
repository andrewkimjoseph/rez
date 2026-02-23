import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

/**
 * Returns the count of tasks with reviewStatus === 'pending'.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: {
            query: '',
            filters: 'reviewStatus:"pending"',
            hitsPerPage: 0,
          },
        });
        return NextResponse.json({ count: response.nbHits ?? 0 });
      } catch (algoliaError) {
        console.warn('Algolia pending tasks count failed, falling back to Firestore:', algoliaError);
      }
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const query = tasksRef.where('reviewStatus', '==', 'pending');
    const snapshot = await query.count().get();
    const count = snapshot.data().count;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching pending tasks count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending tasks count' },
      { status: 500 }
    );
  }
}
